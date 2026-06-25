/** Curated, accessible palette for subgroups. */
export const SUBGROUP_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#db2777", // pink
  "#f59e0b", // amber
  "#9333ea", // purple
  "#dc2626", // red
  "#0891b2", // cyan
  "#ca8a04", // gold
  "#4f46e5", // indigo
  "#059669", // emerald
  "#e11d48", // rose
  "#0d9488", // teal
];

export function nextColor(usedCount: number) {
  return SUBGROUP_COLORS[usedCount % SUBGROUP_COLORS.length];
}

/** Returns a translucent background + solid text/border derived from a hex. */
export function colorStyles(hex: string) {
  return {
    backgroundColor: hexToRgba(hex, 0.14),
    color: hex,
    borderColor: hexToRgba(hex, 0.32),
  } as const;
}

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
