import { PublicSidebar } from "@/components/PublicSidebar";

export const metadata = { title: "Nos magasins — Mediaclinic" };

export default function NosMagasinsPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicSidebar active="magasins" />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-8 py-8 sm:py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">
            Nos magasins
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-3">
            Cette page arrive bientôt
          </h1>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Retrouvez ici prochainement la liste de tous nos magasins ouverts,
            avec une carte pour les localiser.
          </p>
        </div>
      </main>
    </div>
  );
}
