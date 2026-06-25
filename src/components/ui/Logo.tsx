import { cn } from "@/lib/utils";

/** Calendr brand mark — a clock with calendar bars. */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      width={size}
      height={size}
      className={cn("rounded-[18%]", className)}
      role="img"
      aria-label="Calendr"
    >
      <rect width="300" height="300" fill="#f8f9fa" rx="20" />
      <rect x="104" y="148" width="24" height="112" rx="12" fill="#5d96d4" />
      <rect x="138" y="115" width="24" height="151" rx="12" fill="#69ca9c" />
      <rect x="172" y="148" width="24" height="112" rx="12" fill="#f39257" />
      <path
        d="M 202 64 A 105 105 0 1 1 98 64"
        stroke="#2b343a"
        strokeWidth="22"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="150" cy="40" r="14" fill="#2b343a" />
    </svg>
  );
}
