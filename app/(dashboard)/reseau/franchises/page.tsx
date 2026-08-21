import Link from "next/link";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Franchise, Magasin } from "@/lib/types";

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
      <div className="flex items-center justify-between">
        <div>
          <a href="/reseau" className="text-sm text-zinc-500 hover:text-zinc-900">← Réseau</a>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900">Franchisés</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {franchises.length} franchisé{franchises.length !== 1 ? "s" : ""} {showArchives ? "archivés" : "actifs"}
          </p>
        </div>
        {isAdmin && !showArchives && (
          <Link href="/reseau/franchises/new" className="btn-primary text-sm">
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
        <div className="space-y-4">
          {franchises.map((f) => {
            const leurs = magasinsByFranchise[f.id] ?? [];
            const actifs = leurs.filter((m) => !m.archive);
            const fermes = leurs.filter((m) => m.archive);
            return (
              <div key={f.id} className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-start justify-between px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-zinc-900">{f.nom}</h2>
                    {f.raison_sociale && (
                      <p className="text-sm text-zinc-500 mt-0.5">{f.raison_sociale}</p>
                    )}
                    {f.associes.length > 0 && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {f.associes.map((a) => `${a.prenom} ${a.nom}`).join(", ")}
                      </p>
                    )}
                    {(f.siren || f.rcs || f.tva_intracom) && (
                      <p className="text-xs text-zinc-400 mt-1 space-x-3">
                        {f.siren && <span>SIREN : {f.siren}</span>}
                        {f.rcs && <span>RCS : {f.rcs}</span>}
                        {f.tva_intracom && <span>TVA : {f.tva_intracom}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {actifs.length > 0 && (
                      <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-0.5">
                        {actifs.length} magasin{actifs.length > 1 ? "s" : ""} actif{actifs.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {fermes.length > 0 && (
                      <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-0.5">
                        {fermes.length} fermé{fermes.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {isAdmin && (
                      <Link href={`/reseau/franchises/${f.id}`} className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline">
                        Modifier
                      </Link>
                    )}
                  </div>
                </div>

                {leurs.length > 0 && (
                  <div className="border-t border-zinc-100 px-5 py-3 bg-zinc-50">
                    <p className="text-xs font-medium text-zinc-400 mb-2">Magasins</p>
                    <div className="flex flex-wrap gap-2">
                      {leurs.map((m) => (
                        <Link key={m.id} href={`/reseau/${m.id}`}
                          className={`text-xs border rounded px-2.5 py-1 hover:bg-zinc-100 ${
                            m.archive
                              ? "bg-zinc-50 border-zinc-200 text-zinc-400 line-through"
                              : "bg-white border-zinc-200 text-zinc-700"
                          }`}>
                          {m.nom}{m.ville ? ` · ${m.ville}` : ""}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {f.associes.length > 0 && (
                  <div className="border-t border-zinc-100 px-5 py-3">
                    <p className="text-xs font-medium text-zinc-400 mb-2">Contacts</p>
                    <div className="flex flex-wrap gap-6">
                      {f.associes.map((a, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium text-zinc-900">{a.prenom} {a.nom}</span>
                          {a.telephone && <span className="text-zinc-500 ml-2">{a.telephone}</span>}
                          {a.email && <span className="text-zinc-400 ml-2 text-xs">{a.email}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
