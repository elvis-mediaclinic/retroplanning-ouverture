import { PublicSidebar } from "@/components/PublicSidebar";

export const metadata = { title: "La franchise — Mediaclinic" };

export default function FranchisePage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <style>{`
        body { background: #f4f4f5; }
      `}</style>

      <PublicSidebar active="franchise" />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">
            La franchise
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-3">
            Cette page arrive bientôt
          </h1>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Retrouvez ici prochainement toutes les informations sur le concept Mediaclinic
            et le programme de franchise.
          </p>
        </div>
      </main>
    </div>
  );
}
