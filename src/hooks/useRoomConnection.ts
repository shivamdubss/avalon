"use client";

import { useEffect, useMemo, useRef } from "react";
import PartySocket from "partysocket";

import { resolvePartyKitSocketOptions } from "@/lib/party";
import { createSessionId, readRoomSession, writeRoomSession } from "@/lib/session";
import type { ClientMessage, PendingJoinIntent, ServerMessage } from "@/lib/types";
import { useGameStore } from "@/store/game-store";

export function useRoomConnection(roomCode: string, joinIntent: PendingJoinIntent | null) {
  const socketRef = useRef<PartySocket | null>(null);
  const manualCloseRef = useRef(false);
  const setConnectionStatus = useGameStore((state) => state.setConnectionStatus);
  const applySnapshot = useGameStore((state) => state.applySnapshot);
  const pushNotice = useGameStore((state) => state.pushNotice);
  const setError = useGameStore((state) => state.setError);
  const setActiveNarration = useGameStore((state) => state.setActiveNarration);
  const socketOptions = useMemo(
    () =>
      resolvePartyKitSocketOptions({
        envHost: process.env.NEXT_PUBLIC_PARTYKIT_HOST,
        envProtocol: process.env.NEXT_PUBLIC_PARTYKIT_PROTOCOL,
        location: typeof window === "undefined" ? undefined : window.location
      }),
    []
  );
  const isLocalRoomServer =
    socketOptions.host.startsWith("127.0.0.1") ||
    socketOptions.host.startsWith("localhost") ||
    socketOptions.host.startsWith("::1") ||
    socketOptions.host.startsWith("[::1]");

  const connectionConfig = useMemo(() => {
    if (!joinIntent) {
      return null;
    }

    const existing = readRoomSession(roomCode);
    const sessionId = existing?.sessionId ?? createSessionId();

    return {
      sessionId,
      name: joinIntent.name,
      lastIntent: joinIntent.intent
    };
  }, [joinIntent, roomCode]);

  useEffect(() => {
    if (!connectionConfig) {
      return;
    }

    writeRoomSession(roomCode, connectionConfig);
  }, [connectionConfig, roomCode]);

  useEffect(() => {
    if (!joinIntent || !connectionConfig) {
      setConnectionStatus("idle");
      return;
    }

    manualCloseRef.current = false;
    setConnectionStatus("connecting");

    const socket = new PartySocket({
      ...socketOptions,
      room: roomCode,
      party: "game"
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
      setError(null);

      sendMessage({
        type: "join_room",
        payload: {
          roomCode,
          name: joinIntent.name,
          sessionId: connectionConfig.sessionId,
          intent: joinIntent.intent
        }
      });
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data as string) as ServerMessage;

      if (data.type === "snapshot") {
        applySnapshot(data.payload);
        setActiveNarration(data.payload.room.narration ?? null);
      } else if (data.type === "narration_schedule") {
        setActiveNarration({
          steps: data.payload.steps,
          startedAt: data.payload.startedAt,
          mode: data.payload.mode,
          speakerPlayerId: data.payload.speakerPlayerId,
          durationMs: data.payload.steps.reduce((total, step) => total + step.durationMs, 0)
        });
      } else if (data.type === "notice") {
        pushNotice(data.payload);
      } else if (data.type === "error") {
        setError(data.payload);
        pushNotice({ level: "warning", message: data.payload.message });
      }
    });

    socket.addEventListener("close", () => {
      if (manualCloseRef.current) {
        setConnectionStatus("disconnected");
      } else {
        setConnectionStatus("reconnecting");
      }
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("error");
      setError({
        code: "SOCKET_ERROR",
        message: isLocalRoomServer
          ? `The connection to the room server failed (${socketOptions.host}). Start it with \`npm run dev\` or \`npm run dev:party\`.`
          : `The connection to the room server failed (${socketOptions.host}).`
      });
    });

    return () => {
      manualCloseRef.current = true;
      socket.close();
      socketRef.current = null;
    };
  }, [
    applySnapshot,
    connectionConfig,
    joinIntent,
    isLocalRoomServer,
    pushNotice,
    roomCode,
    socketOptions,
    setActiveNarration,
    setConnectionStatus,
    setError
  ]);

  function sendMessage(message: ClientMessage) {
    socketRef.current?.send(JSON.stringify(message));
  }

  return {
    sendMessage,
    sessionId: connectionConfig?.sessionId ?? null
  };
}
