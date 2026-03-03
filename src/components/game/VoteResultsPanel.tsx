import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { SharedRoomView } from "@/lib/types";

export function VoteResultsPanel({ room }: { room: SharedRoomView }) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Council Verdict</p>
        <h3 className="font-display text-3xl text-parchment">Every vote is public</h3>
      </div>
      <div className="space-y-2">
        {room.players.map((player) => {
          const approved = room.publicVoteResults?.[player.playerId];
          return (
            <div
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
              key={player.playerId}
            >
              <span className="font-semibold text-parchment">{player.name}</span>
              <Badge tone={approved ? "good" : "evil"}>{approved ? "Approve" : "Reject"}</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

