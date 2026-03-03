import type * as Party from "partykit/server";

import {
  GameLogicError,
  addPlayer,
  advanceAfterQuestResults,
  advanceAfterTeamVoteResults,
  applyBlockerExpiry,
  applyRoleConfig,
  canJoinExistingRoom,
  completeNarration,
  createLobbyState,
  kickPlayer,
  markPlayerDisconnected,
  proposeTeam,
  reconnectPlayer,
  restartLobby,
  sanitizeRoomForPlayer,
  setPlayerReady,
  startGame,
  startNarration,
  submitAssassinTarget,
  submitQuestVote,
  submitTeamVote
} from "../src/lib/game-logic";
import { ROOM_ABANDON_TIMEOUT_MS } from "../src/lib/constants";
import { parseClientMessage } from "../src/lib/validation";
import type { ClientMessage, ErrorCode, GameRoomState, ServerMessage } from "../src/lib/types";

export default class GameServer implements Party.Server {
  readonly options = { hibernate: true };

  private roomState: GameRoomState | null = null;
  private connections = new Map<string, Party.Connection>();
  private connectionToPlayer = new Map<string, string>();
  private narrationTimer?: ReturnType<typeof setTimeout>;
  private resultTimer?: ReturnType<typeof setTimeout>;
  private blockerTimer?: ReturnType<typeof setTimeout>;
  private abandonTimer?: ReturnType<typeof setTimeout>;

  constructor(readonly room: Party.Room) {}

  onConnect(connection: Party.Connection) {
    this.connections.set(connection.id, connection);
    this.send(connection, {
      type: "notice",
      payload: { level: "info", message: "Connected to the Avalon room server." }
    });
  }

  onClose(connection: Party.Connection) {
    const playerId = this.connectionToPlayer.get(connection.id);
    this.connections.delete(connection.id);
    this.connectionToPlayer.delete(connection.id);

    if (!this.roomState || !playerId || [...this.connectionToPlayer.values()].includes(playerId)) {
      this.scheduleAbandonIfNeeded();
      return;
    }

    try {
      this.roomState = markPlayerDisconnected(this.roomState, playerId);
      this.afterStateChange();
    } catch {
      // Ignore disconnect cleanup failures so the room can continue operating.
    }
  }

  onMessage(rawMessage: string, connection: Party.Connection) {
    let message: ClientMessage;

    try {
      message = parseClientMessage(rawMessage);
    } catch (error) {
      this.sendError(connection, "INVALID_PAYLOAD", "The client message could not be parsed.");
      return;
    }

    if (message.type === "ping") {
      this.send(connection, {
        type: "notice",
        payload: { level: "info", message: "pong" }
      });
      return;
    }

    if (message.type === "join_room") {
      this.handleJoin(connection, message);
      return;
    }

    const playerId = this.connectionToPlayer.get(connection.id);

    if (!this.roomState || !playerId) {
      this.sendError(connection, "UNAUTHORIZED", "Join the room before sending game actions.");
      return;
    }

    try {
      this.roomState = this.handlePlayerAction(this.roomState, playerId, message);
      this.afterStateChange();
    } catch (error) {
      this.handleError(connection, error);
    }
  }

  private handleJoin(connection: Party.Connection, message: Extract<ClientMessage, { type: "join_room" }>) {
    const payload = {
      ...message.payload,
      roomCode: message.payload.roomCode.toUpperCase(),
      name: message.payload.name.trim()
    };

    try {
      if (!this.roomState) {
        if (payload.intent !== "create") {
          throw new GameLogicError("ROOM_NOT_FOUND", "No room exists for that code yet.");
        }

        this.roomState = createLobbyState(payload.roomCode, payload.name, payload.sessionId);
      } else if (!canJoinExistingRoom(this.roomState, payload)) {
        throw new GameLogicError(
          "GAME_ALREADY_STARTED",
          "This match has already begun. Only reconnecting players may rejoin."
        );
      } else if (
        this.roomState.phase === "lobby" &&
        payload.intent === "create" &&
        !this.roomState.players.some((player) => player.sessionId === payload.sessionId)
      ) {
        throw new GameLogicError("ROOM_EXISTS", "That room code is already taken.");
      }

      const existing = this.roomState.players.find((player) => player.sessionId === payload.sessionId);

      if (existing) {
        const result = reconnectPlayer(this.roomState, payload.sessionId);
        this.roomState = result.room;
        this.connectionToPlayer.set(connection.id, result.player.playerId);
      } else {
        this.roomState = addPlayer(this.roomState, payload.name, payload.sessionId);
        const created = this.roomState.players.at(-1);

        if (!created) {
          throw new GameLogicError("PLAYER_NOT_FOUND", "Failed to create the joining player.");
        }

        this.connectionToPlayer.set(connection.id, created.playerId);
      }

      this.send(connection, {
        type: "notice",
        payload: {
          level: "success",
          message: `Joined room ${payload.roomCode}.`
        }
      });

      this.afterStateChange();
    } catch (error) {
      this.handleError(connection, error);
    }
  }

