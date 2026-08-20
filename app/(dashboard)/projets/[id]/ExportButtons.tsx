"use client";

import { utils, writeFile } from "xlsx";
import type { EtapeProjet, MCUser } from "@/lib/types";
import { PHASE_LABELS, STATUT_ETAPE_LABELS } from "@/lib/types";


export function ExportButtons({
  etapes,
  projetNom,
  mcUsers = [],
}: {
  etapes: EtapeProjet[];
  projetNom: string;
  mcUsers?: MCUser[];
}) {
  function mcNames(ids: string[] | null) {
    if (!ids?.length) return "";
    return ids
      .map((id) => {
        const u = mcUsers.find((m) => m.id === id);
        return u ? `${u.prenom} ${u.nom}` : id;
      })
      .join(", ");
  }

  const PHASES_ORDER = [
    "administratif_financement",
    "communication",
    "ressources_humaines",
    "travaux_amenagement",
    "formation",
    "stock_fournisseurs",
    "ouverture",
  ];

  function exportExcel() {
    const sorted = [...etapes].sort((a, b) => {
      const pi = PHASES_ORDER.indexOf(a.phase) - PHASES_ORDER.indexOf(b.phase);
      return pi !== 0 ? pi : a.ordre - b.ordre;
    });

    const rows = sorted.map((e) => ({
      Phase: PHASE_LABELS[e.phase] ?? e.phase,
      "Nom de l'étape": e.nom,
      "Responsable MC": mcNames(e.resp_mc),
      "Responsable franchisé": e.resp_franchise ?? "",
      "Responsable externe": e.resp_externe ?? "",
      Statut: STATUT_ETAPE_LABELS[e.statut] ?? e.statut,
      "Date cible": e.date_cible ?? "",
      "Date réalisation": e.date_realisation ?? "",
      Document: e.lien_document ?? "",
      Commentaire: e.commentaire ?? "",
    }));

    const ws = utils.json_to_sheet(rows);

    ws["!cols"] = [
      { wch: 28 }, // Phase
      { wch: 42 }, // Nom
      { wch: 24 }, // Resp MC
      { wch: 24 }, // Resp franchisé
      { wch: 24 }, // Resp externe
      { wch: 12 }, // Statut
      { wch: 14 }, // Date cible
      { wch: 18 }, // Date réalisation
      { wch: 30 }, // Document
      { wch: 40 }, // Commentaire
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Retroplanning");
    writeFile(wb, `${projetNom} - Retroplanning.xlsx`);
  }

  function printPdf() {
    window.print();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={exportExcel}
        className="btn-secondary text-sm"
      >
        ↓ Excel
      </button>
      <button
        type="button"
        onClick={printPdf}
        className="btn-secondary text-sm"
      >
        ↓ PDF
      </button>
    </div>
  );
}
