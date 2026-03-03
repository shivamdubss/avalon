import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrivatePlayerView, SharedRoomView } from "@/lib/types";

export function TeamBuilder({
  room,
  you,
  pendingSelection,
  onTogglePlayer,
  onSubmit
}: {
  room: SharedRoomView;
  you: PrivatePlayerView;
  pendingSelection: string[];
  onTogglePlayer: (playerId: string) => void;
  onSubmit: () => void;
}) {
  const currentQuest = room.quests[room.currentQuestIndex];
  const required = currentQuest?.teamSize ?? 0;
  const canEdit = room.leaderPlayerId === you.playerId;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Team Builder</p>
          <h3 className="font-display text-3xl text-parchment">Select {required} adventurers</h3>
        </div>
        <p className="text-sm uppercase tracking-[0.18em] text-gild">
          {pendingSelection.length}/{required}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {room.players.map((player) => {
          const selected = pendingSelection.includes(player.playerId);
          return (
            <button
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                selected ? "border-gild bg-gild/10" : "border-white/10 bg-white/5"
              } ${!canEdit ? "cursor-default" : ""}`}
              disabled={!canEdit}
              key={player.playerId}
              onClick={() => onTogglePlayer(player.playerId)}
              type="button"
            >
              <p className="font-semibold text-parchment">{player.name}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-mist/70">
                {selected ? "Selected" : "Available"}
              </p>
            </button>
          );
        })}
      </div>

      <Button
        className="w-full"
        data-testid="propose-team-button"
        disabled={!canEdit || pendingSelection.length !== required}
        onClick={onSubmit}
      >
        Propose Team
      </Button>
    </Card>
  );
}

