import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CandidatureForm } from "./CandidatureForm";

export default async function AnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: annonce } = await supabase
    .from("annonces")
    .select("id, titre, accroche, contenu, actif, villes(id, nom)")
    .eq("id", id)
    .eq("actif", true)
    .single();

  if (!annonce) notFound();

  const villeRaw = annonce.villes as unknown;
  const ville = Array.isArray(villeRaw)
    ? (villeRaw[0] as { id: string; nom: string } | undefined)
    : (villeRaw as { id: string; nom: string } | null);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center gap-2">
          <span className="font-bold text-zinc-900 text-sm">Mediaclinic</span>
          {ville && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-sm text-zinc-500">{ville.nom}</span>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-10">
        {/* Annonce */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Opportunité de franchise
          </p>
          <h1 className="text-2xl font-bold text-zinc-900">{annonce.titre}</h1>
          {annonce.accroche && (
            <p className="text-lg text-zinc-600">{annonce.accroche}</p>
          )}
          {annonce.contenu && (
            <div className="mt-4 prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap">
              {annonce.contenu}
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900 mb-1">
            Je candidate
          </h2>
          <p className="text-sm text-zinc-500 mb-5">
            Remplissez ce formulaire et l&apos;équipe Mediaclinic vous recontactera rapidement.
          </p>
          <CandidatureForm annonceId={annonce.id} villeId={ville?.id ?? ""} />
        </div>

        <p className="text-center text-xs text-zinc-400">
          © Mediaclinic — Réseau de franchise
        </p>
      </main>
    </div>
  );
}
