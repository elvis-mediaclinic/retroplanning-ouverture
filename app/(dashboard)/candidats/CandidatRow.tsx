"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUT_CANDIDAT_LABELS } from "@/lib/types";
import { STATUT_CANDIDAT_COLORS } from "@/lib/utils";
import { CopyEmail } from "./CopyEmail";

type Associe = { id: string; prenom: string; nom: string; email: string | null; telephone: string | null; ordre: number };

type Candidat = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  zone_souhaitee: string | null;
  statut: string;
  apport_personnel: number | null;
  profil_id: string | null;
  candidat_villes: Array<{ villes: { nom: string } | { nom: string }[] | null }> | null;
  projets: Array<{ id: string; statut: string }> | null;
  candidat_associes: Associe[] | null;
  consultant?: { prenom: string; nom: string } | null;
};

function getVilles(c: Candidat) {
  const cvs = c.candidat_villes ?? [];
  const noms = cvs.map((cv) => {
    const v = cv.villes;
    return Array.isArray(v) ? v[0]?.nom : v?.nom;
  }).filter(Boolean) as string[];
  return noms.length > 0 ? noms.join(", ") : (c.zone_souhaitee ?? "—");
}

export function CandidatRow({ c, showProjet }: { c: Candidat; showProjet?: boolean }) {
  const router = useRouter();
  const projetsActifs = (c.projets ?? []).filter((p) => ["prospection", "en_cours"].includes(p.statut));
  const associes = [...(c.candidat_associes ?? [])].sort((a, b) => a.ordre - b.ordre);
  return (
    <tr
      onClick={() => router.push(`/candidats/${c.id}`)}
      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50 align-top"
    >
      <td className="py-2 px-4">
        <div className="min-h-[1.25rem] flex items-center gap-2">
          <span className="font-medium text-zinc-900">{c.prenom} {c.nom}</span>
          {c.consultant && (
            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
              {c.consultant.prenom} {c.consultant.nom}
            </span>
          )}
        </div>
        {c.profil_id && <div className="text-xs text-green-600 mt-0.5">✓ Compte actif</div>}
        {associes.map((a) => (
          <div key={a.id} className="mt-1.5 pt-1.5 border-t border-zinc-100 font-medium text-zinc-900">
            {a.prenom} {a.nom}
          </div>
        ))}
      </td>
      <td className="py-2 px-4 text-zinc-500">
        <div className="min-h-[1.25rem]"><CopyEmail email={c.email} /></div>
        {associes.map((a) => (
          <div key={a.id} className="mt-1.5 pt-1.5 border-t border-zinc-100">
            {a.email ? <CopyEmail email={a.email} /> : "—"}
          </div>
        ))}
      </td>
      <td className="py-2 px-4 text-zinc-500">
        <div className="min-h-[1.25rem]">{c.telephone ?? "—"}</div>
        {associes.map((a) => (
          <div key={a.id} className="mt-1.5 pt-1.5 border-t border-zinc-100">
            {a.telephone ?? "—"}
          </div>
        ))}
      </td>
      <td className="py-2 px-4 text-zinc-500">{getVilles(c)}</td>
      <td className="py-2 px-4 text-zinc-500">
        {c.apport_personnel ? `${c.apport_personnel.toLocaleString("fr-FR")} €` : "—"}
      </td>
      {showProjet && (
        <td className="py-2 px-4">
          {projetsActifs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {projetsActifs.map((p) => (
                <Link key={p.id} href={`/projets/${p.id}`} onClick={(e) => e.stopPropagation()}
                  className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand/20">
                  Projet →
                </Link>
              ))}
            </div>
          ) : "—"}
        </td>
      )}
      <td className="py-2 px-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          STATUT_CANDIDAT_COLORS[c.statut as keyof typeof STATUT_CANDIDAT_COLORS]
        }`}>
          {STATUT_CANDIDAT_LABELS[c.statut as keyof typeof STATUT_CANDIDAT_LABELS]}
        </span>
      </td>
    </tr>
  );
}
