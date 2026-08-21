import { requireRole } from "@/lib/dal";
import { MagasinForm } from "../MagasinForm";

export default async function NewMagasinPage({
  searchParams,
}: {
  searchParams: Promise<{ projet_id?: string; projet_nom?: string }>;
}) {
  await requireRole("admin");
  const { projet_id, projet_nom } = await searchParams;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <a href="/reseau" className="text-sm text-zinc-500 hover:text-zinc-900">← Réseau</a>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Nouveau magasin</h1>
      </div>
      <MagasinForm projetId={projet_id} projetNom={projet_nom ? decodeURIComponent(projet_nom) : null} />
    </div>
  );
}
