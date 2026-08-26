"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { BoldText } from "@/components/BoldText";
import { VilleAutocomplete } from "@/components/VilleAutocomplete";
import { submitInteretSpontane, type InteretSpontaneState } from "./actions";

function CopyLienButton({ annonceId, consultantId }: { annonceId: string; consultantId: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/annonce/${annonceId}?c=${consultantId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-4 inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/25 transition-colors"
    >
      {copied ? "Lien copié !" : "Copier mon lien"}
    </button>
  );
}

type Annonce = {
  id: string;
  titre: string;
  accroche: string | null;
  isCession: boolean;
  ville: { nom: string; departement: string | null; region: string | null } | null;
  magasin: { nom: string; ville: string | null; code_postal: string | null } | null;
};

function InteretSpontaneModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<InteretSpontaneState, FormData>(submitInteretSpontane, undefined);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#0089bd] hover:bg-white/90 transition-colors shrink-0"
      >
        Ma ville n&apos;est pas dans la liste →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">
                {state?.success ? "Merci !" : "Signaler mon intérêt"}
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5">
              {state?.success ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Votre demande a bien été enregistrée. L&apos;équipe Mediaclinic reviendra vers vous rapidement.
                  </p>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <form action={formAction} className="space-y-4">
                  <p className="text-sm text-zinc-500">
                    Votre ville n&apos;a pas encore d&apos;opportunité publiée ? Laissez-nous vos coordonnées,
                    nous étudierons votre demande.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Prénom</label>
                      <input name="prenom" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Nom</label>
                      <input name="nom" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Email</label>
                      <input name="email" type="email" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Téléphone</label>
                      <input name="telephone" type="tel" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <VilleAutocomplete
                      villeName="ville"
                      villeLabel="Ville souhaitée *"
                      departementName="departement"
                      regionName="region"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Message (optionnel)</label>
                    <textarea name="message" rows={3} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm resize-none" />
                  </div>

                  {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Annuler</button>
                    <button type="submit" disabled={pending} className="btn-primary">
                      {pending ? "Envoi…" : "Envoyer"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OpportunitesExplorer({ annonces, consultantId }: { annonces: Annonce[]; consultantId?: string | null }) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = annonces.filter((a) => {
      if (!q) return true;
      const hay = [a.titre, a.accroche, a.ville?.nom, a.ville?.departement, a.ville?.region, a.magasin?.nom, a.magasin?.ville]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
    return [...list].sort((a, b) => {
      const da = a.ville?.departement ?? "";
      const db = b.ville?.departement ?? "";
      return da.localeCompare(db, "fr", { numeric: true });
    });
  }, [annonces, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Leurres pour Safari qui détecte les champs texte comme des logins */}
        <input type="text" name="fake_user" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
        <input type="password" name="fake_pass" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
        <input
          type="text"
          placeholder="Rechercher une ville, un département…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          className="input flex-1"
        />
        <InteretSpontaneModal />
      </div>

      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-center py-8">Aucune opportunité ne correspond à votre recherche.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/annonce/${a.id}`)}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/annonce/${a.id}`); }}
              className="block rounded-2xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm hover:brightness-110 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                {a.ville ? (
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                    {a.ville.nom}{a.ville.departement ? ` · ${a.ville.departement}` : ""}
                  </p>
                ) : a.magasin ? (
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                    {[a.magasin.ville, a.magasin.code_postal].filter(Boolean).join(" · ")}
                  </p>
                ) : <span />}
                {a.isCession && (
                  <span className="shrink-0 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                    Cession
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white leading-snug mb-2">{a.titre}</h2>
              {a.accroche && (
                <p className="text-sm text-white/80 leading-relaxed line-clamp-3"><BoldText text={a.accroche} /></p>
              )}
              <span className="mt-4 inline-block text-sm font-medium text-white">
                En savoir plus →
              </span>
              {consultantId && <CopyLienButton annonceId={a.id} consultantId={consultantId} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
