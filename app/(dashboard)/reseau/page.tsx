import Link from "next/link";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Magasin, Franchise } from "@/lib/types";
import { MagasinList } from "./MagasinList";

export type MagasinWithFranchise = Magasin & {
  franchises: Franchise | null;
  magasin_sirets: { siret: string; date_fin: string | null }[] | null;
};

function Tabs({ active }: { active: "actifs" | "archives" }) {
  return (
    <div className="flex border-b border-zinc-200 mb-6">
      {(["actifs", "archives"] as const).map((tab) => (
        <Link
          key={tab}
          href={tab === "actifs" ? "/reseau" : "/reseau?tab=archives"}
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

export default async function ReseauPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireMC();
  const profile = await getProfile();
  const { tab } = await searchParams;
  const showArchives = tab === "archives";

  const supabase = await createClient();

  const { data } = await supabase
    .from("magasins")
    .select("*, franchises(*), magasin_sirets(siret, date_fin)")
    .eq("archive", showArchives)
    .order("nom");

  const magasins = (data ?? []) as MagasinWithFranchise[];
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Magasins</h1>
          <p className="page-header-subtitle">
            {magasins.length} magasin{magasins.length !== 1 ? "s" : ""} {showArchives ? "archivés" : "dans le réseau"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !showArchives && (
            <Link href="/reseau/new" className="btn-primary">
              + Ajouter un magasin
            </Link>
          )}
        </div>
      </div>

      <Tabs active={showArchives ? "archives" : "actifs"} />

      {magasins.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">
            {showArchives ? "Aucun magasin archivé." : "Aucun magasin dans le réseau pour l'instant."}
          </p>
          {isAdmin && !showArchives && (
            <Link href="/reseau/new" className="mt-3 inline-block text-sm text-brand hover:underline">
              Ajouter le premier magasin
            </Link>
          )}
        </div>
      ) : (
        <MagasinList magasins={magasins} isAdmin={isAdmin} isArchive={showArchives} />
      )}
    </div>
  );
}
