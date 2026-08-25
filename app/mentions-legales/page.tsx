import Image from "next/image";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { cardCls } from "@/components/StoredSectionsRenderer";

export const metadata = { title: "Mentions légales — Mediaclinic" };

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicNavbar />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        {/* Header automatique — logo + "Mentions légales" */}
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
            Mentions légales
          </p>
        </div>

        <hr className="border-t border-zinc-200 my-12" />

        <div className={`${cardCls} max-w-3xl mx-auto`}>
          <p className="text-zinc-400 text-center py-8">
            Le contenu de cette page sera bientôt disponible.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
