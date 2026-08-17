import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateVille } from "../actions";
import { VilleForm } from "../VilleForm";
import { AnnonceEditor } from "./AnnonceEditor";

export default async function EditVillePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMC();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ville }, { data: annonce }, { data: candidatures }] = await Promise.all([
    supabase.from("villes").select("*").eq("id", id).single(),
    supabase.from("annonces").select("id, titre, accroche, contenu, contenu_json, actif").eq("ville_id", id).maybeSingle(),
    supabase
      .from("candidatures")
      .select("id, prenom, nom, email, telephone, apport_personnel, message, traite, created_at")
      .eq("ville_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!ville) notFound();

  const action = updateVille.bind(null, id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";
  const publicUrl = annonce ? `${baseUrl}/annonce/${annonce.id}` : `${baseUrl}/annonce/[id]`;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/villes" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Villes
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900">{ville.nom}</h1>
      </div>

      {/* Infos ville */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Informations</h2>
        <VilleForm action={action} defaultValues={ville} />
      </section>

      {/* Annonce publique */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Annonce franchisé</h2>
        <AnnonceEditor villeId={id} annonce={annonce ?? null} publicUrl={publicUrl} />
      </section>

      {/* Candidatures reçues */}
      {(candidatures ?? []).length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Candidatures reçues{" "}
              <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {candidatures?.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {(candidatures ?? []).map((c) => (
              <div key={c.id} className="px-6 py-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-zinc-900 text-sm">
                    {c.prenom} {c.nom}
                  </p>
                  <div className="flex items-center gap-3">
                    {c.traite && (
                      <span className="text-xs text-green-600 font-medium">✓ Traité</span>
                    )}
                    <span className="text-xs text-zinc-400">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <a href={`mailto:${c.email}`} className="hover:text-zinc-900">{c.email}</a>
                  {c.telephone && <span>{c.telephone}</span>}
                  {c.apport_personnel && (
                    <span>Apport : {c.apport_personnel.toLocaleString("fr-FR")} €</span>
                  )}
                </div>
                {c.message && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{c.message}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
