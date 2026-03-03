import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-gild text-[#101521] shadow-panel hover:bg-[#ddc07c] disabled:bg-[#786948] disabled:text-[#d2c39c]",
  secondary:
    "bg-slate/80 text-mist border border-white/10 hover:bg-slate disabled:bg-slate/50 disabled:text-white/40",
  ghost:
    "bg-transparent text-mist border border-white/10 hover:border-gild hover:text-white disabled:text-white/30",
  danger:
    "bg-ember text-white hover:bg-[#b44549] disabled:bg-[#6f3438] disabled:text-white/50"
};

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gild/70 disabled:cursor-not-allowed",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

