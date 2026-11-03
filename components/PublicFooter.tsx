import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/opportunites", label: "Toutes nos opportunités" },
  { href: "/franchise", label: "La franchise" },
  { href: "/nos-magasins", label: "Nos magasins" },
] as const;

export function PublicFooter() {
  return (
    <footer
      className="mt-16 rounded-t-[80px] bg-[#1D1D1D] px-6 sm:px-16 py-12 sm:py-16"
      style={{ fontFamily: "var(--font-poppins)" }}
    >
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center sm:items-start gap-4 max-w-xs text-center sm:text-left">
            <Image
              src="/Logo_Media_Clinic_monochrome-blanc_rvb.png"
              alt="Mediaclinic"
              width={200}
              height={50}
              className="h-10 w-auto object-contain"
            />
            <p className="text-sm text-white/70">
              Mediaclinic, 1er concept de reconditionnement, de réparation et de rachat cash, local et vertueux.
            </p>
          </div>

          <nav className="flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
            <p className="text-lg font-bold text-white">Navigation</p>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-white/70 hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-center sm:items-end gap-3 text-center sm:text-right">
            <p className="text-lg font-bold text-white">Légal</p>
            <Link href="/cgu" className="text-sm text-white/70 hover:text-white">
              Conditions générales d&apos;utilisation
            </Link>
            <Link href="/mentions-legales" className="text-sm text-white/70 hover:text-white">
              Mentions légales
            </Link>
          </div>
        </div>

        <div className="border-t border-white/20" />

        <p className="text-center sm:text-left text-sm text-white/60">
          Mediaclinic — Tous droits réservés — {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
