import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateVille } from "../actions";
import { VilleInfoPanel } from "./VilleInfoPanel";
import { ConcurrentsPanel } from "./ConcurrentsPanel";
import type { VilleConcurrent } from "@/lib/types";

export default async function EditVillePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMC();
  const profile = await getProfile();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ville }, { data: annonce }, { data: candidatures }, { data: concurrents }] = await Promise.all([
    supabase.from("villes").select("*").eq("id", id).single(),
    supabase.from("annonces").select("id, actif").eq("ville_id", id).maybeSingle(),
    supabase
      .from("candidatures")
      .select("id, prenom, nom, email, telephone, apport_personnel, message, traite, created_at")
      .eq("ville_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("ville_concurrents").select("*").eq("ville_id", id),
  ]);

  if (!ville) notFound();

  const canEdit =
    profile.role === "admin" ||
    profile.role === "consultant" ||
    (profile.role === "responsable_mc" && !!profile.fonction?.toLowerCase().includes("marketing"));

  const action = updateVille.bind(null, id);

  return (
    <div className="space-y-8">
      <div className="page-header flex items-center justify-between">
        <h1 className="page-header-title">{ville.nom}</h1>
        {canEdit && (
          <Link href={`/villes/${id}/annonce`} className="btn-secondary text-sm">
            {annonce ? "Éditer l'annonce" : "Créer l'annonce"}
            {annonce && (
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                annonce.actif ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
              }`}>
                {annonce.actif ? "Publiée" : "Brouillon"}
              </span>
            )}
          </Link>
        )}
      </div>
      <div>
        <Link href="/villes" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Villes
        </Link>
      </div>

      {/* Infos ville */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <VilleInfoPanel ville={ville} action={action} canEdit={canEdit} />
      </section>

      {/* Concurrents en place */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Concurrents en place</h2>
        <ConcurrentsPanel villeId={id} concurrents={(concurrents ?? []) as VilleConcurrent[]} zoneChalandise={ville.zone_chalandise} />
      </section>

      {/* Candidatures reçues */}
      {(candidatures ?? []).length > 0 && (() => {
        const groups = new Map<string, typeof candidatures>();
        for (const c of candidatures ?? []) {
          const key = c.email;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(c);
        }
        const entries = [...groups.entries()];

        return (
          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-zinc-900">
                Candidatures reçues{" "}
                <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  {candidatures?.length}
                </span>
                {entries.length < (candidatures?.length ?? 0) && (
                  <span className="ml-2 text-xs text-zinc-400 font-normal">
                    ({entries.length} personne{entries.length > 1 ? "s" : ""})
                  </span>
                )}
              </h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {entries.map(([email, msgs]) => {
                const first = msgs![0];
                const isRepeat = msgs!.length > 1;
                return (
                  <div key={email} className="px-6 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900 text-sm">{first.prenom} {first.nom}</p>
                        {isRepeat && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {msgs!.length} candidatures
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {msgs!.every((m) => m.traite) && (
                          <span className="text-xs text-green-600 font-medium">✓ Traité</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-zinc-500">
                      <a href={`mailto:${email}`} className="hover:text-zinc-900">{email}</a>
                      {first.telephone && <span>{first.telephone}</span>}
                      {first.apport_personnel && (
                        <span>Apport : {Number(first.apport_personnel).toLocaleString("fr-FR")} €</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {msgs!.map((m) => (
                        <div key={m.id} className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                          <span className="text-zinc-400 mr-2">
                            {new Date(m.created_at).toLocaleDateString("fr-FR")}
                          </span>
                          {m.message ? m.message : <span className="italic">Aucun message</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
