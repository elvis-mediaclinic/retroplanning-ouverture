import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Franchise, Magasin } from "@/lib/types";

export default async function FranchisesPage() {
  await requireMC();
  const profile = await getProfile();
  const supabase = await createClient();

  const [{ data: franchisesData }, { data: magasinsData }] = await Promise.all([
    supabase.from("franchises").select("*").order("nom"),
    supabase.from("magasins").select("id, nom, ville, franchise_id").order("nom"),
  ]);

  const franchises = (franchisesData ?? []) as Franchise[];
  const magasins = (magasinsData ?? []) as Pick<Magasin, "id" | "nom" | "ville" | "franchise_id">[];
  const isAdmin = profile.role === "admin";

  // Index magasins par franchise_id
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
            {franchises.length} franchisé{franchises.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Link href="/reseau/franchises/new" className="btn-primary text-sm">
            + Nouveau franchisé
          </Link>
        )}
      </div>

      {franchises.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">Aucun franchisé enregistré.</p>
          {isAdmin && (
            <Link href="/reseau/franchises/new" className="mt-3 inline-block text-sm text-brand hover:underline">
              Créer le premier
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {franchises.map((f) => {
            const leurs = magasinsByFranchise[f.id] ?? [];
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
                    {leurs.length > 0 && (
                      <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-0.5">
                        {leurs.length} magasin{leurs.length > 1 ? "s" : ""}
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
                          className="text-xs bg-white border border-zinc-200 rounded px-2.5 py-1 text-zinc-700 hover:bg-zinc-100">
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
