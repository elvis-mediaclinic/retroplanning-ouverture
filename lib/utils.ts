import type { StatutEtape, StatutProjet, StatutVille, StatutCandidat, ResponsableEtape } from "@/lib/types";

export function calcDateCible(dateOuverture: string, delaiSemaines: number): string {
  const d = new Date(dateOuverture + "T00:00:00");
  d.setDate(d.getDate() + delaiSemaines * 7);
  return d.toISOString().split("T")[0];
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const STATUT_ETAPE_COLORS: Record<StatutEtape, string> = {
  a_faire: "bg-zinc-100 text-zinc-600",
  en_cours: "bg-blue-100 text-blue-700",
  fait: "bg-green-100 text-green-700",
  en_retard: "bg-red-100 text-red-700",
  na: "bg-purple-50 text-purple-600",
};

export const STATUT_PROJET_COLORS: Record<StatutProjet, string> = {
  prospection: "bg-amber-100 text-amber-700",
  en_cours: "bg-blue-100 text-blue-700",
  ouvert: "bg-green-100 text-green-700",
  suspendu: "bg-orange-100 text-orange-700",
  abandonne: "bg-red-100 text-red-700",
};

export const STATUT_VILLE_COLORS: Record<StatutVille, string> = {
  en_etude: "bg-amber-100 text-amber-700",
  validee: "bg-green-100 text-green-700",
  abandonnee: "bg-red-100 text-red-700",
};

export const STATUT_CANDIDAT_COLORS: Record<StatutCandidat, string> = {
  prospect: "bg-zinc-100 text-zinc-600",
  en_evaluation: "bg-amber-100 text-amber-700",
  valide: "bg-blue-100 text-blue-700",
  signe: "bg-green-100 text-green-700",
  refuse: "bg-red-100 text-red-700",
};

export const RESP_COLORS: Record<ResponsableEtape, string> = {
  franchise: "bg-orange-100 text-orange-700",
  mc: "bg-indigo-100 text-indigo-700",
  externe: "bg-zinc-100 text-zinc-600",
  les_deux: "bg-purple-100 text-purple-700",
};

export const RESP_LABELS: Record<ResponsableEtape, string> = {
  franchise: "Franchisé",
  mc: "Équipe MC",
  externe: "Externe",
  les_deux: "Les deux",
};

// Force un SVG collé (fill/stroke codés en dur) à hériter de la couleur de son
// conteneur via currentColor, pour qu'une icône reste lisible sur fond clair ou bleu.
export function svgUseCurrentColor(svg: string): string {
  return svg
    .replace(/fill\s*=\s*"(?!none)[^"]*"/gi, 'fill="currentColor"')
    .replace(/fill\s*=\s*'(?!none)[^']*'/gi, "fill='currentColor'")
    .replace(/stroke\s*=\s*"(?!none)[^"]*"/gi, 'stroke="currentColor"')
    .replace(/stroke\s*=\s*'(?!none)[^']*'/gi, "stroke='currentColor'")
    .replace(/style\s*=\s*"([^"]*)"/gi, (_m, styleContent: string) => {
      const cleaned = styleContent
        .replace(/fill\s*:\s*(?!none)[^;]+;?/gi, "fill:currentColor;")
        .replace(/stroke\s*:\s*(?!none)[^;]+;?/gi, "stroke:currentColor;");
      return `style="${cleaned}"`;
    });
}
