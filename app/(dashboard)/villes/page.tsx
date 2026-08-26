import Link from "next/link";
import { requireMCOrConsultant, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_VILLE_LABELS } from "@/lib/types";
import { STATUT_VILLE_COLORS } from "@/lib/utils";
import { PropositionActions } from "./PropositionActions";
import { VilleRow } from "./VilleRow";

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

function VilleCard({ v }: { v: Ville }) {
  const annonce = v.annonces?.[0] ?? null;
  const nbCandidatures = v.candidatures?.length ?? 0;
  const projetsActifs = (v.projets ?? []).filter((p) =>
    ["prospection", "en_cours"].includes(p.statut)
  );

  return (
    <Link href={`/villes/${v.id}`} className="block px-4 py-3 hover:bg-zinc-50">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-zinc-900">{v.nom}</p>
        {annonce && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            annonce.actif ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
          }`}>
            {annonce.actif ? "Publiée" : "Brouillon"}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-zinc-400">
        {[v.departement, v.region].filter(Boolean).join(" · ") || "—"}
        {v.zone_chalandise && ` · ${v.zone_chalandise}`}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {projetsActifs.length > 0 && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {projetsActifs.length} projet{projetsActifs.length > 1 ? "s" : ""}
          </span>
        )}
        {nbCandidatures > 0 && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {nbCandidatures} candidature{nbCandidatures > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}

function VilleTable({
  villes,
  empty,
  showProjet = true,
  showAnnonce = true,
}: {
  villes: Ville[];
  empty: string;
  showProjet?: boolean;
  showAnnonce?: boolean;
}) {
  if (villes.length === 0) {
    return <p className="text-sm text-zinc-400 py-3">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {/* Mobile : cartes */}
      <div className="sm:hidden divide-y divide-zinc-100">
        {villes.map((v) => <VilleCard key={v.id} v={v} />)}
      </div>

      {/* Desktop : tableau */}
      <table className="hidden sm:table w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
            <th className="py-2 px-4 font-medium text-white">Ville</th>
            <th className="py-2 px-4 font-medium text-white">Dép. / Région</th>
            <th className="py-2 px-4 font-medium text-white text-right">Zone de chalandise</th>
            {showProjet && <th className="py-2 px-4 font-medium text-white">Projet</th>}
            {showAnnonce && <th className="py-2 px-4 font-medium text-white">Annonce</th>}
            <th className="py-2 px-4 font-medium text-white">Candidatures</th>
          </tr>
        </thead>
        <tbody>
          {villes.map((v) => <VilleRow key={v.id} v={v} showProjet={showProjet} showAnnonce={showAnnonce} />)}
        </tbody>
      </table>
    </div>
  );
}

export default async function VillesPage() {
  await requireMCOrConsultant();
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
    (profile.role === "responsable_mc" && !!profile.fonction?.toLowerCase().includes("marketing"));

  return (
    <div className="space-y-8">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Villes</h1>
          <p className="page-header-subtitle">
            {propositions.length > 0 && `${propositions.length} proposition${propositions.length !== 1 ? "s" : ""} à valider · `}
            {enEtude.length} en étude · {validees.length} validée{validees.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && (
          <Link href="/villes/new" className="btn-primary">
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
          <VilleTable villes={validees} empty="Aucune ville validée." showAnnonce={false} />
        </section>
      )}

      {/* En étude */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          En étude
        </h2>
        <VilleTable villes={enEtude} empty="Aucune ville en étude." showProjet={false} />
      </section>
    </div>
  );
}
