import type { GamePhase, Role, RoleConfig, Team } from "@/lib/types";

export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const DEFAULT_ROLE_CONFIG: RoleConfig = {
  percival: false,
  morgana: false,
  mordred: false,
  oberon: false
};

export const PLAYER_TEAM_COUNTS: Record<number, { good: number; evil: number }> = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 }
};

export const QUEST_TEAM_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
};

export const RESULT_PHASE_DURATION_MS = 3_500;
export const DISCONNECT_BLOCKER_MS = 30_000;
export const ROOM_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ROOM_ABANDON_TIMEOUT_MS = 10 * 60 * 1000;

export const PHASE_TITLES: Record<GamePhase, string> = {
  lobby: "Gather the Court",
  "role-reveal": "Reveal Your Oath",
  narration: "Nightfall Ceremony",
  "team-building": "Choose the Questing Party",
  "team-vote": "Council Vote",
  "team-vote-results": "Council Verdict",
  "quest-vote": "Quest in Secret",
  "quest-results": "Quest Unsealed",
  assassin: "Assassin's Guess",
  "game-over": "The Kingdom Decides"
};

export const ROLE_DETAILS: Record<
  Role,
  { team: Team; label: string; summary: string; artPath: string }
> = {
  merlin: {
    team: "good",
    label: "Merlin",
    summary: "Knows the evil players, except Mordred.",
    artPath: "/roles/merlin.png"
  },
  percival: {
    team: "good",
    label: "Percival",
    summary: "Can identify Merlin and possibly Morgana.",
    artPath: "/roles/percival.png"
  },
  "loyal-servant": {
    team: "good",
    label: "Loyal Servant",
    summary: "Has no secret knowledge, but must protect Merlin.",
    artPath: "/roles/loyal-servant.png"
  },
  assassin: {
    team: "evil",
    label: "Assassin",
    summary: "If good wins three quests, may assassinate Merlin.",
    artPath: "/roles/assassin.png"
  },
  morgana: {
    team: "evil",
    label: "Morgana",
    summary: "Appears as Merlin to Percival.",
    artPath: "/roles/morgana.png"
  },
  mordred: {
    team: "evil",
    label: "Mordred",
    summary: "Hidden from Merlin's sight.",
    artPath: "/roles/mordred.png"
  },
  oberon: {
    team: "evil",
    label: "Oberon",
    summary: "Unknown to other evil players and sees nobody.",
    artPath: "/roles/oberon.png"
  },
  minion: {
    team: "evil",
    label: "Minion",
    summary: "Knows the other evil players.",
    artPath: "/roles/minion.png"
  }
};

export const ROLE_ORDER: Role[] = [
  "merlin",
  "percival",
  "loyal-servant",
  "assassin",
  "morgana",
  "mordred",
  "oberon",
  "minion"
];

export function getTeamCounts(playerCount: number) {
  return PLAYER_TEAM_COUNTS[playerCount];
}

