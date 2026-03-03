import {
  DEFAULT_ROLE_CONFIG,
  DISCONNECT_BLOCKER_MS,
  QUEST_TEAM_SIZES
} from "@/lib/constants";
import { buildNarrationSteps, getNarrationDuration } from "@/lib/narration";
import { assignRoles, deriveSecretKnowledge, findPlayerByRole, validateRoleConfig } from "@/lib/roles";
import type {
  ActionId,
  DisconnectBlocker,
  ErrorCode,
  GameRoomState,
  JoinRoomPayload,
  PlayerPublicView,
  PlayerState,
  PrivatePlayerView,
  QuestPublicView,
  QuestState,
  RoleConfig,
  SharedRoomView
} from "@/lib/types";

export class GameLogicError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function createLobbyState(
  code: string,
  hostName: string,
  sessionId: string,
  now = Date.now()
): GameRoomState {
  const host = createPlayerState(hostName, sessionId, now);

  return {
    code: code.toUpperCase(),
    phase: "lobby",
    players: [host],
    hostPlayerId: host.playerId,
    leaderIndex: 0,
    settings: DEFAULT_ROLE_CONFIG,
    quests: [],
    currentQuestIndex: 0,
    consecutiveRejections: 0,
    createdAt: now,
    updatedAt: now
  } satisfies GameRoomState;
}

export function addPlayer(room: GameRoomState, name: string, sessionId: string, now = Date.now()) {
  const next = cloneRoom(room);

  assertPhase(next, "lobby");

  if (next.players.length >= 10) {
    throw new GameLogicError("ROOM_FULL", "The room is already full.");
  }

  if (next.players.some((player) => player.sessionId === sessionId)) {
    throw new GameLogicError("ALREADY_JOINED", "This session is already in the room.");
  }

  next.players.push(createPlayerState(normalizePlayerName(next.players, name), sessionId, now));
  next.updatedAt = now;

  return next;
}

export function reconnectPlayer(room: GameRoomState, sessionId: string, now = Date.now()) {
  const next = cloneRoom(room);
  const player = next.players.find((entry) => entry.sessionId === sessionId);

  if (!player) {
    throw new GameLogicError("PLAYER_NOT_FOUND", "No matching player could be reconnected.");
  }

  player.isConnected = true;
  next.blocker = next.blocker?.disconnectedPlayerId === player.playerId ? undefined : next.blocker;
  next.updatedAt = now;

  return { room: next, player };
}

export function markPlayerDisconnected(room: GameRoomState, playerId: string, now = Date.now()) {
  const next = cloneRoom(room);
  const player = getRequiredPlayer(next, playerId);
  player.isConnected = false;

  if (next.hostPlayerId === playerId) {
    next.hostPlayerId = getNextConnectedPlayerId(next, playerId) ?? next.hostPlayerId;
  }

  if (next.phase === "team-building" && currentLeader(next)?.playerId === playerId) {
    next.leaderIndex = getNextLeaderIndex(next, next.leaderIndex);
  }

  if (shouldCreateBlocker(next, playerId)) {
    next.blocker = buildDisconnectBlocker(next.phase, playerId, now);
  }

  next.updatedAt = now;
  return next;
}

export function applyRoleConfig(room: GameRoomState, actorId: string, config: RoleConfig, now = Date.now()) {
  const next = cloneRoom(room);

  assertPhase(next, "lobby");
  assertHost(next, actorId);

  const errors = validateRoleConfig(next.players.length, config);

  if (errors.length > 0) {
    throw new GameLogicError("INVALID_ACTION", errors.join(" "));
  }

  next.settings = config;
  next.updatedAt = now;
  return next;
}

export function kickPlayer(room: GameRoomState, actorId: string, targetId: string, now = Date.now()) {
  const next = cloneRoom(room);

  assertPhase(next, "lobby");
  assertHost(next, actorId);

  if (actorId === targetId) {
    throw new GameLogicError("INVALID_ACTION", "The host cannot kick themselves.");
  }

  const targetIndex = next.players.findIndex((entry) => entry.playerId === targetId);

  if (targetIndex === -1) {
    throw new GameLogicError("PLAYER_NOT_FOUND", "That player is not in the lobby.");
  }

  next.players.splice(targetIndex, 1);
  next.leaderIndex = Math.max(0, Math.min(next.leaderIndex, next.players.length - 1));
  next.updatedAt = now;

  return next;
}

