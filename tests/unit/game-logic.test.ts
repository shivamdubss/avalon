import { describe, expect, it } from "vitest";

import {
  advanceAfterQuestResults,
  advanceAfterTeamVoteResults,
  applyBlockerExpiry,
  createLobbyState,
  proposeTeam,
  restartLobby,
  startGame,
  submitQuestVote,
  submitTeamVote
} from "@/lib/game-logic";

function buildFivePlayerRoom() {
  let room = createLobbyState("ABCDE", "A", "s1");
  room = { ...room, players: [...room.players] };

  for (const [index, name] of ["B", "C", "D", "E"].entries()) {
    room.players.push({
      ...room.players[0],
      playerId: `p${index + 2}`,
      sessionId: `s${index + 2}`,
      name
    });
  }

  return startGame(room, room.hostPlayerId, () => 0.1);
}

describe("team vote flow", () => {
  it("rejects ties and advances the leader", () => {
    let room = buildFivePlayerRoom();
    room.phase = "team-building";
    room = proposeTeam(room, room.players[0].playerId, room.players.slice(0, 2).map((player) => player.playerId));

    room = submitTeamVote(room, room.players[0].playerId, true);
    room = submitTeamVote(room, room.players[1].playerId, true);
    room = submitTeamVote(room, room.players[2].playerId, false);
    room = submitTeamVote(room, room.players[3].playerId, false);
    room = submitTeamVote(room, room.players[4].playerId, false);

    expect(room.phase).toBe("team-vote-results");
    expect(room.lastTeamVoteApproved).toBe(false);

    const advanced = advanceAfterTeamVoteResults(room);
    expect(advanced.phase).toBe("team-building");
    expect(advanced.leaderIndex).toBe(1);
  });
});

describe("quest flow", () => {
  it("moves to assassin after three successful quests", () => {
    let room = buildFivePlayerRoom();

    for (let questNumber = 0; questNumber < 3; questNumber += 1) {
      room.phase = "team-building";
      const teamSize = room.quests[room.currentQuestIndex].teamSize;
      const questTeam = room.players.slice(0, teamSize).map((player) => player.playerId);
      room = proposeTeam(room, room.players[room.leaderIndex].playerId, questTeam);
      room = submitTeamVote(room, room.players[0].playerId, true);
      room = submitTeamVote(room, room.players[1].playerId, true);
      room = submitTeamVote(room, room.players[2].playerId, true);
      room = submitTeamVote(room, room.players[3].playerId, false);
      room = submitTeamVote(room, room.players[4].playerId, true);
      room = advanceAfterTeamVoteResults(room);

      for (const player of room.players.slice(0, teamSize)) {
        room = submitQuestVote(room, player.playerId, "success");
      }

      if (questNumber < 2) {
        room = advanceAfterQuestResults(room);
      }
    }

    expect(room.phase).toBe("assassin");
  });

  it("applies a disconnect fallback to quest votes", () => {
    let room = buildFivePlayerRoom();
    room.phase = "team-building";
    room = proposeTeam(room, room.players[0].playerId, room.players.slice(0, 2).map((player) => player.playerId));
    room = submitTeamVote(room, room.players[0].playerId, true);
    room = submitTeamVote(room, room.players[1].playerId, true);
    room = submitTeamVote(room, room.players[2].playerId, true);
    room = submitTeamVote(room, room.players[3].playerId, true);
    room = submitTeamVote(room, room.players[4].playerId, true);
    room = advanceAfterTeamVoteResults(room);

    room.blocker = {
      disconnectedPlayerId: room.players[1].playerId,
      phase: "quest-vote",
      expiresAt: Date.now(),
      fallbackAction: "auto-success-quest-vote"
    };
    room = submitQuestVote(room, room.players[0].playerId, "success");

    const resolved = applyBlockerExpiry(room);
    expect(resolved.phase).toBe("quest-results");
    expect(resolved.quests[0].questVotes).toEqual({ success: 2, fail: 0 });
  });
});

describe("lobby restart", () => {
  it("resets the room back to lobby", () => {
    const started = buildFivePlayerRoom();
    const room = restartLobby(
      {
        ...started,
        phase: "game-over",
        winner: "good"
      },
      started.hostPlayerId
    );

    expect(room.phase).toBe("lobby");
    expect(room.players.every((player) => !player.role)).toBe(true);
  });
});
