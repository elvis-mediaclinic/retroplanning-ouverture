"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

export function VilleRow({ v, showProjet, showAnnonce }: { v: Ville; showProjet: boolean; showAnnonce: boolean }) {
  const router = useRouter();
  const annonce = v.annonces?.[0] ?? null;
  const nbCandidatures = v.candidatures?.length ?? 0;
  const projetsActifs = (v.projets ?? []).filter((p) =>
    ["prospection", "en_cours"].includes(p.statut)
  );

  return (
    <tr
      onClick={() => router.push(`/villes/${v.id}`)}
      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
    >
      <td className="py-2 px-4 font-medium text-zinc-900">{v.nom}</td>
      <td className="py-2 px-4 text-zinc-500">
        {[v.departement, v.region].filter(Boolean).join(" · ") || "—"}
      </td>
      <td className="py-2 px-4 text-zinc-500">
        {v.zone_chalandise ?? "—"}
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
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          )}
        </td>
      )}
      {showAnnonce && (
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
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-brand hover:text-brand-dark">
                  Voir ↗
                </a>
              )}
            </div>
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          )}
        </td>
      )}
      <td className="py-2 px-4">
        {nbCandidatures > 0 ? (
          <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {nbCandidatures}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>
    </tr>
  );
}
