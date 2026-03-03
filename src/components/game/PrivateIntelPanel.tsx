import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ROLE_DETAILS } from "@/lib/constants";
import type { PrivatePlayerView } from "@/lib/types";

export function PrivateIntelPanel({ you }: { you: PrivatePlayerView }) {
  if (!you.role) {
    return null;
  }

  const details = ROLE_DETAILS[you.role];

  return (
    <Card className="space-y-3 border-white/8 bg-[rgba(12,17,31,0.84)]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Private Intel</p>
        <Badge tone={details.team === "good" ? "good" : "evil"}>{details.team}</Badge>
      </div>
      <p className="font-display text-2xl text-parchment">{details.label}</p>
      <p className="text-sm text-mist/80">{details.summary}</p>
      {you.secretKnowledge.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-white/8 bg-white/5 p-3">
          {you.secretKnowledge.map((item) => (
            <p className="text-sm text-parchment" key={item.label}>
              {item.label}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-mist/70">No secret intel is currently visible.</p>
      )}
    </Card>
  );
}

