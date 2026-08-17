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
            <div
              className="mt-4 text-zinc-700 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_blockquote]:border-l-4 [&_blockquote]:border-brand/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_a]:text-brand [&_a]:underline [&_img]:rounded-lg [&_img]:my-4 [&_img]:max-w-full [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: annonce.contenu }}
            />
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
