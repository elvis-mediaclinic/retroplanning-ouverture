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
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center gap-6 px-6 py-10 text-center">
        <Image
          src="/Logo_Media_Clinic_monochrome-blanc_rvb.png"
          alt="Mediaclinic"
          width={160}
          height={40}
          className="h-8 w-auto object-contain"
        />

        <p className="text-sm text-white/70">
          On répare — On rachète — On revend
        </p>

        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-0">
          <nav className="flex flex-col items-center gap-2 sm:w-56 sm:border-r sm:border-white/20 sm:pr-8">
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

          <div className="flex flex-col items-center gap-2 text-sm text-white/70 sm:w-56 sm:pl-8">
            <p>© Mediaclinic {new Date().getFullYear()}</p>
            <Link href="/cgu" className="hover:text-white">
              Conditions générales d&apos;utilisation
            </Link>
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