export function startGame(
  room: GameRoomState,
  actorId: string,
  randomSource?: () => number,
  now = Date.now()
) {
  const next = cloneRoom(room);

  assertPhase(next, "lobby");
  assertHost(next, actorId);

  if (next.players.length < 5 || next.players.length > 10) {
    throw new GameLogicError("INVALID_ACTION", "Avalon requires 5 to 10 players.");
  }

  if (next.players.some((player) => !player.isConnected)) {
    throw new GameLogicError("INVALID_ACTION", "All players must be connected before the game starts.");
  }

  const configErrors = validateRoleConfig(next.players.length, next.settings);

  if (configErrors.length > 0) {
    throw new GameLogicError("INVALID_ACTION", configErrors.join(" "));
  }

  next.players = assignRoles(next.players, next.settings, randomSource);
  next.quests = buildQuestTrack(next.players.length);
  next.currentQuestIndex = 0;
  next.consecutiveRejections = 0;
  next.phase = "role-reveal";
  next.narration = undefined;
  next.blocker = undefined;
  next.winner = undefined;
  next.winningReason = undefined;
  next.assassinTargetPlayerId = undefined;
  next.publicVoteResults = undefined;
  next.lastTeamVoteApproved = undefined;
  next.lastQuestResult = undefined;
  next.updatedAt = now;

  return next;
}

export function setPlayerReady(room: GameRoomState, actorId: string, ready: boolean, now = Date.now()) {
  const next = cloneRoom(room);

  assertPhase(next, "role-reveal");

  const player = getRequiredPlayer(next, actorId);
  player.ready = ready;
  player.roleRevealed = true;
  next.updatedAt = now;

  return next;
}

export function allConnectedPlayersReady(room: GameRoomState) {
  return room.players.filter((player) => player.isConnected).every((player) => player.ready);
}

export function startNarration(
  room: GameRoomState,
  actorId: string,
  captionsOnly: boolean,
  now = Date.now()
) {
  const next = cloneRoom(room);

  assertPhase(next, "role-reveal");
  assertHost(next, actorId);

  if (!allConnectedPlayersReady(next)) {
    throw new GameLogicError("INVALID_ACTION", "Every connected player must be ready.");
  }

  const steps = buildNarrationSteps(next.settings);
  next.phase = "narration";
  next.narration = {
    steps,
    startedAt: now + 500,
    durationMs: getNarrationDuration(steps),
    mode: captionsOnly ? "captions-only" : "speech",
    speakerPlayerId: actorId
  };
  next.updatedAt = now;

  return next;
}

export function completeNarration(room: GameRoomState, now = Date.now()) {
  const next = cloneRoom(room);
  assertPhase(next, "narration");
  next.phase = "team-building";
  next.narration = undefined;
  next.updatedAt = now;
  return next;
}

export function proposeTeam(room: GameRoomState, actorId: string, playerIds: string[], now = Date.now()) {
  const next = cloneRoom(room);
  const quest = getCurrentQuest(next);
  const leader = currentLeader(next);

  assertPhase(next, "team-building");

  if (!leader || leader.playerId !== actorId) {
    throw new GameLogicError("UNAUTHORIZED", "Only the current leader can propose the team.");
  }

  if (new Set(playerIds).size !== playerIds.length) {
    throw new GameLogicError("INVALID_ACTION", "A proposed team cannot contain duplicates.");
  }

  if (playerIds.length !== quest.teamSize) {
    throw new GameLogicError("INVALID_ACTION", `This quest requires exactly ${quest.teamSize} players.`);
  }

  for (const playerId of playerIds) {
    getRequiredPlayer(next, playerId);
  }

  quest.proposedTeamPlayerIds = [...playerIds];
  quest.teamVotes = {};
  quest.questVotes = undefined;
  quest.questVoteSelections = undefined;
  next.phase = "team-vote";
  next.publicVoteResults = undefined;
  next.lastTeamVoteApproved = undefined;

  for (const player of next.players) {
    if (!player.isConnected) {
      player.submittedTeamVote = true;
      quest.teamVotes[player.playerId] = false;
    } else {
      player.submittedTeamVote = false;
    }

    player.submittedQuestVote = false;
  }

  next.updatedAt = now;

  return resolveTeamVoteIfReady(next, now);
}

