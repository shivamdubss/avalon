import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROLE_DETAILS } from "@/lib/constants";
import type { PrivatePlayerView } from "@/lib/types";

export function RoleRevealPanel({
  you,
  revealed,
  onReveal,
  onReady,
  canStartNarration,
  onStartNarration,
  forceCaptionsOnly,
  onForceCaptionsOnly
}: {
  you: PrivatePlayerView;
  revealed: boolean;
  onReveal: (revealed: boolean) => void;
  onReady: () => void;
  canStartNarration: boolean;
  onStartNarration: () => void;
  forceCaptionsOnly: boolean;
  onForceCaptionsOnly: (enabled: boolean) => void;
}) {
  const details = you.role ? ROLE_DETAILS[you.role] : null;

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Private Role</p>
          <h3 className="font-display text-3xl text-parchment">Tap only when ready</h3>
        </div>
        {you.team ? <Badge tone={you.team === "good" ? "good" : "evil"}>{you.team}</Badge> : null}
      </div>

      <button
        className={`w-full overflow-hidden rounded-[28px] border text-left transition ${
          revealed ? "border-gild/50 bg-[#11192e]" : "border-white/10 bg-[#0d1427]"
        }`}
        data-testid="role-reveal-card"
        onClick={() => onReveal(!revealed)}
        type="button"
      >
        {revealed && details ? (
          <div className="grid gap-4 p-4 md:grid-cols-[120px_1fr]">
            <img
              alt={details.label}
              className="aspect-[3/4] w-full rounded-2xl border border-gild/20 object-cover"
              src={details.artPath}
            />
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gild">{details.label}</p>
              <p className="text-2xl font-semibold text-parchment">{details.summary}</p>
              <p className="text-sm text-mist/75">
                Secret player identities remain hidden until the narration ceremony completes.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-80 items-center justify-center bg-[linear-gradient(180deg,rgba(210,174,102,0.12),transparent)] p-8">
            <p className="font-display text-4xl text-gild">Tap to Reveal</p>
          </div>
        )}
      </button>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="flex-1" data-testid="ready-button" disabled={!revealed} onClick={onReady}>
          Ready
        </Button>
        <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-mist">
          <input
            checked={forceCaptionsOnly}
            onChange={(event) => onForceCaptionsOnly(event.target.checked)}
            type="checkbox"
          />
          Captions only
        </label>
      </div>

      {canStartNarration ? (
        <Button className="w-full" data-testid="start-narration-button" onClick={onStartNarration} variant="secondary">
          Play Narration
        </Button>
      ) : null}
    </Card>
  );
}

