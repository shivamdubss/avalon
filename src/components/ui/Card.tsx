import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-[rgba(18,26,48,0.86)] p-5 shadow-panel backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