export function submitTeamVote(room: GameRoomState, actorId: string, approve: boolean, now = Date.now()) {
  const next = cloneRoom(room);
  const player = getRequiredPlayer(next, actorId);
  const quest = getCurrentQuest(next);

  assertPhase(next, "team-vote");

  if (player.submittedTeamVote) {
    throw new GameLogicError("INVALID_ACTION", "This player has already voted.");
  }

  player.submittedTeamVote = true;
  quest.teamVotes = {
    ...(quest.teamVotes ?? {}),
    [actorId]: approve
  };
  next.updatedAt = now;

  return resolveTeamVoteIfReady(next, now);
}

export function advanceAfterTeamVoteResults(room: GameRoomState, now = Date.now()) {
  const next = cloneRoom(room);
  const quest = getCurrentQuest(next);

  assertPhase(next, "team-vote-results");

  if (next.lastTeamVoteApproved) {
    next.phase = "quest-vote";
    next.publicVoteResults = undefined;
    quest.questVoteSelections = {};

    for (const playerId of quest.proposedTeamPlayerIds) {
      const player = getRequiredPlayer(next, playerId);

      if (!player.isConnected) {
        player.submittedQuestVote = true;
        quest.questVoteSelections[playerId] = "success";
      } else {
        player.submittedQuestVote = false;
      }
    }

    next.updatedAt = now;
    return resolveQuestVoteIfReady(next, now);
  }

  next.phase = "team-building";
  next.leaderIndex = getNextLeaderIndex(next, next.leaderIndex);
  quest.proposedTeamPlayerIds = [];
  quest.teamVotes = undefined;
  next.publicVoteResults = undefined;
  next.lastTeamVoteApproved = undefined;
  next.updatedAt = now;

  for (const player of next.players) {
    player.submittedTeamVote = false;
  }

  return next;
}

export function submitQuestVote(
  room: GameRoomState,
  actorId: string,
  vote: "success" | "fail",
  now = Date.now()
) {
  const next = cloneRoom(room);
  const player = getRequiredPlayer(next, actorId);
  const quest = getCurrentQuest(next);

  assertPhase(next, "quest-vote");

  if (!quest.proposedTeamPlayerIds.includes(actorId)) {
    throw new GameLogicError("UNAUTHORIZED", "Only the selected quest team may vote.");
  }

  if (player.submittedQuestVote) {
    throw new GameLogicError("INVALID_ACTION", "This player has already voted.");
  }

  if (player.team === "good" && vote === "fail") {
    throw new GameLogicError("INVALID_ACTION", "Good players must vote success on quests.");
  }

  player.submittedQuestVote = true;
  quest.questVoteSelections = {
    ...(quest.questVoteSelections ?? {}),
    [actorId]: vote
  };
  next.updatedAt = now;

  return resolveQuestVoteIfReady(next, now);
}

export function advanceAfterQuestResults(room: GameRoomState, now = Date.now()) {
  const next = cloneRoom(room);

  assertPhase(next, "quest-results");

  next.currentQuestIndex += 1;
  next.phase = "team-building";
  next.leaderIndex = getNextLeaderIndex(next, next.leaderIndex);
  next.lastQuestResult = undefined;
  next.updatedAt = now;

  for (const player of next.players) {
    player.submittedQuestVote = false;
    player.submittedTeamVote = false;
  }

  return next;
}

export function submitAssassinTarget(room: GameRoomState, actorId: string, targetId: string, now = Date.now()) {
  const next = cloneRoom(room);
  const assassin = findPlayerByRole(next, "assassin");

  assertPhase(next, "assassin");

  if (!assassin || assassin.playerId !== actorId) {
    throw new GameLogicError("UNAUTHORIZED", "Only the Assassin may make the final choice.");
  }

  const target = getRequiredPlayer(next, targetId);
  next.assassinTargetPlayerId = target.playerId;
  next.phase = "game-over";
  next.winner = target.role === "merlin" ? "evil" : "good";
  next.winningReason = target.role === "merlin" ? "assassination" : "quests";
  next.updatedAt = now;

  return next;
}

