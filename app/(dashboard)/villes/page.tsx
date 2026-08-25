import Link from "next/link";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_VILLE_LABELS } from "@/lib/types";
import { STATUT_VILLE_COLORS } from "@/lib/utils";
import { PropositionActions } from "./PropositionActions";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";

type Ville = {
  id: string;
  nom: string;
  departement: string | null;
  region: string | null;
  zone_chalandise: string | null;
  statut: string;
  annonces: Array<{ id: string; actif: boolean }> | null;
  candidatures: Array<{ id: string }> | null;
  projets: Array<{ id: string; statut: string }> | null;
};

function VilleRow({ v, canEdit }: { v: Ville; canEdit: boolean }) {
  const annonce = v.annonces?.[0] ?? null;
  const nbCandidatures = v.candidatures?.length ?? 0;
  const projetsActifs = (v.projets ?? []).filter((p) =>
    ["prospection", "en_cours"].includes(p.statut)
  );

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="py-2 px-4 font-medium text-zinc-900">{v.nom}</td>
      <td className="py-2 px-4 text-zinc-500">
        {[v.departement, v.region].filter(Boolean).join(" · ") || "—"}
      </td>
      <td className="py-2 px-4 text-zinc-500">
        {v.zone_chalandise ?? "—"}
      </td>
      <td className="py-2 px-4">
        {projetsActifs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {projetsActifs.map((p) => (
              <Link key={p.id} href={`/projets/${p.id}`}
                className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand/20">
                Projet →
              </Link>
            ))}
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>
      <td className="py-2 px-4">
        {annonce ? (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              annonce.actif ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
            }`}>
              {annonce.actif ? "Publiée" : "Brouillon"}
            </span>
            {annonce.actif && (
              <a href={`${baseUrl}/annonce/${annonce.id}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand hover:text-brand-dark">
                Voir ↗
              </a>
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>
      <td className="py-2 px-4">
        {nbCandidatures > 0 ? (
          <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {nbCandidatures}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>
      <td className="py-2 px-4 text-right">
        <Link href={`/villes/${v.id}`} className="text-xs text-zinc-500 hover:text-zinc-900">
          {canEdit ? "Éditer" : "Voir"}
        </Link>
      </td>
    </tr>
  );
}

function VilleTable({ villes, canEdit, empty }: { villes: Ville[]; canEdit: boolean; empty: string }) {
  if (villes.length === 0) {
    return <p className="text-sm text-zinc-400 py-3">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
            <th className="py-2 px-4 font-medium text-white">Ville</th>
            <th className="py-2 px-4 font-medium text-white">Dép. / Région</th>
            <th className="py-2 px-4 font-medium text-white">Zone de chalandise</th>
            <th className="py-2 px-4 font-medium text-white">Projet</th>
            <th className="py-2 px-4 font-medium text-white">Annonce</th>
            <th className="py-2 px-4 font-medium text-white">Candidatures</th>
            <th className="py-2 px-4" />
          </tr>
        </thead>
        <tbody>
          {villes.map((v) => <VilleRow key={v.id} v={v} canEdit={canEdit} />)}
        </tbody>
      </table>
    </div>
  );
}

export default async function VillesPage() {
  await requireMC();
  const profile = await getProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("villes")
    .select("id, nom, departement, region, zone_chalandise, statut, annonces(id, actif), candidatures(id), projets(id, statut)")
    .neq("statut", "abandonnee")
    .order("nom");

  const villes = ((data ?? []) as Ville[]);

  const propositions = villes.filter((v) => v.statut === "proposition");
  const enEtude = villes.filter((v) => v.statut === "en_etude");
  const validees = villes.filter((v) => v.statut === "validee");

  const canEdit =
    profile.role === "admin" ||
    profile.role === "consultant" ||
    (profile.role === "responsable_mc" && !!profile.fonction?.toLowerCase().includes("marketing"));

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase text-white">Villes</h1>
          <p className="mt-1 text-sm text-white/70">
            {propositions.length > 0 && `${propositions.length} proposition${propositions.length !== 1 ? "s" : ""} à valider · `}
            {enEtude.length} en étude · {validees.length} validée{validees.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && (
          <Link href="/villes/new" className="rounded-md bg-white px-3 py-2 text-sm font-medium text-[#00729e] hover:bg-white/90 transition-colors">
            + Ajouter
          </Link>
        )}
      </div>

      {/* Propositions à valider — soumises via un intérêt spontané */}
      {canEdit && propositions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-500">
            Propositions à valider ({propositions.length})
          </h2>
          <div className="overflow-hidden rounded-lg border border-violet-200 bg-white shadow-sm divide-y divide-violet-100">
            {propositions.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{v.nom}</p>
                  <p className="text-xs text-zinc-400">
                    {[v.departement, v.region].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/villes/${v.id}`} className="text-xs text-zinc-500 hover:text-zinc-900">
                    Voir
                  </Link>
                  <PropositionActions villeId={v.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Validées — projet en cours */}
      {validees.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Validées — projet en cours
          </h2>
          <VilleTable villes={validees} canEdit={canEdit} empty="Aucune ville validée." />
        </section>
      )}

      {/* En étude */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          En étude
        </h2>
        <VilleTable villes={enEtude} canEdit={canEdit} empty="Aucune ville en étude." />
      </section>
    </div>
  );
}
