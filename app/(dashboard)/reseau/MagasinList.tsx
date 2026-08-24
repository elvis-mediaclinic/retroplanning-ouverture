"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { MagasinWithFranchise } from "./page";
import { FORMAT_LABELS, type FormatMagasin } from "@/lib/types";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const FORMATS = Object.entries(FORMAT_LABELS) as [FormatMagasin, string][];

export function MagasinList({
  magasins,
  isAdmin,
  isArchive,
}: {
  magasins: MagasinWithFranchise[];
  isAdmin: boolean;
  isArchive: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "integre" | "franchise">("");
  const [filterFormat, setFilterFormat] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return magasins.filter((m) => {
      if (filterType && m.type !== filterType) return false;
      if (filterFormat && m.format !== filterFormat) return false;
      if (q) {
        const hay = [m.nom, m.ville, m.code_postal, m.adresse, m.franchises?.nom].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [magasins, search, filterType, filterFormat]);

  const formats = [...new Set(magasins.map((m) => m.format).filter(Boolean))] as FormatMagasin[];

  return (
    <div className="space-y-4">
      {/* Barre de recherche + filtres */}
      <div className="flex flex-wrap gap-2">
        {/* Leurres pour Safari qui détecte les champs texte comme des logins */}
        <input type="text" name="fake_user" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
        <input type="password" name="fake_pass" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
        <input
          type="text"
          placeholder="Rechercher un magasin, ville…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          className="input flex-1 min-w-48"
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)} className="input">
          <option value="">Tous les types</option>
          <option value="franchise">Franchisé</option>
          <option value="integre">Intégré</option>
        </select>
        {formats.length > 1 && (
          <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="input">
            <option value="">Tous les formats</option>
            {FORMATS.filter(([k]) => formats.includes(k)).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-10">Aucun résultat.</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {filtered.map((m) => (
        <div key={m.id} className={`rounded-lg border bg-white shadow-sm overflow-hidden ${isArchive ? "opacity-80" : ""} border-zinc-200`}>
          <Link
            href={`/reseau/${m.id}`}
            className="flex items-start justify-between px-5 py-4 bg-[#0089bd] text-white hover:bg-[#00729e] transition-colors"
          >
            <div>
              <h2 className="font-semibold">{m.nom}</h2>
              <p className="text-sm text-white/80 mt-0.5">
                {[m.adresse, m.code_postal, m.ville].filter(Boolean).join(", ") || "Adresse non renseignée"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs border rounded px-2 py-0.5 ${
                m.type === "integre"
                  ? "text-white border-white/40 bg-white/10"
                  : "text-white/80 border-white/30"
              }`}>
                {m.type === "integre" ? "Intégré" : "Franchisé"}
              </span>
              {m.format && (
                <span className="text-xs text-white/80 border border-white/30 rounded px-2 py-0.5">
                  {FORMAT_LABELS[m.format]}
                </span>
              )}
              {m.surface_m2 && <span className="text-xs text-white/80">{m.surface_m2} m²</span>}
            </div>
          </Link>

          {isArchive ? (
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100">
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
                <p className="text-xs text-red-400">Fermeture</p>
                <p className="text-sm font-semibold text-red-700 mt-0.5">{formatDate(m.date_fermeture)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100">
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
          )}

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
    </div>
  );
}
