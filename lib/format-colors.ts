export type FormatSegment = { key: string; label: string; count: number; color: string };

export const FORMAT_COLORS: Record<string, string> = {
  classique:    "#6366f1",
  galerie:      "#0ea5e9",
  centre_ville: "#10b981",
  kiosque:      "#f59e0b",
  shop_in_shop: "#ec4899",
};

export function getFormatColor(key: string) {
  return FORMAT_COLORS[key] ?? "#a1a1aa";
}
