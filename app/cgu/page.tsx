import Image from "next/image";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { cardCls, contentCls } from "@/components/StoredSectionsRenderer";

export const metadata = { title: "Conditions générales d'utilisation — Mediaclinic" };

export default function CguPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicNavbar />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">
        {/* Header automatique — logo + "Conditions générales d'utilisation" */}
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
            Conditions générales d&apos;utilisation
          </p>
        </div>

        <hr className="border-t border-zinc-200 my-12" />

        <div className={`${cardCls} max-w-3xl mx-auto`}>
          <div className={contentCls}>
            <p className="text-sm text-zinc-400 mb-6">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}</p>

            <h2>Objet</h2>
            <p>
              Le présent site (le « Site ») permet à la SAS MEDIACLINIC de présenter ses opportunités
              de franchise et de recevoir les candidatures des personnes intéressées par l&apos;ouverture
              d&apos;un magasin Mediaclinic. Il ne propose aucune vente en ligne.
            </p>

            <h2>Éditeur</h2>
            <p>
              SAS MEDIACLINIC — 9 rue Michael Faraday, 49070 Beaucouzé.
            </p>

            <h2>Candidatures et données personnelles</h2>
            <p>
              Les formulaires du Site (candidature à une opportunité, signalement d&apos;une ville non
              listée) collectent les informations nécessaires à l&apos;étude de votre demande : nom,
              prénom, email, téléphone, ville, et le cas échéant un message et un apport personnel
              indicatif. Ces données sont destinées exclusivement à l&apos;équipe développement franchise
              de Mediaclinic, pour vous recontacter au sujet de votre candidature. Elles ne sont ni
              revendues ni transmises à des tiers en dehors de ce cadre.
            </p>
            <p>
              Elles sont conservées le temps du traitement de votre candidature, puis pour la durée
              nécessaire au suivi de la relation avec vous.
            </p>

            <h2>Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de
              suppression de vos données. Vous pouvez l&apos;exercer en écrivant à{" "}
              <a href="mailto:vieprivee@mediaclinic.fr">vieprivee@mediaclinic.fr</a>.
            </p>

            <h2>Cookies</h2>
            <p>
              Sur les pages d&apos;annonce, un cookie anonyme (« mc_visitor ») peut être déposé, avec
              votre accord, pour mesurer la fréquentation. Il ne collecte aucune donnée personnelle et
              est conservé un an. Un second cookie (« mc_analytics_consent ») mémorise votre choix.
              Aucun cookie publicitaire ou de suivi tiers n&apos;est utilisé sur ce Site.
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>
              Mediaclinic est une marque de la SAS MEDIACLINIC, titulaire des droits sur la structure,
              la présentation et les contenus du Site. Toute reproduction, pour un usage autre que
              privé, est interdite sans autorisation préalable.
            </p>

            <h2>Modifications</h2>
            <p>
              Les présentes conditions peuvent être modifiées à tout moment ; nous vous invitons à les
              consulter régulièrement.
            </p>

            <h2>Loi applicable</h2>
            <p>
              Les présentes conditions sont régies par le droit français.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
