"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { getNarrationStepAtTime } from "@/lib/narration";
import type { NarrationState, SecretKnowledgeItem } from "@/lib/types";

export function NarrationPanel({
  narration,
  isSpeaker,
  secretKnowledge
}: {
  narration: NarrationState;
  isSpeaker: boolean;
  secretKnowledge: SecretKnowledgeItem[];
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const step = getNarrationStepAtTime(narration.steps, narration.startedAt, now);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gild">Narration</p>
          <h3 className="font-display text-3xl text-parchment">
            {isSpeaker && narration.mode === "speech" ? "Speaking to the room" : "Follow the captions"}
          </h3>
        </div>
        <p className="text-sm uppercase tracking-[0.18em] text-mist/70">{narration.mode}</p>
      </div>

      <div className="rounded-[28px] border border-gild/25 bg-[rgba(13,20,39,0.95)] p-6">
        <p className="text-2xl leading-relaxed text-parchment">{step?.caption ?? "Prepare the room..."}</p>
      </div>

      {secretKnowledge.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-royal/20 bg-royal/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-royal">Private Intel</p>
          {secretKnowledge.map((item) => (
            <p className="text-sm text-parchment" key={item.label}>
              {item.label}
            </p>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

