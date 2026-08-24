import dynamic from "next/dynamic";
import { createServiceClient } from "@/lib/supabase/service";
import { geocodeAddress } from "@/lib/geocode";
import { PublicSidebar } from "@/components/PublicSidebar";
import { FORMAT_LABELS } from "@/lib/types";
import type { MagasinPoint } from "./MagasinsMap";

export const metadata = { title: "Nos magasins — Mediaclinic" };

const MagasinsMap = dynamic(() => import("./MagasinsMap").then((m) => m.MagasinsMap), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />,
});

export default async function NosMagasinsPage() {
  // Client de service : la table magasins n'a pas de policy RLS publique
  // (contacts, franchisé, notes…) — on sélectionne nous-mêmes les seules
  // colonnes destinées à un annuaire public.
  const service = createServiceClient();

  const { data } = await service
    .from("magasins")
    .select("id, nom, adresse, code_postal, ville, format, latitude, longitude")
    .eq("archive", false)
    .order("nom");

  const magasins = data ?? [];

  // Géocode les magasins qui n'ont pas encore de coordonnées, et les met en cache
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
        lat,
        lng,
      });
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

        {points.length > 0 && <MagasinsMap points={points} />}

        {magasins.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Aucun magasin ouvert pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {magasins.map((m) => (
              <div key={m.id} className="rounded-2xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-white leading-snug mb-1">{m.nom}</h3>
                <p className="text-sm text-white/80">
                  {[m.adresse, m.code_postal, m.ville].filter(Boolean).join(", ") || "Adresse à venir"}
                </p>
                {m.format && (
                  <span className="mt-3 inline-block rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                    {FORMAT_LABELS[m.format as keyof typeof FORMAT_LABELS]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
