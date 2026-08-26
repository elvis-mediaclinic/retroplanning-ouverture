import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ConceptEditor } from "./ConceptEditor";
import type { Section } from "../villes/[id]/SectionsEditor";

export default async function ConceptPage() {
  await requireMC();
  const supabase = await createClient();

  const { data } = await supabase.from("pages").select("sections").eq("key", "concept").maybeSingle();

  const defaultSections: Section[] | undefined = (() => {
    if (!data?.sections) return undefined;
    try {
      const s = data.sections;
      if (Array.isArray(s)) return s as Section[];
      if (typeof s === "string") return JSON.parse(s) as Section[];
      return undefined;
    } catch { return undefined; }
  })();

  return (
    <div className="space-y-6">
      <div className="mt-2">
        <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Concept Mediaclinic</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Toutes ces sections apparaissent sur la page publique « La franchise ».
          Cochez « Dans les annonces » pour celles à reprendre aussi dans la
          rubrique « Découvrir le concept Mediaclinic » de chaque annonce.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <ConceptEditor defaultSections={defaultSections} />
      </section>
    </div>
  );
}
