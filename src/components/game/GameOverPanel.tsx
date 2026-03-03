import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROLE_DETAILS } from "@/lib/constants";
import type { PrivatePlayerView, SharedRoomView } from "@/lib/types";

export function GameOverPanel({
  room,
  you,
  onPlayAgain
}: {
  room: SharedRoomView;
  you: PrivatePlayerView;
  onPlayAgain?: () => void;
}) {
  const canRestart = room.hostPlayerId === you.playerId && Boolean(onPlayAgain);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Game Over</p>
          <h3 className="font-display text-4xl text-parchment">
            {room.winner === "good" ? "Good Prevails" : "Evil Prevails"}
          </h3>
        </div>
        <Badge tone={room.winner === "good" ? "good" : "evil"}>{room.winner}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {room.players.map((player) => (
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4" key={player.playerId}>
            <p className="font-semibold text-parchment">{player.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-mist/70">
              {room.revealedRoles?.[player.playerId]
                ? ROLE_DETAILS[room.revealedRoles[player.playerId]].label
                : "Unknown role"}
              {player.playerId === room.assassinTargetPlayerId ? "  Assassin target" : ""}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gild/20 bg-white/5 p-4">
        <p className="text-sm text-mist/80">
          Role art remains stable at the published asset paths. Swap in upgraded illustrations later
          without changing the UI contract.
        </p>
      </div>

      {canRestart ? (
        <Button className="w-full" data-testid="play-again-button" onClick={onPlayAgain}>
          Return to Lobby
        </Button>
      ) : null}
    </Card>
  );
}
