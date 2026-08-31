"use client";

import { useState } from "react";
import { CopyEmail } from "../CopyEmail";
import { STATUT_CANDIDAT_LABELS, type Candidat, type CandidatAssocie } from "@/lib/types";
import { STATUT_CANDIDAT_COLORS } from "@/lib/utils";

type Ville = { id: string; nom: string };
type MagasinCession = { id: string; nom: string; ville: string | null };

const sectionTitleCls = "text-xs font-semibold uppercase tracking-wide text-brand mb-3";

export function CandidatDetailView({
  candidat,
  associes,
  villes,
  selectedVilleIds,
  magasinsCession,
  selectedMagasinIds,
}: {
  candidat: Candidat;
  associes: CandidatAssocie[];
  villes: Ville[];
  selectedVilleIds: string[];
  magasinsCession: MagasinCession[];
  selectedMagasinIds: string[];
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  const villesNoms = villes.filter((v) => selectedVilleIds.includes(v.id)).map((v) => v.nom);
  const magasinsNoms = magasinsCession
    .filter((m) => selectedMagasinIds.includes(m.id))
    .map((m) => `${m.nom}${m.ville ? ` (${m.ville})` : ""}`);

  // Toutes les personnes portant la candidature, au même niveau — aucune
  // n'est prioritaire sur les autres (cf. formulaire).
  const personnes = [
    { id: candidat.id, prenom: candidat.prenom, nom: candidat.nom, email: candidat.email as string | null, telephone: candidat.telephone },
    ...associes,
  ];

  return (
    <div className="space-y-6">
      {/* Contact */}
      <section>
        <p className={sectionTitleCls}>Contact</p>
        <div className="space-y-3">
          {personnes.map((p, i) => (
            <dl key={p.id} className={`grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm ${i > 0 ? "border-t border-dashed border-zinc-200 pt-3" : ""}`}>
              <div className="col-span-full sm:col-span-1">
                <dt className="text-xs text-zinc-400 mb-0.5">Nom</dt>
                <dd className="font-medium text-zinc-900">{p.prenom} {p.nom}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400 mb-0.5">Email</dt>
                <dd className="font-medium text-zinc-900">{p.email ? <CopyEmail email={p.email} /> : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400 mb-0.5">Téléphone</dt>
                <dd className="font-medium text-zinc-900">{p.telephone ?? "—"}</dd>
              </div>
            </dl>
          ))}
        </div>
      </section>

      {/* Candidature */}
      <section className="border-t border-zinc-200 pt-6">
        <p className={sectionTitleCls}>Candidature</p>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-xs text-zinc-400 mb-0.5">Statut</dt>
            <dd>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUT_CANDIDAT_COLORS[candidat.statut as keyof typeof STATUT_CANDIDAT_COLORS]
              }`}>
                {STATUT_CANDIDAT_LABELS[candidat.statut as keyof typeof STATUT_CANDIDAT_LABELS]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-400 mb-0.5">Apport personnel</dt>
            <dd className="font-medium text-zinc-900">
              {candidat.apport_personnel ? `${candidat.apport_personnel.toLocaleString("fr-FR")} €` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-400 mb-0.5">Zone souhaitée</dt>
            <dd className="font-medium text-zinc-900">{candidat.zone_souhaitee ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Opportunités */}
      <section className="border-t border-zinc-200 pt-6">
        <p className={sectionTitleCls}>Opportunités souhaitées</p>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs text-zinc-400 mb-0.5">Villes</dt>
            <dd className="text-zinc-700">{villesNoms.length > 0 ? villesNoms.join(", ") : "—"}</dd>
          </div>
          {magasinsCession.length > 0 && (
            <div>
              <dt className="text-xs text-zinc-400 mb-0.5">Cessions</dt>
              <dd className="text-zinc-700">{magasinsNoms.length > 0 ? magasinsNoms.join(", ") : "—"}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Notes */}
      {candidat.notes && (
        <section className="border-t border-zinc-200 pt-6">
          <div className="flex items-center gap-2">
            <p className={`${sectionTitleCls} mb-0`}>Notes</p>
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark"
            >
              {notesOpen ? "Masquer" : "Afficher"}
              <span className={`inline-block transition-transform ${notesOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
          </div>
          {notesOpen && (
            <p className="mt-3 pt-3 border-t border-zinc-100 text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
              {candidat.notes}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
