import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { OpportunitesExplorer } from "./OpportunitesExplorer";

export const metadata = { title: "Opportunités de franchise — Mediaclinic" };

export default async function AnnoncesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("annonces")
    .select("id, titre, accroche, villes(nom, departement, region)")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  const annonces = (data ?? []).map((a) => {
    const villeRaw = a.villes as { nom: string; departement: string | null; region: string | null } | { nom: string; departement: string | null; region: string | null }[] | null;
    const ville = Array.isArray(villeRaw) ? villeRaw[0] ?? null : villeRaw;
    return { id: a.id, titre: a.titre, accroche: a.accroche, ville };
  });

  return (
    <div className="min-h-dvh flex flex-col">
      <style>{`
        body { background: #f4f4f5; }
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
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
            Ouvrez votre Mediaclinic
          </h2>
          <p className="mt-3 text-lg text-zinc-500 max-w-2xl mx-auto">
            Découvrez les villes où Mediaclinic recherche un franchisé pour ouvrir un magasin spécialisé dans le multimédia reconditionné.
          </p>
        </div>

        <OpportunitesExplorer annonces={annonces} />
      </main>

      <PublicFooter />
    </div>
  );
}
