"use client";

import { useActionState } from "react";
import { createUser } from "./actions";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, undefined);

  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-zinc-900">Inviter un utilisateur</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="prenom" className="text-sm font-medium text-zinc-700">
            Prénom
          </label>
          <input
            id="prenom"
            name="prenom"
            type="text"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="nom" className="text-sm font-medium text-zinc-700">
            Nom
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="telephone" className="text-sm font-medium text-zinc-700">
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="role" className="text-sm font-medium text-zinc-700">
          Rôle
        </label>
        <select
          id="role"
          name="role"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="franchise">Franchisé</option>
          <option value="consultant">Consultant (direction)</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600" role="status">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer l'invitation"}
      </button>
    </form>
  );
}
