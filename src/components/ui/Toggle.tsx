import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function Toggle({ className, label, description, ...props }: ToggleProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-gild/40",
        className
      )}
    >
      <input className="mt-1 size-4 accent-[var(--color-gild)]" type="checkbox" {...props} />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-parchment">{label}</span>
        {description ? <span className="text-xs text-mist/75">{description}</span> : null}
      </span>
    </label>
  );
}

