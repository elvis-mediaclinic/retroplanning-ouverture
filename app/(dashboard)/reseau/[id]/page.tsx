import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Magasin, Franchise, MagasinSiret, MagasinCession } from "@/lib/types";
import { MagasinForm } from "../MagasinForm";
import { DeleteMagasinButton } from "./DeleteMagasinButton";
import { CessionModal } from "./CessionModal";

const TYPE_CESSION_LABELS: Record<string, string> = {
  franchise_a_franchise: "Franchisé → Franchisé",
  integre_a_franchise:   "Intégré → Franchisé",
  franchise_a_integre:   "Franchisé → Intégré",
};

export default async function EditMagasinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data },
    { data: franchisesData },
    { data: siretsData },
    { data: cessionsData },
    { data: annonceCession },
    { data: candidatures },
  ] = await Promise.all([
    supabase.from("magasins").select("*").eq("id", id).single(),
    supabase.from("franchises").select("*").order("nom"),
    supabase.from("magasin_sirets").select("*").eq("magasin_id", id).order("date_debut", { ascending: false }),
    supabase.from("magasin_cessions").select("*").eq("magasin_id", id).order("date_cession", { ascending: false }),
    supabase
      .from("annonces")
      .select("id, actif")
      .eq("magasin_id", id)
      .eq("type_annonce", "cession")
      .maybeSingle(),
    supabase
      .from("candidatures")
      .select("id, prenom, nom, email, telephone, apport_personnel, message, traite, created_at, consultant_id, consultant:profiles(prenom, nom)")
      .eq("magasin_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!data) notFound();

  const magasin = data as Magasin;
  const franchises = (franchisesData ?? []) as Franchise[];
  const sirets = (siretsData ?? []) as MagasinSiret[];
  const cessions = (cessionsData ?? []) as MagasinCession[];

  const siretActuel = sirets.find((s) => s.date_fin === null)?.siret ?? null;

  // Map franchise id → nom pour l'historique
  const franchiseMap = Object.fromEntries(franchises.map((f) => [f.id, f.nom]));

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <h1 className="page-header-title">{magasin.nom}</h1>
        <div className="flex items-center gap-2">
          {!magasin.archive && (
            <Link href={`/reseau/${id}/cession`} className="btn-secondary text-sm">
              {annonceCession ? "Éditer l'annonce de cession" : "Créer une annonce de cession"}
              {annonceCession && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  annonceCession.actif ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {annonceCession.actif ? "Publiée" : "Brouillon"}
                </span>
              )}
            </Link>
          )}
          <CessionModal magasin={magasin} franchises={franchises} siretActuel={siretActuel} />
          <DeleteMagasinButton id={id} />
        </div>
      </div>
      <div>
        <a href="/reseau" className="text-sm text-zinc-500 hover:text-zinc-900">← Réseau</a>
      </div>

      <MagasinForm magasin={magasin} franchises={franchises} siretActuel={siretActuel} />

      {/* Historique des SIRET */}
      {sirets.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Historique des SIRET</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                <th className="pb-2 font-medium">SIRET</th>
                <th className="pb-2 font-medium">Depuis</th>
                <th className="pb-2 font-medium">Jusqu&apos;au</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sirets.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-mono text-zinc-800">
                    {s.siret}
                    {s.date_fin === null && (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Actuel</span>
                    )}
                  </td>
                  <td className="py-2 text-zinc-500">{new Date(s.date_debut).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2 text-zinc-400">
                    {s.date_fin ? new Date(s.date_fin).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Historique des cessions */}
      {cessions.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Historique des cessions</h2>
          <div className="space-y-3">
            {cessions.map((c) => (
              <div key={c.id} className="rounded-md border border-zinc-100 bg-zinc-50 p-4 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-800">
                    {TYPE_CESSION_LABELS[c.type_cession] ?? c.type_cession}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(c.date_cession).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {c.franchise_cedant_id && (
                  <p className="text-zinc-500">
                    Cédant : <span className="text-zinc-700">{franchiseMap[c.franchise_cedant_id] ?? c.franchise_cedant_id}</span>
                  </p>
                )}
                {c.franchise_repreneur_id && (
                  <p className="text-zinc-500">
                    Repreneur : <span className="text-zinc-700">{franchiseMap[c.franchise_repreneur_id] ?? c.franchise_repreneur_id}</span>
                  </p>
                )}
                {c.nouveau_siret && (
                  <p className="text-zinc-500">
                    Nouveau SIRET : <span className="font-mono text-zinc-700">{c.nouveau_siret}</span>
                  </p>
                )}
                {c.notes && <p className="text-zinc-400 italic">{c.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Candidatures reçues (reprise) */}
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
                      {msgs!.map((m) => {
                        const consultantRaw = m.consultant as unknown;
                        const consultant = Array.isArray(consultantRaw)
                          ? (consultantRaw[0] as { prenom: string; nom: string } | undefined)
                          : (consultantRaw as { prenom: string; nom: string } | null);
                        return (
                          <div key={m.id} className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-zinc-400">
                                {new Date(m.created_at).toLocaleDateString("fr-FR")}
                              </span>
                              {consultant ? (
                                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                                  Consultant — {consultant.prenom} {consultant.nom}
                                </span>
                              ) : (
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                                  Lien direct
                                </span>
                              )}
                            </div>
                            {m.message ? m.message : <span className="italic">Aucun message</span>}
                          </div>
                        );
                      })}
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
