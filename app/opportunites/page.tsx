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

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
          <h1 className="text-2xl font-bold uppercase text-white text-center">
            Opportunités de franchise
          </h1>
        </div>

        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
            Ouvrez votre Mediaclinic
          </h2>
          <p className="mt-3 text-lg text-zinc-500 max-w-2xl mx-auto">
            Découvrez les villes où Mediaclinic recherche un franchisé pour ouvrir un magasin spécialisé dans le multimédia reconditionné.
          </p>
        </div>

        {!annonces || annonces.length === 0 ? (
          <p className="text-zinc-500 text-center">Aucune opportunité disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {annonces.map((a) => {
              const villeRaw = a.villes as { nom: string; departement?: string; region?: string } | { nom: string; departement?: string; region?: string }[] | null;
              const ville = Array.isArray(villeRaw) ? villeRaw[0] ?? null : villeRaw;
              return (
                <Link
                  key={a.id}
                  href={`/annonce/${a.id}`}
                  className="block rounded-2xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm hover:brightness-110 transition-all"
                >
                  {ville && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
                      {ville.nom}{ville.departement ? ` · ${ville.departement}` : ""}
                    </p>
                  )}
                  <h2 className="text-lg font-bold text-white leading-snug mb-2">{a.titre}</h2>
                  {a.accroche && (
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{a.accroche}</p>
                  )}
                  <span className="mt-4 inline-block text-sm font-medium text-white">
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
