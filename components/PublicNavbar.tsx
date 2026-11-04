import Link from "next/link";
import Image from "next/image";
import { InteretSpontaneModal } from "@/components/InteretSpontaneModal";

const NAV = [
  { href: "/opportunites", label: "Opportunités", key: "opportunites" },
  { href: "/franchise", label: "La franchise", key: "franchise" },
  { href: "/nos-magasins", label: "Nos magasins", key: "magasins" },
] as const;

type ActiveKey = (typeof NAV)[number]["key"];

const ctaCls = "shrink-0 rounded-full bg-brand px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-brand-dark transition-colors whitespace-nowrap";

export function PublicNavbar({
  active,
  candidaterHref,
}: {
  active?: ActiveKey;
  /**
   * Sur une page annonce, passer "#candidater" : le bouton "Devenir franchisé"
   * renvoie alors vers le formulaire déjà lié à cette ville, plus bas sur la
   * même page, plutôt que d'ouvrir la candidature spontanée générique.
   */
  candidaterHref?: string;
}) {
  return (
    <div className="sticky top-8 z-40 px-4 sm:px-6" style={{ fontFamily: "var(--font-poppins)" }}>
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 rounded-full bg-[#FCFCFC] px-4 py-2.5 sm:px-6 shadow-[1px_1px_4px_rgba(0,0,0,0.25)]">
        <Link href="/opportunites" className="shrink-0">
          <Image
            src="/Logo-MediaClinic-Noir.png"
            alt="Mediaclinic"
            width={400}
            height={100}
            className="h-9 w-auto object-contain object-left"
          />
        </Link>

        <nav className="hidden sm:flex items-center gap-6 lg:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`whitespace-nowrap text-sm font-medium transition-colors ${
                active === item.key ? "font-bold text-brand" : "text-[#1D1D1D] hover:text-brand"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {candidaterHref ? (
          <Link href={candidaterHref} className={ctaCls}>
            Devenir franchisé
          </Link>
        ) : (
          <InteretSpontaneModal triggerLabel="Devenir franchisé" triggerClassName={ctaCls} />
        )}
      </div>
    </div>
  );
}
