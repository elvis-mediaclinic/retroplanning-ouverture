"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUT_CANDIDAT_LABELS } from "@/lib/types";
import { STATUT_CANDIDAT_COLORS } from "@/lib/utils";
import { CopyEmail } from "./CopyEmail";

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
  return (
    <tr
      onClick={() => router.push(`/candidats/${c.id}`)}
      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
    >
      <td className="py-2 px-4">
        <span className="font-medium text-zinc-900">{c.prenom} {c.nom}</span>
        {c.profil_id && <div className="text-xs text-green-600 mt-0.5">✓ Compte actif</div>}
      </td>
      <td className="py-2 px-4 text-zinc-500">
        <CopyEmail email={c.email} />
      </td>
      <td className="py-2 px-4 text-zinc-500">{c.telephone ?? "—"}</td>
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