export function restartLobby(room: GameRoomState, actorId: string, now = Date.now()) {
  const next = cloneRoom(room);

  assertPhase(next, "game-over");
  assertHost(next, actorId);

  next.phase = "lobby";
  next.quests = [];
  next.currentQuestIndex = 0;
  next.consecutiveRejections = 0;
  next.narration = undefined;
  next.blocker = undefined;
  next.winner = undefined;
  next.winningReason = undefined;
  next.assassinTargetPlayerId = undefined;
  next.publicVoteResults = undefined;
  next.lastTeamVoteApproved = undefined;
  next.lastQuestResult = undefined;
  next.updatedAt = now;

  next.players = next.players.map((player) => ({
    ...player,
    role: undefined,
    team: undefined,
    roleRevealed: false,
    ready: false,
    submittedQuestVote: false,
    submittedTeamVote: false
  }));

  next.leaderIndex = next.players.findIndex((player) => player.playerId === next.hostPlayerId);
  if (next.leaderIndex < 0) {
    next.leaderIndex = 0;
  }

  return next;
}

export function applyBlockerExpiry(room: GameRoomState, now = Date.now()) {
  if (!room.blocker) {
    return room;
  }

  const next = cloneRoom(room);
  const blocker = next.blocker;

  if (!blocker) {
    return next;
  }

  next.blocker = undefined;

  if (blocker.phase === "team-vote" && next.phase === "team-vote") {
    const quest = getCurrentQuest(next);
    quest.teamVotes = {
      ...(quest.teamVotes ?? {}),
      [blocker.disconnectedPlayerId]: false
    };
    const player = getRequiredPlayer(next, blocker.disconnectedPlayerId);
    player.submittedTeamVote = true;
    return resolveTeamVoteIfReady(next, now);
  }

  if (blocker.phase === "quest-vote" && next.phase === "quest-vote") {
    const quest = getCurrentQuest(next);
    quest.questVoteSelections = {
      ...(quest.questVoteSelections ?? {}),
      [blocker.disconnectedPlayerId]: "success"
    };
    const player = getRequiredPlayer(next, blocker.disconnectedPlayerId);
    player.submittedQuestVote = true;
    return resolveQuestVoteIfReady(next, now);
  }

  next.updatedAt = now;
  return next;
}

export function sanitizeRoomForPlayer(room: GameRoomState, playerId: string) {
  const player = getRequiredPlayer(room, playerId);
  const currentQuest = room.quests[room.currentQuestIndex];

  const shared: SharedRoomView = {
    code: room.code,
    phase: room.phase,
    hostPlayerId: room.hostPlayerId,
    leaderPlayerId: currentLeader(room)?.playerId ?? room.hostPlayerId,
    currentQuestIndex: room.currentQuestIndex,
    consecutiveRejections: room.consecutiveRejections,
    quests: room.quests.map((quest) => toQuestPublicView(quest)),
    settings: room.settings,
    players: room.players.map((entry) => toPlayerPublicView(room, currentQuest, entry)),
    blocker: room.blocker,
    winner: room.winner,
    winningReason: room.winningReason,
    publicVoteResults: room.phase === "team-vote-results" ? room.publicVoteResults : undefined,
    narration: room.phase === "narration" ? room.narration : undefined,
    assassinTargetPlayerId: room.phase === "game-over" ? room.assassinTargetPlayerId : undefined,
    revealedRoles:
      room.phase === "game-over"
        ? Object.fromEntries(
            room.players
              .filter((entry) => entry.role)
              .map((entry) => [entry.playerId, entry.role!])
          )
        : undefined
  };

  const privateView: PrivatePlayerView = {
    playerId: player.playerId,
    name: player.name,
    role: player.role,
    team: player.team,
    secretKnowledge:
      room.phase === "lobby" || room.phase === "role-reveal"
        ? []
        : deriveSecretKnowledge(room, player.playerId),
    roleSummaryVisible: room.phase !== "lobby" && Boolean(player.role),
    allowedActions: getAllowedActions(room, player.playerId),
    pendingSelections:
      room.phase === "team-building" && currentLeader(room)?.playerId === playerId
        ? currentQuest?.proposedTeamPlayerIds
        : undefined
  };

  return { room: shared, you: privateView };
}

