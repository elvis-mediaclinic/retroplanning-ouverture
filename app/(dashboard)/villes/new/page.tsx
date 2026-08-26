import Link from "next/link";
import { requireMarketing } from "@/lib/dal";
import { createVille } from "../actions";
import { VilleForm } from "../VilleForm";

export default async function NewVillePage() {
  await requireMarketing();
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-header-title">Nouvelle ville</h1>
      </div>
      <div>
        <Link href="/villes" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Villes
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <VilleForm action={createVille} submitLabel="Créer" />
      </div>
    </div>
  );
}
