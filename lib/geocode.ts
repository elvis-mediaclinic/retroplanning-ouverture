import "server-only";

// Géocodage via l'API officielle adresse.data.gouv.fr (gratuite, sans clé).
export async function geocodeAddress(
  query: string,
  opts?: { type?: "municipality" }
): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;
  try {
    const typeParam = opts?.type ? `&type=${opts.type}` : "";
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1${typeParam}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    return { lat, lng };
  } catch {
    return null;
  }
}
