import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicSidebar } from "@/components/PublicSidebar";

export const metadata = { title: "Opportunités de franchise — Mediaclinic" };

export default async function AnnoncesPage() {
  const supabase = await createClient();

  const { data: annonces } = await supabase
    .from("annonces")
    .select("id, titre, accroche, villes(nom, departement, region)")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicSidebar active="opportunites" />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-8 py-8 sm:py-12 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">
            Opportunités de franchise
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
            Ouvrez votre Mediaclinic
          </h1>
          <p className="mt-3 text-lg text-zinc-500 max-w-2xl">
            Découvrez les villes où Mediaclinic recherche un franchisé pour ouvrir un magasin spécialisé dans le multimédia reconditionné.
          </p>
        </div>

        {!annonces || annonces.length === 0 ? (
          <p className="text-zinc-500">Aucune opportunité disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {annonces.map((a) => {
              const villeRaw = a.villes as { nom: string; departement?: string; region?: string } | { nom: string; departement?: string; region?: string }[] | null;
              const ville = Array.isArray(villeRaw) ? villeRaw[0] ?? null : villeRaw;
              return (
                <Link
                  key={a.id}
                  href={`/annonce/${a.id}`}
                  className="block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-brand hover:shadow-md transition-all"
                >
                  {ville && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">
                      {ville.nom}{ville.departement ? ` · ${ville.departement}` : ""}
                    </p>
                  )}
                  <h2 className="text-lg font-bold text-zinc-900 leading-snug mb-2">{a.titre}</h2>
                  {a.accroche && (
                    <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">{a.accroche}</p>
                  )}
                  <span className="mt-4 inline-block text-sm font-medium text-brand">
                    En savoir plus →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
