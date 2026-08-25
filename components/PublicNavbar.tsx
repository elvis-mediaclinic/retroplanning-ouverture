import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/opportunites", label: "Toutes nos opportunités", key: "opportunites" },
  { href: "/franchise", label: "La franchise", key: "franchise" },
  { href: "/nos-magasins", label: "Nos magasins", key: "magasins" },
] as const;

type ActiveKey = (typeof NAV)[number]["key"];

export function PublicNavbar({ active }: { active?: ActiveKey }) {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-3">
        <Link href="/opportunites" className="shrink-0">
          <Image
            src="/Logo-MediaClinic-Noir.png"
            alt="Mediaclinic"
            width={160}
            height={40}
            className="h-8 w-auto object-contain"
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`whitespace-nowrap text-sm px-1 py-1 ${
                active === item.key
                  ? "font-semibold text-[#0089bd]"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
