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
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-3 sm:gap-0">
        <div className="sm:border-r sm:border-white/20 sm:pr-8">
          <Image
            src="/Logo_Media_Clinic_monochrome-blanc_rvb.png"
            alt="Mediaclinic"
            width={160}
            height={40}
            className="h-8 w-auto object-contain"
          />
          <p className="mt-3 text-sm text-white/70">
            On répare — On rachète — On revend
          </p>
        </div>

        <nav className="flex flex-col gap-2 sm:border-r sm:border-white/20 sm:px-8">
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

        <div className="flex flex-col gap-2 text-sm text-white/70 sm:pl-8">
          <p>© Mediaclinic {new Date().getFullYear()} — Réseau de franchise</p>
          <Link href="/cgu" className="hover:text-white">
            Conditions générales d&apos;utilisation
          </Link>
          <Link href="/mentions-legales" className="hover:text-white">
            Mentions légales
          </Link>
        </div>
      </div>
    </footer>
  );
}
