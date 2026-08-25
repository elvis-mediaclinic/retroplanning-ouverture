import { createClient } from "@/lib/supabase/server";
import { PublicSidebar } from "@/components/PublicSidebar";
import { renderStoredSections, parseStoredSections } from "@/components/StoredSectionsRenderer";

export const metadata = { title: "La franchise — Mediaclinic" };

export default async function FranchisePage() {
  const supabase = await createClient();

  const { data: conceptPage } = await supabase
    .from("pages")
    .select("sections")
    .eq("key", "concept")
    .maybeSingle();

  const conceptSections = parseStoredSections(conceptPage?.sections) ?? [];

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
