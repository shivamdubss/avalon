"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { generateRoomCode, persistPendingJoin } from "@/lib/session";

export function CreateJoinCard() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const normalizedRoomCode = roomCode.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && (mode === "create" || normalizedRoomCode.length === 5);

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    const targetRoomCode = mode === "create" ? generateRoomCode() : normalizedRoomCode;

    persistPendingJoin({
      roomCode: targetRoomCode,
      name: trimmedName,
      intent: mode
    });

    startTransition(() => {
      router.push(`/game/${targetRoomCode}`);
    });
  }

  return (
    <Card className="w-full max-w-md border-gild/20 bg-[rgba(13,20,39,0.9)]">
      <div className="mb-5 flex gap-2 rounded-2xl bg-white/5 p-1">
        {(["create", "join"] as const).map((entry) => (
          <button
            key={entry}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === entry ? "bg-gild text-[#101521]" : "text-mist"
            }`}
            onClick={() => setMode(entry)}
            type="button"
          >
            {entry === "create" ? "Create Game" : "Join Game"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-mist/80">
            Display Name
          </span>
          <input
            className="h-12 w-full rounded-xl border border-white/10 bg-slate/60 px-4 text-parchment outline-none transition focus:border-gild"
            data-testid="player-name-input"
            maxLength={24}
            onChange={(event) => setName(event.target.value)}
            placeholder="Merlin, Morgana, or just Alex"
            value={name}
          />
        </label>

        {mode === "join" ? (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-mist/80">
              Room Code
            </span>
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-slate/60 px-4 font-mono text-lg uppercase tracking-[0.24em] text-parchment outline-none transition focus:border-gild"
              data-testid="room-code-input"
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="A4L0N"
              value={normalizedRoomCode}
            />
          </label>
        ) : null}

        <Button className="w-full" data-testid="create-join-submit" disabled={!canSubmit} onClick={handleSubmit}>
          {mode === "create" ? "Claim a Fresh Room" : "Enter the Room"}
        </Button>
      </div>
    </Card>
  );
}

