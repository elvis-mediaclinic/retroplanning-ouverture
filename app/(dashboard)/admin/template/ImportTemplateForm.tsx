"use client";

import { useActionState, useRef } from "react";
import { importTemplate } from "./actions";

export function ImportTemplateForm() {
  const [state, action, pending] = useActionState(importTemplate, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-3"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Importer depuis Excel</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Exporte un retroplanning existant en Excel, modifie-le, puis importe-le ici pour remplacer le template.
          Colonnes lues : <span className="font-mono">Phase</span>, <span className="font-mono">Nom de l&apos;étape</span>, <span className="font-mono">Ordre</span>. Les autres colonnes sont ignorées.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          required
          className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
        />
        <button type="submit" disabled={pending} className="btn-primary shrink-0">
          {pending ? "Import…" : "Remplacer le template"}
        </button>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-green-700">
          ✓ Template mis à jour — {state.count} étapes importées.
        </p>
      )}
    </form>
  );
}
