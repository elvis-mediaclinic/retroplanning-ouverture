import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import { MagasinsExplorer } from "@/app/nos-magasins/MagasinsExplorer";
import type { MagasinPoint, VilleEnEtudePoint } from "@/app/nos-magasins/MagasinsMap";

export default async function ReseauCartePage() {
  await requireMC();
  const supabase = await createClient();

  const [{ data: magasinsData }, { data: villesData }] = await Promise.all([
    supabase
      .from("magasins")
      .select("id, nom, adresse, code_postal, ville, type, archive, latitude, longitude")
      .eq("archive", false)
      .order("nom"),
    supabase
      .from("villes")
      .select("id, nom, departement, latitude, longitude")
      .eq("statut", "en_etude")
      .order("nom"),
  ]);

  const magasins = magasinsData ?? [];
  const villesEnEtudeData = villesData ?? [];

  // Géocode les magasins qui n'ont pas encore de coordonnées, et met en cache
  const points: MagasinPoint[] = [];
  for (const m of magasins) {
    let lat = m.latitude;
    let lng = m.longitude;

    if (lat === null || lng === null) {
      const query = [m.adresse, m.code_postal, m.ville].filter(Boolean).join(" ");
      const coords = await geocodeAddress(query);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        await supabase.from("magasins").update({ latitude: lat, longitude: lng }).eq("id", m.id);
      }
    }

    if (lat !== null && lng !== null) {
      points.push({
        id: m.id,
        nom: m.nom,
        adresse: m.adresse,
        codePostal: m.code_postal,
        ville: m.ville,
        type: m.type === "integre" ? "integre" : "franchise",
        lat,
        lng,
      });
    }
  }

  // Géocode les villes en étude (par nom de commune)
  const villesEnEtude: VilleEnEtudePoint[] = [];
  for (const v of villesEnEtudeData) {
    let lat = v.latitude;
    let lng = v.longitude;

    if (lat === null || lng === null) {
      const coords = await geocodeAddress(v.nom, { type: "municipality" });
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        await supabase.from("villes").update({ latitude: lat, longitude: lng }).eq("id", v.id);
      }
    }

    if (lat !== null && lng !== null) {
      villesEnEtude.push({ id: v.id, nom: v.nom, departement: v.departement, lat, lng });
    }
  }

  return (
    <div className="space-y-6">
      <div className="mt-2">
        <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Sur la carte</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {points.length} magasin{points.length !== 1 ? "s" : ""} ouvert{points.length !== 1 ? "s" : ""}
          {villesEnEtude.length > 0 && ` · ${villesEnEtude.length} ville${villesEnEtude.length !== 1 ? "s" : ""} en étude`}
        </p>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#7c3aed] border-2 border-white shadow" />
          Magasin intégré
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#0089bd] border-2 border-white shadow" />
          Magasin franchisé
        </div>
        {villesEnEtude.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow" />
            Ville en étude
          </div>
        )}
      </div>

      {(points.length > 0 || villesEnEtude.length > 0) ? (
        <MagasinsExplorer points={points} villesEnEtude={villesEnEtude} />
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">Aucun magasin géolocalisable pour le moment.</p>
        </div>
      )}
    </div>
  );
}
