import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createCandidat } from "../actions";
import { CandidatForm } from "../CandidatForm";

export default async function NewCandidatPage() {
  await requireMC();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/candidats" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Candidats
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900">Nouveau candidat</h1>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CandidatForm action={createCandidat} submitLabel="Créer" />
      </div>
    </div>
  );
}
