import Image from "next/image";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { cardCls, contentCls } from "@/components/StoredSectionsRenderer";

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
          <div className={contentCls}>
            <h2>Éditeur du site</h2>
            <p>
              SAS MEDIACLINIC<br />
              Siège social : 35 rue du Nid de Pie, 49000 Angers<br />
              RCS Angers 834 811 077 — SIRET 834 811 077 00066<br />
              Contact : <a href="mailto:contact@mediaclinic.fr">contact@mediaclinic.fr</a>
            </p>

            <h2>Directeur de la publication</h2>
            <p>Philippe Cougé</p>

            <h2>Hébergement</h2>
            <p>
              Vercel Inc.<br />
              340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>
              Mediaclinic est une marque de la SAS MEDIACLINIC, titulaire des droits sur la structure,
              la présentation et les contenus du Site. Toute reproduction, pour un usage autre que
              privé, est interdite sans autorisation préalable.
            </p>

            <h2>Données personnelles</h2>
            <p>
              Le traitement des données personnelles collectées sur ce site est détaillé dans les{" "}
              <a href="/cgu">conditions générales d&apos;utilisation</a>.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
