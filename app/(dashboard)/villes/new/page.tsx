import Link from "next/link";
import { requireMarketing } from "@/lib/dal";
import { createVille } from "../actions";
import { VilleForm } from "../VilleForm";

export default async function NewVillePage() {
  await requireMarketing();
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
        <h1 className="text-2xl font-bold uppercase text-white">Nouvelle ville</h1>
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
