"use client";

import { create } from "zustand";

import type {
  ConnectionStatus,
  ErrorCode,
  NarrationState,
  PrivatePlayerView,
  SharedRoomView
} from "@/lib/types";

interface NoticeItem {
  id: string;
  level: "info" | "success" | "warning";
  message: string;
}

interface GameStore {
  room: SharedRoomView | null;
  you: PrivatePlayerView | null;
  connectionStatus: ConnectionStatus;
  notices: NoticeItem[];
  lastError: { code: ErrorCode | "SOCKET_ERROR"; message: string } | null;
  roleCardRevealed: boolean;
  privateIntelOpen: boolean;
  pendingTeamSelection: string[];
  forceCaptionsOnly: boolean;
  activeNarration: NarrationState | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  applySnapshot: (payload: { room: SharedRoomView; you: PrivatePlayerView }) => void;
  pushNotice: (notice: { level: NoticeItem["level"]; message: string }) => void;
  setError: (error: { code: ErrorCode | "SOCKET_ERROR"; message: string } | null) => void;
  dismissNotice: (id: string) => void;
  setRoleCardRevealed: (revealed: boolean) => void;
  setPrivateIntelOpen: (open: boolean) => void;
  setPendingTeamSelection: (ids: string[]) => void;
  togglePendingTeamSelection: (playerId: string, max: number) => void;
  clearPendingTeamSelection: () => void;
  setForceCaptionsOnly: (forced: boolean) => void;
  setActiveNarration: (narration: NarrationState | null) => void;
  reset: () => void;
}

type GameStoreState = Pick<
  GameStore,
  | "room"
  | "you"
  | "connectionStatus"
  | "notices"
  | "lastError"
  | "roleCardRevealed"
  | "privateIntelOpen"
  | "pendingTeamSelection"
  | "forceCaptionsOnly"
  | "activeNarration"
>;

const initialState: GameStoreState = {
  room: null,
  you: null,
  connectionStatus: "idle",
  notices: [],
  lastError: null,
  roleCardRevealed: false,
  privateIntelOpen: false,
  pendingTeamSelection: [],
  forceCaptionsOnly: false,
  activeNarration: null
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  applySnapshot: ({ room, you }) =>
    set((state) => ({
      room,
      you,
      activeNarration: room.narration ?? null,
      roleCardRevealed: room.phase === "role-reveal" ? state.roleCardRevealed : false,
      privateIntelOpen: room.phase === "lobby" ? false : state.privateIntelOpen,
      pendingTeamSelection:
        room.phase === "team-building" ? state.pendingTeamSelection : [],
      lastError: null
    })),
  pushNotice: ({ level, message }) =>
    set((state) => ({
      notices: [...state.notices, { id: createId("notice"), level, message }].slice(-4)
    })),
  setError: (lastError) => set({ lastError }),
  dismissNotice: (id) =>
    set((state) => ({ notices: state.notices.filter((notice) => notice.id !== id) })),
  setRoleCardRevealed: (roleCardRevealed) => set({ roleCardRevealed }),
  setPrivateIntelOpen: (privateIntelOpen) => set({ privateIntelOpen }),
  setPendingTeamSelection: (pendingTeamSelection) => set({ pendingTeamSelection }),
  togglePendingTeamSelection: (playerId, max) =>
    set((state) => {
      if (state.pendingTeamSelection.includes(playerId)) {
        return {
          pendingTeamSelection: state.pendingTeamSelection.filter((entry) => entry !== playerId)
        };
      }

      if (state.pendingTeamSelection.length >= max) {
        return state;
      }

      return {
        pendingTeamSelection: [...state.pendingTeamSelection, playerId]
      };
    }),
  clearPendingTeamSelection: () => set({ pendingTeamSelection: [] }),
  setForceCaptionsOnly: (forceCaptionsOnly) => set({ forceCaptionsOnly }),
  setActiveNarration: (activeNarration) => set({ activeNarration }),
  reset: () => set(initialState)
}));

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
