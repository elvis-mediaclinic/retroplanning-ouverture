import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
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
    <div className="min-h-dvh flex flex-col bg-white">
      <PublicNavbar active="franchise" />

      <main
        className="flex-1 mx-auto w-full max-w-[1320px] px-6 pt-16 pb-8 space-y-16 sm:space-y-20"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight text-center text-[#1D1D1D] max-w-4xl mx-auto">
          La franchise Mediaclinic
        </h1>

        {conceptSections.length > 0 ? (
          renderStoredSections(conceptSections, "franchise")
        ) : (
          <p className="text-zinc-400 text-center py-8">
            Le contenu de cette page sera bientôt disponible.
          </p>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
