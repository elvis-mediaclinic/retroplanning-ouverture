import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateProjet } from "../../actions";
import { ProjetForm } from "../../ProjetForm";

export default async function EditProjetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projet }, { data: villes }, { data: candidats }, { data: franchisees }] =
    await Promise.all([
      supabase.from("projets").select("*").eq("id", id).single(),
      supabase.from("villes").select("id, nom").order("nom"),
      supabase.from("candidats").select("id, nom, prenom").order("nom"),
      supabase.from("profiles").select("id, nom, prenom").eq("role", "franchise").order("nom"),
    ]);

  if (!projet) notFound();

  const action = updateProjet.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="mt-2">
        <h1 className="text-2xl font-bold uppercase text-zinc-900">
          Modifier le projet
        </h1>
      </div>
      <div>
        <Link
          href={`/projets/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← {projet.nom}
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <ProjetForm
          action={action}
          defaultValues={projet}
          villes={villes ?? []}
          candidats={candidats ?? []}
          franchisees={franchisees ?? []}
        />
      </div>
    </div>
  );
}
