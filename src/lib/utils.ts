import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatCountdown(expiresAt: number) {
  const remaining = Math.max(0, expiresAt - Date.now());
  return Math.ceil(remaining / 1000);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function titleCase(value: string) {
  return value
    .split(/[-_\s]/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