export function getAllowedActions(room: GameRoomState, playerId: string): ActionId[] {
  const player = room.players.find((entry) => entry.playerId === playerId);

  if (!player) {
    return [];
  }

  const actions: ActionId[] = [];
  const isHost = room.hostPlayerId === playerId;
  const quest = room.quests[room.currentQuestIndex];

  if (room.phase === "lobby" && isHost) {
    actions.push("set-role-config", "kick-player");

    if (
      room.players.length >= 5 &&
      room.players.length <= 10 &&
      room.players.every((entry) => entry.isConnected) &&
      validateRoleConfig(room.players.length, room.settings).length === 0
    ) {
      actions.push("start-game");
    }
  }

  if (room.phase === "role-reveal") {
    actions.push("set-ready");

    if (isHost && allConnectedPlayersReady(room)) {
      actions.push("start-narration");
    }
  }

  if (room.phase === "team-building" && currentLeader(room)?.playerId === playerId) {
    actions.push("propose-team");
  }

  if (room.phase === "team-vote" && !player.submittedTeamVote) {
    actions.push("submit-team-vote");
  }

  if (
    room.phase === "quest-vote" &&
    quest?.proposedTeamPlayerIds.includes(playerId) &&
    !player.submittedQuestVote
  ) {
    actions.push("submit-quest-vote");
  }

  if (room.phase === "assassin" && player.role === "assassin" && player.isConnected) {
    actions.push("submit-assassin-target");
  }

  if (room.phase === "game-over" && isHost) {
    actions.push("restart-lobby");
  }

  return actions;
}

