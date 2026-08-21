import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { FORMAT_LABELS } from "@/lib/types";
import type { Magasin } from "@/lib/types";
import { getProfile } from "@/lib/dal";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function ReseauPage() {
  const [profile] = await Promise.all([getProfile()]);
  await requireMC();
  const supabase = await createClient();

  const { data } = await supabase
    .from("magasins")
    .select("*")
    .order("date_ouverture", { ascending: false });

  const magasins = (data ?? []) as Magasin[];
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Réseau</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {magasins.length} magasin{magasins.length !== 1 ? "s" : ""} dans le réseau
          </p>
        </div>
        {isAdmin && (
          <Link href="/reseau/new" className="btn-primary text-sm">
            + Ajouter un magasin
          </Link>
        )}
      </div>

      {magasins.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">Aucun magasin dans le réseau pour l'instant.</p>
          {isAdmin && (
            <Link href="/reseau/new" className="mt-3 inline-block text-sm text-brand hover:underline">
              Ajouter le premier magasin
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {magasins.map((m) => (
            <div key={m.id} className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
                <div>
                  <h2 className="font-semibold text-zinc-900">{m.nom}</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {[m.adresse, m.code_postal, m.ville].filter(Boolean).join(", ") || "Adresse non renseignée"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                <div className="px-5 py-3">
                  <p className="text-xs text-zinc-400">Signature contrat</p>
                  <p className="text-sm font-medium text-zinc-900 mt-0.5">{formatDate(m.date_signature_contrat)}</p>
                </div>
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

              {/* Franchisés / associés */}
              {m.franchises?.length > 0 && (
                <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50">
                  <p className="text-xs font-medium text-zinc-400 mb-2">Franchisé(s)</p>
                  <div className="flex flex-wrap gap-4">
                    {m.franchises.map((f, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-zinc-900">{f.prenom} {f.nom}</span>
                        {f.telephone && <span className="text-zinc-500 ml-2">{f.telephone}</span>}
                        {f.email && <span className="text-zinc-400 ml-2 text-xs">{f.email}</span>}
                      </div>
                    ))}
                  </div>
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
