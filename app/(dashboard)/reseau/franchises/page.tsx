import Link from "next/link";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Franchise, Magasin } from "@/lib/types";
import { FranchiseList } from "./FranchiseList";

function Tabs({ active }: { active: "actifs" | "archives" }) {
  return (
    <div className="flex border-b border-zinc-200 mb-6">
      {(["actifs", "archives"] as const).map((tab) => (
        <Link
          key={tab}
          href={tab === "actifs" ? "/reseau/franchises" : "/reseau/franchises?tab=archives"}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === tab
              ? "border-brand text-brand"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {tab === "actifs" ? "Actifs" : "Archivés"}
        </Link>
      ))}
    </div>
  );
}

export default async function FranchisesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireMC();
  const profile = await getProfile();
  const { tab } = await searchParams;
  const showArchives = tab === "archives";

  const supabase = await createClient();

  const [{ data: franchisesData }, { data: magasinsData }] = await Promise.all([
    supabase.from("franchises").select("*").eq("archive", showArchives).order("nom"),
    supabase.from("magasins").select("id, nom, ville, franchise_id, archive").order("nom"),
  ]);

  const franchises = (franchisesData ?? []) as Franchise[];
  const magasins = (magasinsData ?? []) as Pick<Magasin, "id" | "nom" | "ville" | "franchise_id" | "archive">[];
  const isAdmin = profile.role === "admin";

  const magasinsByFranchise = magasins.reduce<Record<string, typeof magasins>>((acc, m) => {
    if (m.franchise_id) {
      acc[m.franchise_id] = [...(acc[m.franchise_id] ?? []), m];
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Franchisés</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {franchises.length} franchisé{franchises.length !== 1 ? "s" : ""} {showArchives ? "archivés" : "actifs"}
          </p>
        </div>
        {isAdmin && !showArchives && (
          <Link href="/reseau/franchises/new" className="btn-primary">
            + Nouveau franchisé
          </Link>
        )}
      </div>

      <Tabs active={showArchives ? "archives" : "actifs"} />

      {franchises.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">
            {showArchives ? "Aucun franchisé archivé." : "Aucun franchisé enregistré."}
          </p>
          {isAdmin && !showArchives && (
            <Link href="/reseau/franchises/new" className="mt-3 inline-block text-sm text-brand hover:underline">
              Créer le premier
            </Link>
          )}
        </div>
      ) : (
        <FranchiseList
          franchises={franchises}
          magasinsByFranchise={magasinsByFranchise}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
