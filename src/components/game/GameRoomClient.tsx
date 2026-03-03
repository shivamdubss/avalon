"use client";

import { useEffect, useMemo, useState } from "react";

import { GameBoardShell } from "@/components/game/GameBoardShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createSpeechRunner } from "@/lib/narration";
import { consumePendingJoin, readRoomSession } from "@/lib/session";
import type { PendingJoinIntent, RoleConfig } from "@/lib/types";
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useGameStore } from "@/store/game-store";

export function GameRoomClient({ roomCode }: { roomCode: string }) {
  const normalizedCode = roomCode.toUpperCase();
  const room = useGameStore((state) => state.room);
  const you = useGameStore((state) => state.you);
  const notices = useGameStore((state) => state.notices);
  const lastError = useGameStore((state) => state.lastError);
  const connectionStatus = useGameStore((state) => state.connectionStatus);
  const roleCardRevealed = useGameStore((state) => state.roleCardRevealed);
  const privateIntelOpen = useGameStore((state) => state.privateIntelOpen);
  const pendingTeamSelection = useGameStore((state) => state.pendingTeamSelection);
  const forceCaptionsOnly = useGameStore((state) => state.forceCaptionsOnly);
  const setRoleCardRevealed = useGameStore((state) => state.setRoleCardRevealed);
  const setPrivateIntelOpen = useGameStore((state) => state.setPrivateIntelOpen);
  const togglePendingTeamSelection = useGameStore((state) => state.togglePendingTeamSelection);
  const setForceCaptionsOnly = useGameStore((state) => state.setForceCaptionsOnly);
  const activeNarration = useGameStore((state) => state.activeNarration);
  const resetStore = useGameStore((state) => state.reset);
  const [joinIntent, setJoinIntent] = useState<PendingJoinIntent | null>(null);
  const [directName, setDirectName] = useState("");
  const { sendMessage } = useRoomConnection(normalizedCode, joinIntent);

  useEffect(() => {
    resetStore();
    return resetStore;
  }, [resetStore]);

  useEffect(() => {
    const pending = consumePendingJoin(normalizedCode);

    if (pending) {
      setJoinIntent(pending);
      setDirectName(pending.name);
      return;
    }

    const existing = readRoomSession(normalizedCode);

    if (existing) {
      setJoinIntent({
        roomCode: normalizedCode,
        name: existing.name,
        intent: "join"
      });
      setDirectName(existing.name);
    }
  }, [normalizedCode]);

  useEffect(() => {
    if (!activeNarration || !you || activeNarration.speakerPlayerId !== you.playerId) {
      return;
    }

    if (activeNarration.mode !== "speech") {
      return;
    }

    const runner = createSpeechRunner(activeNarration.steps);
    runner.start(activeNarration.startedAt);

    return () => runner.stop();
  }, [activeNarration, you]);

  const canSubmitDirectJoin = directName.trim().length > 0;
  const speechUnavailable =
    typeof window !== "undefined" && !("speechSynthesis" in window);

  const roomReady = Boolean(room && you);

  const board = useMemo(() => {
    if (!room || !you) {
      return null;
    }

    return (
      <GameBoardShell
        connectionStatus={connectionStatus}
        forceCaptionsOnly={forceCaptionsOnly}
        onAssassinTarget={(playerId) =>
          sendMessage({ type: "submit_assassin_target", payload: { playerId } })
        }
        onKickPlayer={(playerId) => sendMessage({ type: "kick_player", payload: { playerId } })}
        onPlayAgain={() => sendMessage({ type: "restart_lobby" })}
        onProposeTeam={() =>
          sendMessage({ type: "propose_team", payload: { playerIds: pendingTeamSelection } })
        }
        onQuestVote={(vote) => sendMessage({ type: "submit_quest_vote", payload: { vote } })}
        onReady={() => sendMessage({ type: "set_ready", payload: { ready: true } })}
        onRoleConfigChange={(config: RoleConfig) =>
          sendMessage({ type: "set_role_config", payload: config })
        }
        onStartGame={() => sendMessage({ type: "start_game" })}
        onStartNarration={() =>
          sendMessage({
            type: "start_narration",
            payload: { captionsOnly: forceCaptionsOnly || speechUnavailable }
          })
        }
        onTeamVote={(approve) => sendMessage({ type: "submit_team_vote", payload: { approve } })}
        pendingTeamSelection={pendingTeamSelection}
        privateIntelOpen={privateIntelOpen}
        roleCardRevealed={roleCardRevealed}
        room={room}
        setForceCaptionsOnly={setForceCaptionsOnly}
        setPrivateIntelOpen={setPrivateIntelOpen}
        setRoleCardRevealed={setRoleCardRevealed}
        togglePendingTeamSelection={togglePendingTeamSelection}
        you={you}
      />
    );
  }, [
    connectionStatus,
    forceCaptionsOnly,
    pendingTeamSelection,
    privateIntelOpen,
    roleCardRevealed,
    room,
    sendMessage,
    setForceCaptionsOnly,
    setPrivateIntelOpen,
    setRoleCardRevealed,
    speechUnavailable,
    togglePendingTeamSelection,
    you
  ]);

  if (!joinIntent) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
        <Card className="w-full space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Direct Room Join</p>
            <h1 className="font-display text-4xl text-parchment">Enter room {normalizedCode}</h1>
          </div>
          <input
            className="h-12 w-full rounded-xl border border-white/10 bg-slate/60 px-4 text-parchment outline-none transition focus:border-gild"
            onChange={(event) => setDirectName(event.target.value)}
            placeholder="Choose a display name"
            value={directName}
          />
          <Button
            className="w-full"
            disabled={!canSubmitDirectJoin}
            onClick={() =>
              setJoinIntent({
                roomCode: normalizedCode,
                name: directName.trim(),
                intent: "join"
              })
            }
          >
            Join Room
          </Button>
          {lastError ? <p className="text-sm text-[#ffd7d8]">{lastError.message}</p> : null}
        </Card>
      </div>
    );
  }

  if (!roomReady) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 py-8">
        <Card className="w-full max-w-xl space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Connecting</p>
          <h1 className="font-display text-4xl text-parchment">{normalizedCode}</h1>
          <p className="text-sm text-mist/75">
            {lastError?.message ?? "Preparing your room snapshot and waiting for the court server."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      {notices.length > 0 ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-3xl flex-col gap-2">
          {notices.map((notice) => (
            <div
              className="rounded-2xl border border-white/10 bg-[rgba(11,17,31,0.95)] px-4 py-3 text-sm text-parchment shadow-panel"
              key={notice.id}
            >
              {notice.message}
            </div>
          ))}
        </div>
      ) : null}
      {board}
    </>
  );
}