  private handlePlayerAction(room: GameRoomState, playerId: string, message: Exclude<ClientMessage, { type: "join_room" | "ping" }>) {
    switch (message.type) {
      case "set_role_config":
        return applyRoleConfig(room, playerId, message.payload);
      case "kick_player":
        return kickPlayer(room, playerId, message.payload.playerId);
      case "start_game":
        return startGame(room, playerId);
      case "set_ready":
        return setPlayerReady(room, playerId, message.payload.ready);
      case "start_narration":
        return startNarration(room, playerId, message.payload.captionsOnly);
      case "propose_team":
        return proposeTeam(room, playerId, message.payload.playerIds);
      case "submit_team_vote":
        return submitTeamVote(room, playerId, message.payload.approve);
      case "submit_quest_vote":
        return submitQuestVote(room, playerId, message.payload.vote);
      case "submit_assassin_target":
        return submitAssassinTarget(room, playerId, message.payload.playerId);
      case "restart_lobby":
        return restartLobby(room, playerId);
      default:
        return room;
    }
  }

  private afterStateChange() {
    this.clearPhaseTimers();

    if (!this.roomState) {
      return;
    }

    this.syncSnapshots();

    if (this.roomState.phase === "narration" && this.roomState.narration) {
      const { narration } = this.roomState;

      this.broadcast({
        type: "narration_schedule",
        payload: {
          steps: narration.steps,
          startedAt: narration.startedAt,
          mode: narration.mode,
          speakerPlayerId: narration.speakerPlayerId
        }
      });

      this.narrationTimer = setTimeout(() => {
        if (!this.roomState || this.roomState.phase !== "narration") {
          return;
        }

        this.roomState = completeNarration(this.roomState);
        this.afterStateChange();
      }, narration.durationMs + 750);
    }

    if (this.roomState.phase === "team-vote-results" && this.roomState.winner !== "evil") {
      this.resultTimer = setTimeout(() => {
        if (!this.roomState || this.roomState.phase !== "team-vote-results") {
          return;
        }

        this.roomState = advanceAfterTeamVoteResults(this.roomState);
        this.afterStateChange();
      }, 3_500);
    }

    if (this.roomState.phase === "quest-results") {
      this.resultTimer = setTimeout(() => {
        if (!this.roomState || this.roomState.phase !== "quest-results") {
          return;
        }

        this.roomState = advanceAfterQuestResults(this.roomState);
        this.afterStateChange();
      }, 3_500);
    }

    if (this.roomState.blocker) {
      const delay = Math.max(0, this.roomState.blocker.expiresAt - Date.now());
      this.blockerTimer = setTimeout(() => {
        if (!this.roomState?.blocker) {
          return;
        }

        this.roomState = applyBlockerExpiry(this.roomState);
        this.afterStateChange();
      }, delay);
    }

    this.scheduleAbandonIfNeeded();
  }

  private syncSnapshots() {
    if (!this.roomState) {
      return;
    }

    for (const [connectionId, connection] of this.connections.entries()) {
      const playerId = this.connectionToPlayer.get(connectionId);

      if (!playerId) {
        continue;
      }

      try {
        const snapshot = sanitizeRoomForPlayer(this.roomState, playerId);
        this.send(connection, { type: "snapshot", payload: snapshot });
      } catch {
        // Ignore snapshots for stale connections that have not yet completed join.
      }
    }
  }

  private scheduleAbandonIfNeeded() {
    if (this.abandonTimer) {
      clearTimeout(this.abandonTimer);
      this.abandonTimer = undefined;
    }

    if (!this.roomState) {
      return;
    }

    const connectedCount = this.roomState.players.filter((player) => player.isConnected).length;

    if (connectedCount > 0) {
      return;
    }

    this.abandonTimer = setTimeout(() => {
      this.roomState = null;
      this.connectionToPlayer.clear();
      this.clearPhaseTimers();
    }, ROOM_ABANDON_TIMEOUT_MS);
  }

  private clearPhaseTimers() {
    if (this.narrationTimer) {
      clearTimeout(this.narrationTimer);
      this.narrationTimer = undefined;
    }

    if (this.resultTimer) {
      clearTimeout(this.resultTimer);
      this.resultTimer = undefined;
    }

    if (this.blockerTimer) {
      clearTimeout(this.blockerTimer);
      this.blockerTimer = undefined;
    }
  }

  private handleError(connection: Party.Connection, error: unknown) {
    if (error instanceof GameLogicError) {
      this.sendError(connection, error.code, error.message);
      return;
    }

    this.sendError(connection, "INVALID_ACTION", "The requested action could not be completed.");
  }

  private sendError(connection: Party.Connection, code: ErrorCode, message: string) {
    this.send(connection, {
      type: "error",
      payload: { code, message }
    });
  }

  private broadcast(message: ServerMessage) {
    for (const connection of this.connections.values()) {
      this.send(connection, message);
    }
  }

  private send(connection: Party.Connection, message: ServerMessage) {
    connection.send(JSON.stringify(message));
  }
}
