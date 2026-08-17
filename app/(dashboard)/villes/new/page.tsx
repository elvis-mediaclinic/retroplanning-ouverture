import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createVille } from "../actions";
import { VilleForm } from "../VilleForm";

export default async function NewVillePage() {
  await requireMC();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/villes" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Villes
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900">Nouvelle ville</h1>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <VilleForm action={createVille} submitLabel="Créer" />
      </div>
    </div>
  );
}
