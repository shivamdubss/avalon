import { ROLE_DETAILS } from "@/lib/constants";
import type { PrivatePlayerView, SharedRoomView } from "@/lib/types";

export function GameOverRevealList({
  room,
  revealMap
}: {
  room: SharedRoomView;
  revealMap: Record<string, string | undefined>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {room.players.map((player) => {
        const role = revealMap[player.playerId];
        return (
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4" key={player.playerId}>
            <p className="font-semibold text-parchment">{player.name}</p>
            <p className="mt-1 text-sm text-mist/75">
              {role ? ROLE_DETAILS[role as keyof typeof ROLE_DETAILS].label : "Role hidden in snapshot"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

