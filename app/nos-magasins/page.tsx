import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/service";
import { geocodeAddress } from "@/lib/geocode";
import { PublicNavbar } from "@/components/PublicNavbar";
import { MagasinsExplorer } from "./MagasinsExplorer";
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
      .select("id, nom, departement, latitude, longitude, annonces!inner(id, titre)")
      .eq("statut", "en_etude")
      .eq("annonces.actif", true)
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
      const annonceRaw = v.annonces as unknown;
      const annonce = Array.isArray(annonceRaw) ? annonceRaw[0] : annonceRaw;
      if (annonce) {
        villesEnEtude.push({
          id: v.id,
          nom: v.nom,
          departement: v.departement,
          annonceId: annonce.id,
          annonceTitre: annonce.titre,
          lat,
          lng,
        });
      }
    }
  }

  return (
    <div className="min-h-screen">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicNavbar active="magasins" />

      <main className="mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        {/* Header automatique — logo + "Nos magasins" */}
        <div className="text-center mt-10">
          <div className="flex justify-center mb-6">
            <Image
              src="/Logo-MediaClinic-Noir.png"
              alt="Mediaclinic"
              width={400}
              height={100}
              className="h-[100px] w-auto object-contain"
            />
          </div>
          <p className="text-xl sm:text-2xl font-semibold uppercase tracking-widest text-[#0089bd]">
            Nos magasins
          </p>
        </div>

        <hr className="border-t border-zinc-200 my-12" />

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
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow" />
              Ville en étude
            </div>
          )}
        </div>

        {(points.length > 0 || villesEnEtude.length > 0) && (
          <MagasinsExplorer points={points} villesEnEtude={villesEnEtude} />
        )}
      </main>
    </div>
  );
}
