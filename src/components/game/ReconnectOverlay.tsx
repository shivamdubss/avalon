import { Card } from "@/components/ui/Card";
import { formatCountdown } from "@/lib/utils";
import type { SharedRoomView } from "@/lib/types";

export function ReconnectOverlay({ room }: { room: SharedRoomView }) {
  if (!room.blocker) {
    return null;
  }

  const waitingFor = room.players.find((player) => player.playerId === room.blocker?.disconnectedPlayerId);

  return (
    <Card className="border-gild/20 bg-[rgba(32,25,10,0.92)]">
      <p className="text-xs uppercase tracking-[0.18em] text-gild">Reconnect Hold</p>
      <p className="mt-2 text-sm text-parchment">
        Waiting for <strong>{waitingFor?.name ?? "a player"}</strong> to return before resolving the
        phase.
      </p>
      <p className="mt-3 text-2xl font-semibold text-gild">{formatCountdown(room.blocker.expiresAt)}s</p>
    </Card>
  );
}

