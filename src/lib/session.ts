import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@/lib/constants";
import type { PendingJoinIntent, RoomSessionRecord } from "@/lib/types";

const PENDING_JOIN_KEY = "avalon:pending-join";

export function getRoomSessionKey(roomCode: string) {
  return `avalon:player:${roomCode.toUpperCase()}`;
}

export function generateRoomCode() {
  const chars = ROOM_CODE_ALPHABET;
  let output = "";

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    const random = getRandomInt(chars.length);
    output += chars[random];
  }

  return output;
}

export function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function persistPendingJoin(intent: PendingJoinIntent) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_JOIN_KEY, JSON.stringify(intent));
}

export function readPendingJoin() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PENDING_JOIN_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingJoinIntent;
  } catch {
    return null;
  }
}

export function consumePendingJoin(roomCode: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const current = readPendingJoin();

  if (!current || current.roomCode.toUpperCase() !== roomCode.toUpperCase()) {
    return null;
  }

  window.sessionStorage.removeItem(PENDING_JOIN_KEY);
  return current;
}

export function readRoomSession(roomCode: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getRoomSessionKey(roomCode));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RoomSessionRecord;
  } catch {
    return null;
  }
}

export function writeRoomSession(roomCode: string, record: RoomSessionRecord) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getRoomSessionKey(roomCode), JSON.stringify(record));
}

function getRandomInt(max: number) {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % max;
  }

  return Math.floor(Math.random() * max);
}

