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
      .select("id, titre, accroche, type_annonce, magasin_id, image_url, villes(nom, departement, region)")
      .eq("actif", true)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  // Lien de parrainage : uniquement proposé aux comptes du rôle "consultant",
  // et seulement pour les annonces qui leur ont été explicitement partagées.
  let consultantId: string | null = null;
  let sharedAnnonceIds: Set<string> = new Set();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "consultant") {
      consultantId = profile.id;
      const { data: shares } = await supabase
        .from("annonce_consultants")
        .select("annonce_id")
        .eq("consultant_id", profile.id);
      sharedAnnonceIds = new Set((shares ?? []).map((s) => s.annonce_id));
    }
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
      imageUrl: a.image_url,
      isCession: a.type_annonce === "cession",
      ville,
      magasin,
      sharedWithConsultant: sharedAnnonceIds.has(a.id),
    };
  });

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <PublicNavbar active="opportunites" />

      <main
        className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-16 pb-8 space-y-10"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight text-[#1D1D1D]">
            Opportunités de franchise
          </h1>
          <p className="text-lg text-[#5C5C6F]">
            Découvrez les villes où Mediaclinic recherche un franchisé pour ouvrir un magasin spécialisé dans le multimédia reconditionné.
          </p>
        </div>

        <OpportunitesExplorer annonces={annonces} consultantId={consultantId} />
      </main>

      <PublicFooter />
    </div>
  );
}
