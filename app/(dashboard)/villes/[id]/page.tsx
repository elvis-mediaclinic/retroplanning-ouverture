import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateVille } from "../actions";
import { VilleInfoPanel } from "./VilleInfoPanel";
import { AnnonceEditor } from "./AnnonceEditor";
import { BoldText } from "@/components/BoldText";

export default async function EditVillePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMC();
  const profile = await getProfile();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ville }, { data: annonce }, { data: candidatures }] = await Promise.all([
    supabase.from("villes").select("*").eq("id", id).single(),
    supabase.from("annonces").select("id, titre, accroche, contenu, contenu_json, sections, actif").eq("ville_id", id).maybeSingle(),
    supabase
      .from("candidatures")
      .select("id, prenom, nom, email, telephone, apport_personnel, message, traite, created_at")
      .eq("ville_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!ville) notFound();

  const canEdit =
    profile.role === "admin" ||
    profile.role === "consultant" ||
    (profile.role === "responsable_mc" && !!profile.fonction?.toLowerCase().includes("marketing"));

  // Stats de vues — uniquement pour les éditeurs
  let viewStats: { total: number; unique: number } | null = null;
  if (annonce?.id && canEdit) {
    const { data: views } = await supabase
      .from("annonce_views")
      .select("visitor_id")
      .eq("annonce_id", annonce.id);
    if (views) {
      viewStats = {
        total: views.length,
        unique: new Set(views.map((v) => v.visitor_id)).size,
      };
    }
  }

  const action = updateVille.bind(null, id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";
  const publicUrl = annonce ? `${baseUrl}/annonce/${annonce.id}` : `${baseUrl}/annonce/[id]`;

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
        <h1 className="text-2xl font-bold uppercase text-white">{ville.nom}</h1>
      </div>
      <div>
        <Link href="/villes" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Villes
        </Link>
      </div>

      {/* Infos ville */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Informations</h2>
        <VilleInfoPanel ville={ville} action={action} canEdit={canEdit} />
      </section>

      {/* Annonce publique */}
      {canEdit && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Annonce franchisé</h2>
            {viewStats && annonce?.actif && (
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>
                  <span className="font-semibold text-zinc-900">{viewStats.total}</span> vue{viewStats.total !== 1 ? "s" : ""}
                </span>
                <span>
                  <span className="font-semibold text-zinc-900">{viewStats.unique}</span> visiteur{viewStats.unique !== 1 ? "s" : ""} unique{viewStats.unique !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <AnnonceEditor villeId={id} annonce={annonce ?? null} publicUrl={publicUrl} />
        </section>
      )}

      {/* Annonce : lecture seule */}
      {!canEdit && annonce && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Annonce franchisé</h2>
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
              annonce.actif ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
            }`}>
              {annonce.actif ? "Publiée" : "Brouillon"}
            </span>
          </div>
          {annonce.titre && <p className="font-semibold text-zinc-900 mb-1">{annonce.titre}</p>}
          {annonce.accroche && <p className="text-sm text-zinc-500 mb-3 italic"><BoldText text={annonce.accroche} /></p>}
          {annonce.actif && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-brand hover:underline">
              Voir l'annonce publique ↗
            </a>
          )}
        </section>
      )}

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
