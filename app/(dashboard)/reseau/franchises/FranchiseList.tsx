"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Franchise, Magasin } from "@/lib/types";

type MagasinLight = Pick<Magasin, "id" | "nom" | "ville" | "franchise_id" | "archive">;

export function FranchiseList({
  franchises,
  magasinsByFranchise,
  isAdmin,
}: {
  franchises: Franchise[];
  magasinsByFranchise: Record<string, MagasinLight[]>;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return franchises;
    return franchises.filter((f) => {
      const hay = [
        f.nom,
        f.raison_sociale,
        f.siren,
        ...f.associes.map((a) => `${a.prenom} ${a.nom} ${a.email ?? ""} ${a.telephone ?? ""}`),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [franchises, search]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Rechercher un franchisé, associé, SIREN…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input w-full"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-10">Aucun résultat.</p>
      )}

      {filtered.map((f) => {
        const leurs = magasinsByFranchise[f.id] ?? [];
        const actifs = leurs.filter((m) => !m.archive);
        const fermes = leurs.filter((m) => m.archive);
        return (
          <div key={f.id} className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between px-5 py-4">
              <div>
                <h2 className="font-semibold text-zinc-900">{f.nom}</h2>
                {f.raison_sociale && <p className="text-sm text-zinc-500 mt-0.5">{f.raison_sociale}</p>}
                {f.associes.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {f.associes.map((a) => `${a.prenom} ${a.nom}`).join(", ")}
                  </p>
                )}
                {(f.siren || f.rcs || f.tva_intracom) && (
                  <p className="text-xs text-zinc-400 mt-1 space-x-3">
                    {f.siren && <span>SIREN : {f.siren}</span>}
                    {f.rcs && <span>RCS : {f.rcs}</span>}
                    {f.tva_intracom && <span>TVA : {f.tva_intracom}</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {actifs.length > 0 && (
                  <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-0.5">
                    {actifs.length} magasin{actifs.length > 1 ? "s" : ""} actif{actifs.length > 1 ? "s" : ""}
                  </span>
                )}
                {fermes.length > 0 && (
                  <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-0.5">
                    {fermes.length} fermé{fermes.length > 1 ? "s" : ""}
                  </span>
                )}
                {isAdmin && (
                  <Link href={`/reseau/franchises/${f.id}`} className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline">
                    Modifier
                  </Link>
                )}
              </div>
            </div>

            {leurs.length > 0 && (
              <div className="border-t border-zinc-100 px-5 py-3 bg-zinc-50">
                <p className="text-xs font-medium text-zinc-400 mb-2">Magasins</p>
                <div className="flex flex-wrap gap-2">
                  {leurs.map((m) => (
                    <Link key={m.id} href={`/reseau/${m.id}`}
                      className={`text-xs border rounded px-2.5 py-1 hover:bg-zinc-100 ${
                        m.archive
                          ? "bg-zinc-50 border-zinc-200 text-zinc-400 line-through"
                          : "bg-white border-zinc-200 text-zinc-700"
                      }`}>
                      {m.nom}{m.ville ? ` · ${m.ville}` : ""}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {f.associes.length > 0 && (
              <div className="border-t border-zinc-100 px-5 py-3">
                <p className="text-xs font-medium text-zinc-400 mb-2">Contacts</p>
                <div className="flex flex-wrap gap-6">
                  {f.associes.map((a, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-zinc-900">{a.prenom} {a.nom}</span>
                      {a.telephone && <span className="text-zinc-500 ml-2">{a.telephone}</span>}
                      {a.email && <span className="text-zinc-400 ml-2 text-xs">{a.email}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
