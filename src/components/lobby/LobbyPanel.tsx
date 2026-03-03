import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { ROLE_DETAILS } from "@/lib/constants";
import { validateRoleConfig } from "@/lib/roles";
import type { PrivatePlayerView, RoleConfig, SharedRoomView } from "@/lib/types";

export function LobbyPanel({
  room,
  you,
  onRoleConfigChange,
  onKickPlayer,
  onStartGame
}: {
  room: SharedRoomView;
  you: PrivatePlayerView;
  onRoleConfigChange: (config: RoleConfig) => void;
  onKickPlayer: (playerId: string) => void;
  onStartGame: () => void;
}) {
  const errors = validateRoleConfig(room.players.length, room.settings);
  const isHost = room.hostPlayerId === you.playerId;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-mist/70">Room Code</p>
            <h2 className="font-display text-4xl tracking-[0.24em] text-gild">{room.code}</h2>
          </div>
          <div className="rounded-2xl bg-white/5 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Players</p>
            <p className="text-2xl font-semibold text-parchment">{room.players.length} / 10</p>
          </div>
        </div>

        <div className="space-y-3">
          {room.players.map((player) => (
            <div
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
              key={player.playerId}
            >
              <div>
                <p className="font-semibold text-parchment">
                  {player.name}
                  {player.isHost ? "  Crown" : ""}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-mist/70">
                  {player.isConnected ? "Connected" : "Reconnecting"}
                </p>
              </div>
              {isHost && !player.isHost ? (
                <Button onClick={() => onKickPlayer(player.playerId)} variant="ghost">
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-mist/70">Optional Roles</p>
          <h3 className="mt-1 font-display text-3xl text-parchment">Seat the Court</h3>
        </div>

        <div className="space-y-3">
          <Toggle
            checked={room.settings.percival}
            description={ROLE_DETAILS.percival.summary}
            disabled={!isHost}
            label="Percival"
            onChange={(event) =>
              onRoleConfigChange({ ...room.settings, percival: event.target.checked })
            }
          />
          <Toggle
            checked={room.settings.morgana}
            description={ROLE_DETAILS.morgana.summary}
            disabled={!isHost}
            label="Morgana"
            onChange={(event) =>
              onRoleConfigChange({ ...room.settings, morgana: event.target.checked })
            }
          />
          <Toggle
            checked={room.settings.mordred}
            description={ROLE_DETAILS.mordred.summary}
            disabled={!isHost}
            label="Mordred"
            onChange={(event) =>
              onRoleConfigChange({ ...room.settings, mordred: event.target.checked })
            }
          />
          <Toggle
            checked={room.settings.oberon}
            description={ROLE_DETAILS.oberon.summary}
            disabled={!isHost}
            label="Oberon"
            onChange={(event) =>
              onRoleConfigChange({ ...room.settings, oberon: event.target.checked })
            }
          />
        </div>

        {errors.length > 0 ? (
          <div className="rounded-2xl border border-ember/40 bg-ember/10 p-3 text-sm text-[#ffd7d8]">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <Button
          className="w-full"
          data-testid="start-game-button"
          disabled={
            !isHost ||
            errors.length > 0 ||
            room.players.length < 5 ||
            room.players.length > 10 ||
            room.players.some((player) => !player.isConnected)
          }
          onClick={onStartGame}
        >
          Start the Intrigue
        </Button>
      </Card>
    </div>
  );
}
