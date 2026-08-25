import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1600px] px-6 py-8">
      <hr className="border-t border-zinc-200 mb-6" />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <p>© Mediaclinic {new Date().getFullYear()} — Réseau de franchise</p>
        <Link href="/cgu" className="hover:text-zinc-600">
          Conditions générales d&apos;utilisation
        </Link>
      </div>
    </footer>
  );
}