export function normalizePlayerName(players: PlayerState[], desiredName: string) {
  const base = desiredName.trim().replace(/\s+/g, " ").slice(0, 24) || "Player";
  let candidate = base;
  let suffix = 2;

  while (players.some((player) => player.name.toLowerCase() === candidate.toLowerCase())) {
    candidate = `${base} ${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function canJoinExistingRoom(room: GameRoomState, payload: JoinRoomPayload) {
  if (room.phase === "lobby") {
    return true;
  }

  return room.players.some((player) => player.sessionId === payload.sessionId);
}

function buildQuestTrack(playerCount: number): QuestState[] {
  return QUEST_TEAM_SIZES[playerCount].map((teamSize, index) => ({
    index,
    teamSize,
    requiresTwoFails: index === 3 && playerCount >= 7,
    status: "pending",
    proposedTeamPlayerIds: []
  }));
}

function createPlayerState(name: string, sessionId: string, now: number): PlayerState {
  return {
    playerId: createId("player"),
    sessionId,
    name,
    joinedAt: now,
    isConnected: true,
    roleRevealed: false,
    ready: false
  };
}

function resolveTeamVoteIfReady(room: GameRoomState, now: number) {
  const quest = getCurrentQuest(room);
  const votes = quest.teamVotes ?? {};

  if (Object.keys(votes).length < room.players.length) {
    return room;
  }

  const approvals = Object.values(votes).filter(Boolean).length;
  const approved = approvals > room.players.length / 2;
  room.phase = approved ? "team-vote-results" : "team-vote-results";
  room.publicVoteResults = votes;
  room.lastTeamVoteApproved = approved;
  room.updatedAt = now;

  if (approved) {
    room.consecutiveRejections = 0;
    return room;
  }

  room.consecutiveRejections += 1;

  if (room.consecutiveRejections >= 5) {
    room.phase = "game-over";
    room.winner = "evil";
    room.winningReason = "rejections";
  }

  return room;
}

function resolveQuestVoteIfReady(room: GameRoomState, now: number) {
  const quest = getCurrentQuest(room);
  const selections = quest.questVoteSelections ?? {};

  if (Object.keys(selections).length < quest.proposedTeamPlayerIds.length) {
    return room;
  }

  const votes = Object.values(selections);
  const fail = votes.filter((vote) => vote === "fail").length;
  const success = votes.length - fail;
  const passed = quest.requiresTwoFails ? fail < 2 : fail === 0;

  quest.questVotes = { success, fail };
  quest.questVoteSelections = undefined;
  quest.status = passed ? "passed" : "failed";
  room.lastQuestResult = { success, fail, passed };
  room.updatedAt = now;

  for (const player of room.players) {
    player.submittedQuestVote = false;
  }

  const passedQuests = room.quests.filter((entry) => entry.status === "passed").length;
  const failedQuests = room.quests.filter((entry) => entry.status === "failed").length;

  if (passedQuests >= 3) {
    room.phase = "assassin";
    return room;
  }

  if (failedQuests >= 3) {
    room.phase = "game-over";
    room.winner = "evil";
    room.winningReason = "quests";
    return room;
  }

  room.phase = "quest-results";
  return room;
}

function currentLeader(room: GameRoomState) {
  return room.players[room.leaderIndex];
}

function getCurrentQuest(room: GameRoomState) {
  const quest = room.quests[room.currentQuestIndex];

  if (!quest) {
    throw new GameLogicError("INVALID_ACTION", "The current quest could not be found.");
  }

  return quest;
}

function toPlayerPublicView(
  room: GameRoomState,
  currentQuest: QuestState | undefined,
  player: PlayerState
): PlayerPublicView {
  return {
    playerId: player.playerId,
    name: player.name,
    isConnected: player.isConnected,
    isHost: room.hostPlayerId === player.playerId,
    isLeader: currentLeader(room)?.playerId === player.playerId,
    ready: player.ready,
    onQuestTeam: Boolean(currentQuest?.proposedTeamPlayerIds.includes(player.playerId)),
    submitted:
      room.phase === "team-vote"
        ? Boolean(player.submittedTeamVote)
        : room.phase === "quest-vote"
          ? Boolean(player.submittedQuestVote)
          : false
  };
}

function toQuestPublicView(quest: QuestState): QuestPublicView {
  return {
    index: quest.index,
    teamSize: quest.teamSize,
    requiresTwoFails: quest.requiresTwoFails,
    status: quest.status,
    proposedTeamPlayerIds: quest.proposedTeamPlayerIds,
    questVotes: quest.status === "pending" ? undefined : quest.questVotes
  };
}

function shouldCreateBlocker(room: GameRoomState, playerId: string) {
  if (room.blocker) {
    return false;
  }

  const quest = room.quests[room.currentQuestIndex];

  if (room.phase === "team-vote") {
    return quest?.teamVotes?.[playerId] === undefined;
  }

  if (room.phase === "quest-vote") {
    return Boolean(quest?.proposedTeamPlayerIds.includes(playerId) && !quest.questVoteSelections?.[playerId]);
  }

  return false;
}

function buildDisconnectBlocker(phase: GameRoomState["phase"], disconnectedPlayerId: string, now: number) {
  if (phase === "team-vote") {
    return {
      disconnectedPlayerId,
      phase,
      expiresAt: now + DISCONNECT_BLOCKER_MS,
      fallbackAction: "reject-team-vote"
    } satisfies DisconnectBlocker;
  }

  return {
    disconnectedPlayerId,
    phase: "quest-vote",
    expiresAt: now + DISCONNECT_BLOCKER_MS,
    fallbackAction: "auto-success-quest-vote"
  } satisfies DisconnectBlocker;
}

function getRequiredPlayer(room: GameRoomState, playerId: string) {
  const player = room.players.find((entry) => entry.playerId === playerId);

  if (!player) {
    throw new GameLogicError("PLAYER_NOT_FOUND", "That player is not in the room.");
  }

  return player;
}

function getNextLeaderIndex(room: GameRoomState, fromIndex: number) {
  if (room.players.length === 0) {
    return 0;
  }

  for (let offset = 1; offset <= room.players.length; offset += 1) {
    const candidateIndex = (fromIndex + offset) % room.players.length;
    if (room.players[candidateIndex]?.isConnected) {
      return candidateIndex;
    }
  }

  return (fromIndex + 1) % room.players.length;
}

function getNextConnectedPlayerId(room: GameRoomState, excludingPlayerId?: string) {
  return (
    room.players.find((player) => player.playerId !== excludingPlayerId && player.isConnected)?.playerId ??
    room.players.find((player) => player.playerId !== excludingPlayerId)?.playerId
  );
}

function assertPhase(room: GameRoomState, expected: GameRoomState["phase"]) {
  if (room.phase !== expected) {
    throw new GameLogicError("INVALID_ACTION", `This action is only available during ${expected}.`);
  }
}

function assertHost(room: GameRoomState, playerId: string) {
  if (room.hostPlayerId !== playerId) {
    throw new GameLogicError("UNAUTHORIZED", "Only the host may do that.");
  }
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneRoom(room: GameRoomState) {
  return structuredClone(room);
}
