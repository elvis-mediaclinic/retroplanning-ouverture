import { requireRole } from "@/lib/dal";
import { FranchiseForm } from "../FranchiseForm";

export default async function NewFranchisePage() {
  await requireRole("admin");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <a href="/reseau/franchises" className="text-sm text-zinc-500 hover:text-zinc-900">← Franchisés</a>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Nouveau franchisé</h1>
      </div>
      <FranchiseForm />
    </div>
  );
}
