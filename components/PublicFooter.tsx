import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/opportunites", label: "Toutes nos opportunités" },
  { href: "/franchise", label: "La franchise" },
  { href: "/nos-magasins", label: "Nos magasins" },
] as const;

export function PublicFooter() {
  return (
    <footer className="mt-12 bg-gradient-to-br from-[#00729e] to-[#0089bd]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Image
          src="/Logo_Media_Clinic_monochrome-blanc_rvb.png"
          alt="Mediaclinic"
          width={160}
          height={40}
          className="h-8 w-auto object-contain"
        />

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-white/80 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-white/60 sm:flex-row">
          <p>© Mediaclinic {new Date().getFullYear()} — Réseau de franchise</p>
          <Link href="/cgu" className="hover:text-white">
            Conditions générales d&apos;utilisation
          </Link>
        </div>
      </div>
    </footer>
  );
}
