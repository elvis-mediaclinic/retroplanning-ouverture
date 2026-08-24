import { createServiceClient } from "@/lib/supabase/service";
import { geocodeAddress } from "@/lib/geocode";
import { PublicSidebar } from "@/components/PublicSidebar";
import { MagasinsMapLoader } from "./MagasinsMapLoader";
import type { MagasinPoint, VilleEnEtudePoint } from "./MagasinsMap";

export const metadata = { title: "Nos magasins — Mediaclinic" };
export const dynamic = "force-dynamic";

export default async function NosMagasinsPage() {
  // Client de service : magasins et villes n'ont pas de policy RLS publique
  // couvrant ces lignes (contacts, franchisé, notes…) — on sélectionne
  // nous-mêmes les seules colonnes destinées à un annuaire public.
  const service = createServiceClient();

  const [{ data: magasinsData }, { data: villesData }] = await Promise.all([
    service
      .from("magasins")
      .select("id, nom, adresse, code_postal, ville, type, latitude, longitude")
      .eq("archive", false)
      .order("nom"),
    service
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
        await service.from("magasins").update({ latitude: lat, longitude: lng }).eq("id", m.id);
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
        await service.from("villes").update({ latitude: lat, longitude: lng }).eq("id", v.id);
      }
    }

    if (lat !== null && lng !== null) {
      villesEnEtude.push({ id: v.id, nom: v.nom, departement: v.departement, lat, lng });
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicSidebar active="magasins" />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
          <h1 className="text-2xl font-bold uppercase text-white text-center">Nos magasins</h1>
        </div>

        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
            {magasins.length} magasin{magasins.length !== 1 ? "s" : ""} déjà ouvert{magasins.length !== 1 ? "s" : ""}
          </h2>
          <p className="mt-3 text-lg text-zinc-500 max-w-2xl mx-auto">
            Retrouvez tous nos magasins Mediaclinic partout en France.
          </p>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-zinc-600">
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
              <span className="text-[#e60076] text-base leading-none">★</span>
              Ville en étude
            </div>
          )}
        </div>

        {(points.length > 0 || villesEnEtude.length > 0) && (
          <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
            {/* Liste */}
            <div className="lg:w-72 shrink-0 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
              {magasins.map((m) => (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                        m.type === "integre" ? "bg-[#7c3aed]" : "bg-[#0089bd]"
                      }`}
                    />
                    <p className="text-sm font-semibold text-zinc-900 truncate">{m.nom}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 pl-4">
                    {[m.code_postal, m.ville].filter(Boolean).join(" ") || "—"}
                  </p>
                </div>
              ))}
              {magasins.length === 0 && (
                <p className="px-4 py-3 text-sm text-zinc-400">Aucun magasin ouvert pour le moment.</p>
              )}
            </div>

            {/* Carte */}
            <div className="flex-1 min-h-[400px]">
              <MagasinsMapLoader points={points} villesEnEtude={villesEnEtude} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
