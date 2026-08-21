import Link from "next/link";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { FORMAT_LABELS } from "@/lib/types";
import type { Magasin, Franchise } from "@/lib/types";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

type MagasinWithFranchise = Magasin & { franchises: Franchise | null };

function Tabs({ active }: { active: "actifs" | "archives" }) {
  return (
    <div className="flex border-b border-zinc-200 mb-6">
      {(["actifs", "archives"] as const).map((tab) => (
        <Link
          key={tab}
          href={tab === "actifs" ? "/reseau" : "/reseau?tab=archives"}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === tab
              ? "border-brand text-brand"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {tab === "actifs" ? "Actifs" : "Archivés"}
        </Link>
      ))}
    </div>
  );
}

export default async function ReseauPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireMC();
  const profile = await getProfile();
  const { tab } = await searchParams;
  const showArchives = tab === "archives";

  const supabase = await createClient();

  const { data } = await supabase
    .from("magasins")
    .select("*, franchises(*)")
    .eq("archive", showArchives)
    .order("date_ouverture", { ascending: false });

  const magasins = (data ?? []) as MagasinWithFranchise[];
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Réseau</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {magasins.length} magasin{magasins.length !== 1 ? "s" : ""} {showArchives ? "archivés" : "dans le réseau"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/reseau/franchises" className="btn-secondary text-sm">
              Franchisés
            </Link>
          )}
          {isAdmin && !showArchives && (
            <Link href="/reseau/new" className="btn-primary text-sm">
              + Ajouter un magasin
            </Link>
          )}
        </div>
      </div>

      <Tabs active={showArchives ? "archives" : "actifs"} />

      {magasins.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">
            {showArchives ? "Aucun magasin archivé." : "Aucun magasin dans le réseau pour l'instant."}
          </p>
          {isAdmin && !showArchives && (
            <Link href="/reseau/new" className="mt-3 inline-block text-sm text-brand hover:underline">
              Ajouter le premier magasin
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {magasins.map((m) => (
            <div key={m.id} className={`rounded-lg border bg-white shadow-sm overflow-hidden ${
              m.archive ? "border-zinc-200 opacity-80" : "border-zinc-200"
            }`}>
              <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-zinc-900">{m.nom}</h2>
                    {m.archive && m.date_fermeture && (
                      <span className="text-xs text-zinc-400 bg-zinc-100 rounded px-2 py-0.5">
                        Fermé le {formatDate(m.date_fermeture)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {[m.adresse, m.code_postal, m.ville].filter(Boolean).join(", ") || "Adresse non renseignée"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs border rounded px-2 py-0.5 ${
                    m.type === "integre"
                      ? "text-blue-700 border-blue-200 bg-blue-50"
                      : "text-zinc-500 border-zinc-200"
                  }`}>
                    {m.type === "integre" ? "Intégré" : "Franchisé"}
                  </span>
                  {m.format && (
                    <span className="text-xs text-zinc-500 border border-zinc-200 rounded px-2 py-0.5">
                      {FORMAT_LABELS[m.format]}
                    </span>
                  )}
                  {m.surface_m2 && (
                    <span className="text-xs text-zinc-500">{m.surface_m2} m²</span>
                  )}
                  {isAdmin && (
                    <Link href={`/reseau/${m.id}`} className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline ml-2">
                      Modifier
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-100">
                {m.type === "franchise" && (
                  <div className="px-5 py-3">
                    <p className="text-xs text-zinc-400">Signature contrat</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">{formatDate(m.date_signature_contrat)}</p>
                  </div>
                )}
                <div className="px-5 py-3">
                  <p className="text-xs text-zinc-400">Ouverture</p>
                  <p className="text-sm font-medium text-zinc-900 mt-0.5">{formatDate(m.date_ouverture)}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs text-zinc-400">Téléphone</p>
                  <p className="text-sm font-medium text-zinc-900 mt-0.5">{m.telephone ?? "—"}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs text-zinc-400">Email</p>
                  <p className="text-sm font-medium text-zinc-900 mt-0.5 truncate">{m.email ?? "—"}</p>
                </div>
              </div>

              {m.franchises && (
                <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-zinc-400">Franchisé</p>
                    {isAdmin && (
                      <Link href={`/reseau/franchises/${m.franchises.id}`}
                        className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline">
                        Modifier le franchisé
                      </Link>
                    )}
                  </div>
                  <p className="text-sm font-medium text-zinc-800 mb-1">
                    {m.franchises.nom}
                    {m.franchises.archive && (
                      <span className="ml-2 text-xs text-zinc-400 bg-zinc-200 rounded px-1.5 py-0.5">Archivé</span>
                    )}
                  </p>
                  {m.franchises.associes.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {m.franchises.associes.map((a, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium text-zinc-700">{a.prenom} {a.nom}</span>
                          {a.telephone && <span className="text-zinc-500 ml-2">{a.telephone}</span>}
                          {a.email && <span className="text-zinc-400 ml-2 text-xs">{a.email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {m.notes && (
                <div className="px-5 py-3 border-t border-zinc-100">
                  <p className="text-xs text-zinc-400 mb-1">Notes</p>
                  <p className="text-sm text-zinc-600 whitespace-pre-line">{m.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
