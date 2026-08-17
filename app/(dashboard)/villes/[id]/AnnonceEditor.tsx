"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import { upsertAnnonce } from "./annonce-actions";
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
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const defaultSections: Section[] | undefined = (() => {
    if (!annonce?.sections) return undefined;
    try {
      const s = annonce.sections;
      if (Array.isArray(s)) return s as Section[];
      if (typeof s === "string") return JSON.parse(s) as Section[];
      return undefined;
    } catch { return undefined; }
  })();

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
            <input
              name="accroche"
              defaultValue={annonce?.accroche ?? ""}
              placeholder="Rejoignez le réseau Mediaclinic dans votre ville"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
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
