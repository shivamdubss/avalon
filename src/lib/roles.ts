import { DEFAULT_ROLE_CONFIG, PLAYER_TEAM_COUNTS, ROLE_DETAILS } from "@/lib/constants";
import type { GameRoomState, PlayerState, Role, RoleConfig, SecretKnowledgeItem, Team } from "@/lib/types";

export function getRoleTeam(role: Role): Team {
  return ROLE_DETAILS[role].team;
}

export function validateRoleConfig(playerCount: number, config: RoleConfig = DEFAULT_ROLE_CONFIG) {
  const counts = PLAYER_TEAM_COUNTS[playerCount];

  if (!counts) {
    return ["Avalon requires 5 to 10 players."];
  }

  const optionalGood = Number(config.percival);
  const optionalEvil = Number(config.morgana) + Number(config.mordred) + Number(config.oberon);
  const maxOptionalGood = counts.good - 1;
  const maxOptionalEvil = counts.evil - 1;
  const errors: string[] = [];

  if (optionalGood > maxOptionalGood) {
    errors.push(`This player count supports at most ${maxOptionalGood} optional good role(s).`);
  }

  if (optionalEvil > maxOptionalEvil) {
    errors.push(`This player count supports at most ${maxOptionalEvil} optional evil role(s).`);
  }

  return errors;
}

export function buildRoleDeck(playerCount: number, config: RoleConfig = DEFAULT_ROLE_CONFIG) {
  const counts = PLAYER_TEAM_COUNTS[playerCount];

  if (!counts) {
    throw new Error("Unsupported player count.");
  }

  const errors = validateRoleConfig(playerCount, config);

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const goodRoles: Role[] = ["merlin"];
  const evilRoles: Role[] = ["assassin"];

  if (config.percival) {
    goodRoles.push("percival");
  }

  if (config.morgana) {
    evilRoles.push("morgana");
  }

  if (config.mordred) {
    evilRoles.push("mordred");
  }

  if (config.oberon) {
    evilRoles.push("oberon");
  }

  while (goodRoles.length < counts.good) {
    goodRoles.push("loyal-servant");
  }

  while (evilRoles.length < counts.evil) {
    evilRoles.push("minion");
  }

  return [...goodRoles, ...evilRoles];
}

export function assignRoles(
  players: PlayerState[],
  config: RoleConfig = DEFAULT_ROLE_CONFIG,
  randomSource: () => number = createRandomSource()
) {
  const deck = shuffle(buildRoleDeck(players.length, config), randomSource);

  return players.map((player, index) => {
    const role = deck[index];
    return {
      ...player,
      role,
      team: getRoleTeam(role),
      ready: false,
      roleRevealed: false,
      submittedQuestVote: false,
      submittedTeamVote: false
    };
  });
}

export function deriveSecretKnowledge(room: GameRoomState, playerId: string): SecretKnowledgeItem[] {
  const player = room.players.find((entry) => entry.playerId === playerId);

  if (!player?.role) {
    return [];
  }

  const evilExceptOberon = room.players.filter(
    (entry) => entry.team === "evil" && entry.role !== "oberon"
  );
  const evilVisibleToMerlin = room.players.filter(
    (entry) => entry.team === "evil" && entry.role !== "mordred"
  );

  switch (player.role) {
    case "merlin": {
      return evilVisibleToMerlin
        .filter((entry) => entry.playerId !== player.playerId)
        .map((entry) => ({
          kind: "player" as const,
          label: `${entry.name} appears aligned with evil.`,
          playerIds: [entry.playerId]
        }));
    }
    case "percival": {
      const candidates = room.players.filter(
        (entry) => entry.role === "merlin" || entry.role === "morgana"
      );

      if (candidates.length === 0) {
        return [{ kind: "note", label: "No special knowledge has been revealed." }];
      }

      return [
        {
          kind: "pair",
          label:
            candidates.length === 1
              ? `${candidates[0].name} is Merlin.`
              : `${candidates.map((entry) => entry.name).join(" and ")} are Merlin and Morgana.`,
          playerIds: candidates.map((entry) => entry.playerId)
        }
      ];
    }
    case "oberon":
      return [{ kind: "note", label: "You act alone. The other evil players do not know you." }];
    case "assassin":
    case "morgana":
    case "mordred":
    case "minion": {
      const visibleAllies = evilExceptOberon.filter((entry) => entry.playerId !== player.playerId);
      const notes = visibleAllies.map((entry) => ({
        kind: "player" as const,
        label: `${entry.name} is allied with evil.`,
        playerIds: [entry.playerId]
      }));

      const oberon = room.players.find((entry) => entry.role === "oberon");

      if (oberon) {
        notes.push({
          kind: "note",
          label: "Oberon is in play but remains hidden from the evil team."
        });
      }

      return notes.length > 0 ? notes : [{ kind: "note", label: "You have no visible evil allies." }];
    }
    default:
      return [{ kind: "note", label: "You begin with no private information." }];
  }
}

export function findPlayerByRole(room: GameRoomState, role: Role) {
  return room.players.find((player) => player.role === role);
}

export function getPlayerName(room: GameRoomState, playerId: string) {
  return room.players.find((entry) => entry.playerId === playerId)?.name ?? playerId;
}

export function getRoleLabel(role: Role) {
  return ROLE_DETAILS[role].label;
}

function shuffle<T>(items: T[], randomSource: () => number) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomSource() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

function createRandomSource() {
  return () => {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      const values = new Uint32Array(1);
      crypto.getRandomValues(values);
      return values[0] / 4_294_967_295;
    }

    return Math.random();
  };
}
