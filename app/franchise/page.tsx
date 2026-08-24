import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PublicSidebar } from "@/components/PublicSidebar";
import { renderStoredSections, parseStoredSections, bleuCardCls } from "@/components/StoredSectionsRenderer";

export const metadata = { title: "La franchise — Mediaclinic" };

export default async function FranchisePage() {
  const supabase = await createClient();
  // Client de service : on n'expose que des totaux agrégés, jamais les lignes brutes,
  // la table magasins n'ayant pas de politique RLS publique (adresses, contacts…).
  const service = createServiceClient();

  const [{ data: conceptPage }, { data: magasins }] = await Promise.all([
    supabase.from("pages").select("sections").eq("key", "concept").maybeSingle(),
    service.from("magasins").select("id, type, archive"),
  ]);

  const conceptSections = parseStoredSections(conceptPage?.sections) ?? [];

  const list = magasins ?? [];
  const actifs = list.filter((m) => !m.archive);
  const franchises = actifs.filter((m) => m.type === "franchise").length;
  const integres = actifs.filter((m) => m.type === "integre").length;

  const stats = [
    { label: "Magasins ouverts", value: actifs.length },
    { label: "Magasins franchisés", value: franchises },
    { label: "Magasins intégrés", value: integres },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicSidebar active="franchise" />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
          <h1 className="text-2xl font-bold uppercase text-white text-center">La franchise</h1>
        </div>

        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
            Rejoignez le réseau Mediaclinic
          </h2>
          <p className="mt-3 text-lg text-zinc-500 max-w-2xl mx-auto">
            Un réseau en pleine croissance, spécialisé dans le rachat, la réparation
            et la revente de produits multimédia reconditionnés.
          </p>
        </div>

        {actifs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className={`${bleuCardCls} text-center`}>
                <p className="text-5xl font-extrabold text-white leading-none">{s.value}</p>
                <p className="mt-2 text-sm text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {conceptSections.length > 0 ? (
          renderStoredSections(conceptSections, "franchise")
        ) : (
          <p className="text-zinc-400 text-center py-8">
            Le contenu de cette page sera bientôt disponible.
          </p>
        )}
      </main>
    </div>
  );
}
