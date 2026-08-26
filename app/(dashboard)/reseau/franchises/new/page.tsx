import { requireRole } from "@/lib/dal";
import { FranchiseForm } from "../FranchiseForm";

export default async function NewFranchisePage() {
  await requireRole("admin");

  return (
    <div className="space-y-6">
      <div className="mt-2">
        <h1 className="text-2xl font-bold uppercase text-zinc-900">Nouveau franchisé</h1>
      </div>
      <div>
        <a href="/reseau/franchises" className="text-sm text-zinc-500 hover:text-zinc-900">← Franchisés</a>
      </div>
      <FranchiseForm />
    </div>
  );
}
