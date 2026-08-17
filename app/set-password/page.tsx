"use client";

import { useActionState } from "react";
import { setPassword } from "./actions";

export default function SetPasswordPage() {
  const [state, action, pending] = useActionState(setPassword, undefined);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        action={action}
        className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-zinc-900">
          Définir votre mot de passe
        </h1>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-700"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Valider"}
        </button>
      </form>
    </div>
  );
}
