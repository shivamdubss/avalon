import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrivatePlayerView, SharedRoomView } from "@/lib/types";

export function AssassinPanel({
  room,
  you,
  onSelect
}: {
  room: SharedRoomView;
  you: PrivatePlayerView;
  onSelect: (playerId: string) => void;
}) {
  const canAct = you.role === "assassin";

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Assassin Phase</p>
        <h3 className="font-display text-3xl text-parchment">
          {canAct ? "Choose Merlin now" : "The Assassin is making a final guess"}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {room.players.map((player) => (
          <Button
            disabled={!canAct}
            key={player.playerId}
            onClick={() => onSelect(player.playerId)}
            variant="secondary"
          >
            {player.name}
          </Button>
        ))}
      </div>
    </Card>
  );
}

