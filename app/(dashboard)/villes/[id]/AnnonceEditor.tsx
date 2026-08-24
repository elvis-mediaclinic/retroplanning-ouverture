"use client";

import { useActionState, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { upsertAnnonce } from "./annonce-actions";
import { BoldText } from "@/components/BoldText";
import type { Section } from "./SectionsEditor";

const SectionsEditor = dynamic(() => import("./SectionsEditor").then((m) => m.SectionsEditor), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-zinc-200 bg-zinc-50 h-40 animate-pulse" />,
});

type Annonce = {
  id: string;
  titre: string;
  accroche: string | null;
  contenu: string | null;
  contenu_json: string | null;
  sections: string | null;
  actif: boolean;
  hero_bleu?: boolean;
};

export function AnnonceEditor({
  villeId,
  annonce,
  publicUrl,
}: {
  villeId: string;
  annonce: Annonce | null;
  publicUrl: string;
}) {
  const action = upsertAnnonce.bind(null, villeId, annonce?.id ?? null);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [actif, setActif] = useState(annonce?.actif ?? false);
  const [accroche, setAccroche] = useState(annonce?.accroche ?? "");
  const accrocheRef = useRef<HTMLTextAreaElement>(null);
  const [heroBleu, setHeroBleu] = useState(annonce?.hero_bleu ?? true);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);

  const defaultSections: Section[] | undefined = (() => {
    if (!annonce?.sections) return undefined;
    try {
      const s = annonce.sections;
      if (Array.isArray(s)) return s as Section[];
      if (typeof s === "string") return JSON.parse(s) as Section[];
      return undefined;
    } catch { return undefined; }
  })();

  function toggleBoldAccroche() {
    const el = accrocheRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = accroche.slice(start, end);
    if (!selected) return;

    const isBold = selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4;
    const inner = isBold ? selected.slice(2, -2) : selected;
    const replacement = isBold ? inner : `**${inner}**`;
    const next = accroche.slice(0, start) + replacement + accroche.slice(end);
    setAccroche(next);

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    });
  }

  function copy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Lien public — toujours visible */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Lien public</p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-brand hover:text-brand-dark font-medium"
          >
            {open ? "▲ Masquer l'éditeur" : "▼ Modifier l'annonce"}
          </button>
        </div>
        {annonce ? (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                annonce.actif ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {annonce.actif ? "Publiée" : "Non publiée"}
            </span>
            <code className="flex-1 truncate rounded bg-white border border-zinc-200 px-2 py-1 text-xs text-zinc-700">
              {publicUrl}
            </code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Aperçu ↗
            </a>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            L&apos;annonce sera disponible à cette adresse une fois créée.
          </p>
        )}
      </div>

      {/* Éditeur — collapsible */}
      {open && (
        <form action={formAction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              name="titre"
              required
              defaultValue={annonce?.titre ?? ""}
              placeholder="Devenez franchisé Mediaclinic à …"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">
              Accroche
              <span className="ml-1 text-xs text-zinc-400">(sous-titre)</span>
            </label>
            <div className="rounded-md border border-zinc-300 overflow-hidden focus-within:ring-1 focus-within:ring-brand focus-within:border-brand">
              <div className="flex items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-2 py-1">
                <button
                  type="button"
                  onClick={toggleBoldAccroche}
                  title="Mettre le texte sélectionné en gras"
                  className="rounded px-2 py-1 text-sm font-bold text-zinc-600 hover:bg-zinc-200"
                >
                  G
                </button>
              </div>
              <textarea
                ref={accrocheRef}
                name="accroche"
                value={accroche}
                onChange={(e) => setAccroche(e.target.value)}
                placeholder="Rejoignez le réseau Mediaclinic dans votre ville"
                rows={3}
                className="w-full resize-y px-3 py-2 text-sm outline-none"
              />
              {accroche.trim() && (
                <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                  <span className="text-xs text-zinc-400 mr-2">Aperçu :</span>
                  <BoldText text={accroche} />
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Sélectionnez du texte puis cliquez sur « G » pour le mettre en gras.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="hero_bleu_checkbox"
              type="checkbox"
              checked={heroBleu}
              onChange={(e) => setHeroBleu(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            <input type="hidden" name="hero_bleu" value={heroBleu ? "true" : "false"} />
            <label htmlFor="hero_bleu_checkbox" className="text-sm font-medium text-zinc-700">
              Carte titre en fond bleu
            </label>
            <span className="text-xs text-zinc-400">(décoché = fond clair)</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Sections</label>
            <p className="text-xs text-zinc-400">Chaque section devient une carte sur la page publique. Utilisez ↑↓ pour réordonner.</p>
            <SectionsEditor defaultSections={defaultSections} />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-700">Publier l&apos;annonce</label>
            <input type="hidden" name="actif" value={actif ? "true" : "false"} />
            <button
              type="button"
              role="switch"
              aria-checked={actif}
              onClick={() => setActif((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                actif ? "bg-brand" : "bg-zinc-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  actif ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-zinc-500">
              {actif ? "Visible publiquement" : "Brouillon"}
            </span>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600" role="alert">{state.error}</p>
          )}
          {state?.ok && (
            <p className="text-sm text-green-600">Annonce enregistrée.</p>
          )}

          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Enregistrement…" : annonce ? "Mettre à jour" : "Créer l'annonce"}
          </button>
        </form>
      )}
    </div>
  );
}
