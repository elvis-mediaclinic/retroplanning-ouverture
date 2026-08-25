import Image from "next/image";
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
    <div className="min-h-dvh flex flex-col">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicNavbar active="franchise" />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        {/* Header automatique — logo + "La franchise" */}
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
            La franchise
          </p>
        </div>

        <hr className="border-t border-zinc-200 my-12" />

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
