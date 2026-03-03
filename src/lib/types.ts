export type GamePhase =
  | "lobby"
  | "role-reveal"
  | "narration"
  | "team-building"
  | "team-vote"
  | "team-vote-results"
  | "quest-vote"
  | "quest-results"
  | "assassin"
  | "game-over";

export type Role =
  | "merlin"
  | "percival"
  | "loyal-servant"
  | "assassin"
  | "morgana"
  | "mordred"
  | "oberon"
  | "minion";

export type Team = "good" | "evil";

export interface RoleConfig {
  percival: boolean;
  morgana: boolean;
  mordred: boolean;
  oberon: boolean;
}

export type ActionId =
  | "set-role-config"
  | "kick-player"
  | "start-game"
  | "set-ready"
  | "start-narration"
  | "propose-team"
  | "submit-team-vote"
  | "submit-quest-vote"
  | "submit-assassin-target"
  | "restart-lobby";

export interface DisconnectBlocker {
  disconnectedPlayerId: string;
  phase: "team-vote" | "quest-vote";
  expiresAt: number;
  fallbackAction: "reject-team-vote" | "auto-success-quest-vote";
}

export interface NarrationStep {
  id: string;
  caption: string;
  spokenText: string;
  durationMs: number;
  knowledgeRecipients?: Role[];
}

export interface NarrationState {
  steps: NarrationStep[];
  startedAt: number;
  durationMs: number;
  mode: "speech" | "captions-only";
  speakerPlayerId: string;
}

export interface PlayerState {
  playerId: string;
  sessionId: string;
  name: string;
  joinedAt: number;
  isConnected: boolean;
  role?: Role;
  team?: Team;
  roleRevealed: boolean;
  ready: boolean;
  submittedTeamVote?: boolean;
  submittedQuestVote?: boolean;
}

export interface QuestState {
  index: number;
  teamSize: number;
  requiresTwoFails: boolean;
  status: "pending" | "passed" | "failed";
  proposedTeamPlayerIds: string[];
  teamVotes?: Record<string, boolean>;
  questVotes?: { success: number; fail: number };
  questVoteSelections?: Record<string, "success" | "fail">;
}

export interface LastQuestResult {
  success: number;
  fail: number;
  passed: boolean;
}

export interface GameRoomState {
  code: string;
  phase: GamePhase;
  players: PlayerState[];
  hostPlayerId: string;
  leaderIndex: number;
  settings: RoleConfig;
  quests: QuestState[];
  currentQuestIndex: number;
  consecutiveRejections: number;
  narration?: NarrationState;
  blocker?: DisconnectBlocker;
  winner?: Team;
  winningReason?: "quests" | "assassination" | "rejections" | "room-expired";
  assassinTargetPlayerId?: string;
  publicVoteResults?: Record<string, boolean>;
  lastTeamVoteApproved?: boolean;
  lastQuestResult?: LastQuestResult;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerPublicView {
  playerId: string;
  name: string;
  isConnected: boolean;
  isHost: boolean;
  isLeader: boolean;
  ready: boolean;
  onQuestTeam: boolean;
  submitted: boolean;
}

export interface QuestPublicView {
  index: number;
  teamSize: number;
  requiresTwoFails: boolean;
  status: "pending" | "passed" | "failed";
  proposedTeamPlayerIds: string[];
  questVotes?: { success: number; fail: number };
}

export interface SecretKnowledgeItem {
  kind: "player" | "pair" | "note";
  label: string;
  playerIds?: string[];
}

export interface SharedRoomView {
  code: string;
  phase: GamePhase;
  hostPlayerId: string;
  leaderPlayerId: string;
  currentQuestIndex: number;
  consecutiveRejections: number;
  quests: QuestPublicView[];
  settings: RoleConfig;
  players: PlayerPublicView[];
  blocker?: DisconnectBlocker;
  winner?: Team;
  winningReason?: GameRoomState["winningReason"];
  publicVoteResults?: Record<string, boolean>;
  narration?: NarrationState;
  assassinTargetPlayerId?: string;
  revealedRoles?: Record<string, Role>;
}

export interface PrivatePlayerView {
  playerId: string;
  name: string;
  role?: Role;
  team?: Team;
  secretKnowledge: SecretKnowledgeItem[];
  roleSummaryVisible: boolean;
  allowedActions: ActionId[];
  pendingSelections?: string[];
}

export type ErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_EXISTS"
  | "ROOM_FULL"
  | "GAME_ALREADY_STARTED"
  | "UNAUTHORIZED"
  | "INVALID_ACTION"
  | "INVALID_PAYLOAD"
  | "PLAYER_NOT_FOUND"
  | "ALREADY_JOINED"
  | "ROOM_EXPIRED";

export interface JoinRoomPayload {
  roomCode: string;
  name: string;
  sessionId: string;
  intent: "create" | "join";
}

export type ClientMessage =
  | { type: "join_room"; payload: JoinRoomPayload }
  | { type: "set_role_config"; payload: RoleConfig }
  | { type: "kick_player"; payload: { playerId: string } }
  | { type: "start_game" }
  | { type: "set_ready"; payload: { ready: boolean } }
  | { type: "start_narration"; payload: { captionsOnly: boolean } }
  | { type: "propose_team"; payload: { playerIds: string[] } }
  | { type: "submit_team_vote"; payload: { approve: boolean } }
  | { type: "submit_quest_vote"; payload: { vote: "success" | "fail" } }
  | { type: "submit_assassin_target"; payload: { playerId: string } }
  | { type: "restart_lobby" }
  | { type: "ping" };

export type ServerMessage =
  | { type: "snapshot"; payload: { room: SharedRoomView; you: PrivatePlayerView } }
  | {
      type: "narration_schedule";
      payload: {
        steps: NarrationStep[];
        startedAt: number;
        mode: "speech" | "captions-only";
        speakerPlayerId: string;
      };
    }
  | { type: "notice"; payload: { level: "info" | "success" | "warning"; message: string } }
  | { type: "error"; payload: { code: ErrorCode; message: string } };

export interface PendingJoinIntent {
  roomCode: string;
  name: string;
  intent: "create" | "join";
}

export interface RoomSessionRecord {
  sessionId: string;
  name: string;
  lastIntent: "create" | "join";
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";
