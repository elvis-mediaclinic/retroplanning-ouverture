import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { OpportunitesExplorer } from "./OpportunitesExplorer";

export const metadata = { title: "Opportunités de franchise — Mediaclinic" };

export default async function AnnoncesPage() {
  const supabase = await createClient();

  const [{ data }, { data: { user } }] = await Promise.all([
    supabase
      .from("annonces")
      .select("id, titre, accroche, type_annonce, magasin_id, villes(nom, departement, region)")
      .eq("actif", true)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  // Lien de parrainage : uniquement proposé aux comptes du rôle "consultant"
  let consultantId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "consultant") consultantId = profile.id;
  }

  const rows = data ?? [];

  // Colonnes publiques des magasins visés par une annonce de cession, via le
  // client de service (pas de policy RLS publique sur "magasins" : la
  // jointure PostgREST échouerait silencieusement pour un visiteur anonyme).
  const magasinIds = rows.map((a) => a.magasin_id).filter((v): v is string => !!v);
  let magasinsMap: Record<string, { nom: string; ville: string | null; code_postal: string | null }> = {};
  if (magasinIds.length > 0) {
    const service = createServiceClient();
    const { data: magasinsData } = await service
      .from("magasins")
      .select("id, nom, ville, code_postal")
      .in("id", magasinIds);
    magasinsMap = Object.fromEntries((magasinsData ?? []).map((m) => [m.id, m]));
  }

  const annonces = rows.map((a) => {
    const villeRaw = a.villes as { nom: string; departement: string | null; region: string | null } | { nom: string; departement: string | null; region: string | null }[] | null;
    const ville = Array.isArray(villeRaw) ? villeRaw[0] ?? null : villeRaw;
    const magasin = a.magasin_id ? magasinsMap[a.magasin_id] ?? null : null;
    return {
      id: a.id,
      titre: a.titre,
      accroche: a.accroche,
      isCession: a.type_annonce === "cession",
      ville,
      magasin,
    };
  });

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-100">
      <style>{`
        body { background: #0089bd; }
      `}</style>

      <PublicNavbar active="opportunites" />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        {/* Header automatique — logo + "Opportunités de franchise" */}
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
            Opportunités de franchise
          </p>
        </div>

        <hr className="border-t border-zinc-200 my-12" />

        <div className="text-center">
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Découvrez les villes où Mediaclinic recherche un franchisé pour ouvrir un magasin spécialisé dans le multimédia reconditionné.
          </p>
        </div>

        <OpportunitesExplorer annonces={annonces} consultantId={consultantId} />
      </main>

      <PublicFooter />
    </div>
  );
}
