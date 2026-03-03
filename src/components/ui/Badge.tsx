import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "evil" | "gold";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        tone === "neutral" && "bg-white/8 text-mist",
        tone === "good" && "bg-royal/15 text-royal",
        tone === "evil" && "bg-ember/15 text-ember",
        tone === "gold" && "bg-gild/15 text-gild"
      )}
    >
      {children}
    </span>
  );
}

