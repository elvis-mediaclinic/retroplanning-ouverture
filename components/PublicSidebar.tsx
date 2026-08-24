import Image from "next/image";
import Link from "next/link";

export function PublicSidebar({ villeNom }: { villeNom?: string | null }) {
  return (
    <>
      {/* Colonne fixe (desktop) */}
      <aside className="hidden w-60 shrink-0 py-3 pl-3 md:block">
        <div className="sticky top-3 h-[calc(100vh-1.5rem)] overflow-hidden rounded-xl">
          <div className="flex h-full flex-col bg-gradient-to-br from-[#00729e] to-[#0089bd]">
            <div className="flex h-16 items-center border-b border-white/20 px-5">
              <Image
                src="/Logo_Media_Clinic_monochrome-blanc_rvb.png"
                alt="Mediaclinic"
                width={160}
                height={40}
                className="w-full object-contain object-left"
                priority
              />
            </div>

            <div className="flex-1 px-5 py-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Opportunité de franchise
              </p>
              {villeNom && (
                <p className="text-lg font-bold uppercase text-white leading-tight">{villeNom}</p>
              )}
            </div>

            <div className="border-t border-white/20 p-3">
              <Link
                href="/opportunites"
                className="block rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                ← Toutes les opportunités
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Barre supérieure (mobile) */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <Image src="/Logo_Media_Clinic_monochrome-blanc_rvb.png" alt="Mediaclinic" width={110} height={30}
          className="object-contain brightness-0" />
        <Link href="/opportunites" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Toutes les opportunités
        </Link>
      </div>
    </>
  );
}
