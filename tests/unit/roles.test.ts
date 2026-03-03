import { describe, expect, it } from "vitest";

import { buildRoleDeck, deriveSecretKnowledge, validateRoleConfig } from "@/lib/roles";
import { createLobbyState, startGame } from "@/lib/game-logic";
import type { GameRoomState } from "@/lib/types";

describe("role validation", () => {
  it("rejects too many optional evil roles at five players", () => {
    const errors = validateRoleConfig(5, {
      percival: false,
      morgana: true,
      mordred: true,
      oberon: true
    });

    expect(errors).toHaveLength(1);
  });

  it("builds the correct deck for a seven-player Percival/Morgana game", () => {
    const deck = buildRoleDeck(7, {
      percival: true,
      morgana: true,
      mordred: false,
      oberon: false
    });

    expect(deck).toContain("merlin");
    expect(deck).toContain("percival");
    expect(deck).toContain("morgana");
    expect(deck).toContain("assassin");
    expect(deck.filter((role) => role === "loyal-servant")).toHaveLength(2);
    expect(deck.filter((role) => role === "minion")).toHaveLength(1);
  });
});

describe("secret knowledge", () => {
  it("keeps Mordred hidden from Merlin", () => {
    let room: GameRoomState = createLobbyState("ABCDE", "Host", "s1");
    room = {
      ...room,
      players: [
        room.players[0],
        { ...room.players[0], playerId: "p2", sessionId: "s2", name: "B" },
        { ...room.players[0], playerId: "p3", sessionId: "s3", name: "C" },
        { ...room.players[0], playerId: "p4", sessionId: "s4", name: "D" },
        { ...room.players[0], playerId: "p5", sessionId: "s5", name: "E" }
      ]
    };

    room = startGame(
      {
        ...room,
        settings: {
          percival: false,
          morgana: false,
          mordred: true,
          oberon: false
        }
      },
      room.hostPlayerId,
      () => 0
    );

    const merlin = room.players.find((player) => player.role === "merlin");
    const mordred = room.players.find((player) => player.role === "mordred");

    expect(merlin).toBeTruthy();
    expect(mordred).toBeTruthy();

    const knowledge = deriveSecretKnowledge(room, merlin!.playerId);
    expect(knowledge.some((item) => item.playerIds?.includes(mordred!.playerId))).toBe(false);
  });
});
