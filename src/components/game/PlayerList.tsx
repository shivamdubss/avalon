import { Badge } from "@/components/ui/Badge";
import type { SharedRoomView } from "@/lib/types";

export function PlayerList({ room }: { room: SharedRoomView }) {
  return (
    <div className="space-y-2">
      {room.players.map((player) => (
        <div
          className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
          key={player.playerId}
        >
          <div>
            <p className="font-semibold text-parchment">{player.name}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {player.isHost ? <Badge tone="gold">Host</Badge> : null}
              {player.isLeader ? <Badge tone="gold">Leader</Badge> : null}
              {player.onQuestTeam ? <Badge tone="neutral">Quest Team</Badge> : null}
              {!player.isConnected ? <Badge tone="evil">Offline</Badge> : null}
            </div>
          </div>
          {player.submitted ? <span className="text-xs uppercase tracking-[0.18em] text-gild">Locked</span> : null}
        </div>
      ))}
    </div>
  );
}

