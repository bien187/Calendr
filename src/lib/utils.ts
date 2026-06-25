import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable short id for client-side temp keys. */
export function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10);
}
