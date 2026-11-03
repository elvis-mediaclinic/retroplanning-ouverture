import { svgUseCurrentColor } from "@/lib/utils";
import { ExpandableSplitGroup } from "./ExpandableSplitGroup";
import { TabsSection } from "./TabsSection";

// ── BlockNote JSON renderer ──────────────────────────────────────────────────

type TextStyle = {
  bold?: true;
  italic?: true;
  underline?: true;
  strikethrough?: true;
  textColor?: string;
};

type InlineItem =
  | { type: "text"; text: string; styles: TextStyle }
  | { type: "link"; href: string; content: { type: "text"; text: string; styles: TextStyle }[] };

type Block = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content: InlineItem[];
  children: Block[];
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(items: InlineItem[]): string {
  return (items ?? []).map((item) => {
    if (item.type === "link") {
      return `<a href="${item.href}" class="text-brand underline">${renderInline(item.content as InlineItem[])}</a>`;
    }
    let t = esc(item.text);
    const s = item.styles ?? {};
    if (s.bold) t = `<strong>${t}</strong>`;
    if (s.italic) t = `<em>${t}</em>`;
    if (s.underline) t = `<u>${t}</u>`;
    if (s.strikethrough) t = `<s>${t}</s>`;
    if (s.textColor && s.textColor !== "default")
      t = `<span data-text-color="${s.textColor}">${t}</span>`;
    return t;
  }).join("");
}

function renderBlock(block: Block): string {
  const inner = renderInline(block.content ?? []);
  const color = block.props?.textColor as string | undefined;
  const ca = color && color !== "default" ? ` data-text-color="${color}"` : "";
  const align = block.props?.textAlignment as string | undefined;
  const alignStyle = align && align !== "left" ? ` style="text-align:${align}"` : "";

  switch (block.type) {
    case "paragraph":
      return inner ? `<p${ca}${alignStyle}>${inner}</p>` : "<br/>";
    case "heading": {
      const lvl = (block.props?.level as number) ?? 2;
      const tag = lvl === 1 ? "h1" : lvl === 2 ? "h2" : "h3";
      return `<${tag}${ca}${alignStyle}>${inner}</${tag}>`;
    }
    case "bulletListItem":
      return `<li${ca}${alignStyle}>${inner}</li>`;
    case "numberedListItem":
      return `<li${ca}${alignStyle}>${inner}</li>`;
    case "image": {
      const url = block.props?.url as string | undefined;
      const caption = block.props?.caption as string | undefined;
      const previewWidth = block.props?.previewWidth as number | undefined;
      if (!url) return "";
      const widthStyle = previewWidth ? `width:${previewWidth}px;max-width:100%` : "max-width:100%";
      const img = `<img src="${url}" alt="${caption ? esc(caption) : ""}" style="${widthStyle};border-radius:0.75rem;display:inline-block" />`;
      const wrapAlign = align ?? "left";
      return `<div style="text-align:${wrapAlign};margin:1rem 0">${img}${caption ? `<figcaption style="font-size:0.875rem;color:#71717a;margin-top:0.25rem">${esc(caption)}</figcaption>` : ""}</div>`;
    }
    case "quote":
      return `<blockquote>${inner}</blockquote>`;
    default:
      return inner ? `<p>${inner}</p>` : "";
  }
}

function renderBlocks(blocks: Block[]): string {
  const parts: string[] = [];
  let bullets: string[] = [];
  let numbered: string[] = [];

  const flushB = () => {
    if (bullets.length) {
      parts.push(`<ul>${bullets.join("")}</ul>`);
      bullets = [];
    }
  };
  const flushN = () => {
    if (numbered.length) {
      parts.push(`<ol>${numbered.join("")}</ol>`);
      numbered = [];
    }
  };

  for (const b of blocks) {
    if (b.type === "bulletListItem") { flushN(); bullets.push(renderBlock(b)); }
    else if (b.type === "numberedListItem") { flushB(); numbered.push(renderBlock(b)); }
    else { flushB(); flushN(); parts.push(renderBlock(b)); }
  }
  flushB(); flushN();
  return parts.join("\n");
}

// ── Section grouping (fallback ancien format) ────────────────────────────────

export type LegacySection =
  | { kind: "columns"; cols: Block[][] }
  | { kind: "image"; block: Block }
  | { kind: "section"; heading: Block | null; blocks: Block[] };

export function groupSections(blocks: Block[]): LegacySection[] {
  const sections: LegacySection[] = [];
  let cur: { heading: Block | null; blocks: Block[] } | null = null;

  const flush = () => {
    if (cur) { sections.push({ kind: "section", ...cur }); cur = null; }
  };

  for (const b of blocks) {
    if (b.type === "columnList") {
      flush();
      sections.push({ kind: "columns", cols: b.children.map((col) => col.children ?? []) });
    } else if (b.type === "image") {
      flush();
      sections.push({ kind: "image", block: b });
    } else if (b.type === "heading") {
      flush();
      cur = { heading: b, blocks: [] };
    } else {
      if (!cur) cur = { heading: null, blocks: [] };
      cur.blocks.push(b);
    }
  }
  flush();
  return sections;
}

export { renderBlock, renderBlocks };
export type { Block };

// ── Card styles ───────────────────────────────────────────────────────────────

const STATS_GRID: Record<number, string> = {
  2: "grid grid-cols-1 sm:grid-cols-2",
  3: "grid grid-cols-1 sm:grid-cols-3",
  4: "grid grid-cols-1 sm:grid-cols-4",
};

export const cardCls =
  "rounded-[25px] bg-white border border-[#E3E8EF] shadow-[2px_2px_5px_rgba(0,0,0,0.05)] px-5 py-5 sm:px-8 sm:py-8";

export const contentCls =
  "text-[#5C5C6F] text-base leading-relaxed " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#1D1D1D] [&_h3]:mb-2 " +
  "[&_p]:mb-3 " +
  "[&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2 [&_ul]:mb-3 " +
  "[&_ul>li]:relative [&_ul>li]:pl-6 " +
  "[&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.55em] " +
  "[&_ul>li]:before:w-2.5 [&_ul>li]:before:h-2.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-brand " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-brand/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#5C5C6F] [&_blockquote]:my-4 " +
  "[&_a]:text-brand [&_a]:underline " +
  "[&_strong]:font-semibold [&_strong]:text-[#1D1D1D]";

export const contentClsDark =
  "text-white/85 text-base leading-relaxed " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mb-2 " +
  "[&_p]:mb-3 " +
  "[&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2 [&_ul]:mb-3 " +
  "[&_ul>li]:relative [&_ul>li]:pl-6 " +
  "[&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.55em] " +
  "[&_ul>li]:before:w-2.5 [&_ul>li]:before:h-2.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-white " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-white/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/70 [&_blockquote]:my-4 " +
  "[&_a]:text-white [&_a]:underline " +
  "[&_strong]:font-semibold [&_strong]:text-white";

export const bleuCardCls = "rounded-[25px] bg-brand shadow-[2px_2px_5px_rgba(0,0,0,0.05)] px-5 py-5 sm:px-8 sm:py-8";

export const colCardCls = "rounded-[25px] bg-[#F6F6F6] shadow-[2px_2px_5px_rgba(0,0,0,0.05)] px-5 py-5 sm:px-8 sm:py-8";

// ── Types de sections stockées ───────────────────────────────────────────────

export type StatItem = { id: string; valeur: string; label: string };
export type MembreItem = { id: string; photo?: string; nom: string; texte?: string };
export type OngletBouton = { id: string; label: string; href: string };
export type OngletItem = { id: string; label: string; contenu_json: string; image?: string; boutons?: OngletBouton[] };

export type StoredSection =
  | { id: string; type?: "texte"; titre: string; contenu_json: string; disposition?: "pleine" | "moitie" | "tiers"; bleu?: boolean; icone?: string; dansAnnonces?: boolean; titreCentre?: boolean; carte?: boolean; separateurDroite?: boolean }
  | { id: string; type: "stats"; titre: string; stats: StatItem[]; colonnes: 2 | 3 | 4; alignement?: "gauche" | "centre"; bleu?: boolean; icone?: string; dansAnnonces?: boolean; separateurs?: boolean }
  | { id: string; type: "titre"; titre: string; icone?: string; dansAnnonces?: boolean }
  | { id: string; type: "separateur"; espacement?: "petit" | "moyen" | "grand"; dansAnnonces?: boolean }
  | { id: string; type: "equipe"; titre: string; membres: MembreItem[]; colonnes?: 2 | 3 | 4; bleu?: boolean; icone?: string; dansAnnonces?: boolean; titreCentre?: boolean; carte?: boolean }
  | { id: string; type: "onglets"; titre: string; onglets: OngletItem[]; dansAnnonces?: boolean };

function SectionIcon({ svg, className }: { svg?: string; className?: string }) {
  if (!svg) return null;
  return (
    <span
      className={`inline-flex shrink-0 [&_svg]:w-full [&_svg]:h-full ${className ?? "w-6 h-6"}`}
      dangerouslySetInnerHTML={{ __html: svgUseCurrentColor(svg) }}
    />
  );
}

function renderTextSection(s: Extract<StoredSection, { type?: "texte" }>) {
  let blocks: Block[] = [];
  try { blocks = JSON.parse(s.contenu_json); } catch { /* ignore */ }
  const parsed = groupSections(blocks);
  const bodyHtml = parsed.map((sec) => {
    if (sec.kind === "columns") {
      return `<div style="display:flex;gap:2rem;align-items:flex-start">${
        sec.cols.map((col) => `<div style="flex:1;min-width:0">${renderBlocks(col)}</div>`).join("")
      }</div>`;
    }
    if (sec.kind === "image") {
      const url = sec.block.props?.url as string | undefined;
      const caption = sec.block.props?.caption as string | undefined;
      const previewWidth = sec.block.props?.previewWidth as number | undefined;
      const align = (sec.block.props?.textAlignment as string | undefined) ?? "center";
      if (!url) return "";
      const widthStyle = previewWidth ? `width:${previewWidth}px;max-width:100%` : "max-width:100%";
      return `<div style="text-align:${align};margin:1rem 0"><img src="${url}" alt="${caption ?? ""}" style="${widthStyle};border-radius:0.75rem;display:inline-block" />${caption ? `<figcaption style="font-size:0.875rem;color:#71717a;margin-top:0.25rem">${esc(caption)}</figcaption>` : ""}</div>`;
    }
    return [sec.heading ? renderBlock(sec.heading) : "", renderBlocks(sec.blocks)].join("\n");
  }).join("\n");
  return { titre: s.titre, bodyHtml };
}

// Rend un tableau de StoredSection en JSX (annonces, concept, page franchise…)
// `defaultStatsTitle` : titre bicolore affiché au-dessus d'une section "stats" qui
// n'a pas de titre propre, ex. { black: "La ville de Vierzon", blue: "en quelques chiffres" }.
export function renderStoredSections(
  list: StoredSection[],
  keyPrefix: string,
  defaultStatsTitle?: { black: string; blue: string }
) {
  const rows: Array<{ kind: "full"; s: StoredSection } | { kind: "group"; cols: 2 | 3; pair: StoredSection[] }> = [];
  let i = 0;
  while (i < list.length) {
    const s = list[i];
    const disp = (s.type !== "stats" && s.type !== "titre" && s.type !== "separateur" && s.type !== "equipe" && s.type !== "onglets") ? s.disposition : undefined;
    if (disp === "moitie" || disp === "tiers") {
      const targetDisp = disp;
      const maxCols = disp === "moitie" ? 2 : 3;
      const group: StoredSection[] = [s];
      while (group.length < maxCols) {
        const next = list[i + 1];
        if (next && next.type !== "stats" && next.type !== "titre" && next.type !== "separateur" && next.type !== "equipe" && next.type !== "onglets" && next.disposition === targetDisp) {
          group.push(next); i++;
        } else break;
      }
      rows.push({ kind: "group", cols: maxCols as 2 | 3, pair: group });
    } else {
      rows.push({ kind: "full", s });
    }
    i++;
  }

  const GROUP_GRID: Record<number, string> = {
    2: "grid grid-cols-1 sm:grid-cols-2 gap-4",
    3: "grid grid-cols-1 sm:grid-cols-3 gap-4",
  };

  return rows.map((row, ri) => {
    if (row.kind === "full" && row.s.type === "separateur") {
      const ESPACEMENT: Record<string, string> = { petit: "my-1", moyen: "my-4", grand: "my-8" };
      return <hr key={`${keyPrefix}-${ri}`} className={`border-t border-zinc-200 ${ESPACEMENT[row.s.espacement ?? "moyen"]}`} />;
    }

    if (row.kind === "full" && row.s.type === "titre") {
      return (
        <div key={`${keyPrefix}-${ri}`} className="text-center py-2">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-brand">
            <SectionIcon svg={row.s.icone} />
            {row.s.titre}
          </h2>
        </div>
      );
    }

    if (row.kind === "full" && row.s.type === "stats") {
      const s = row.s as Extract<StoredSection, { type: "stats" }>;
      const cols = s.colonnes ?? 3;
      // Rendu toujours sobre et centré façon maquette : chiffre en grand (noir), label en dessous,
      // colonnes séparées par un simple trait vertical — le fond bleu n'est plus utilisé ici.
      return (
        <div key={`${keyPrefix}-${ri}`} className="py-2">
          {s.titre ? (
            <h2 className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold mb-8 text-[#1D1D1D] text-center">
              <SectionIcon svg={s.icone} />
              {s.titre}
            </h2>
          ) : defaultStatsTitle ? (
            <h2 className="flex flex-col items-center gap-1 text-2xl sm:text-4xl font-bold mb-8 text-center leading-tight">
              <span className="text-[#1D1D1D]">{defaultStatsTitle.black}</span>
              <span className="text-brand">{defaultStatsTitle.blue}</span>
            </h2>
          ) : null}
          <div className={`${STATS_GRID[cols] ?? STATS_GRID[3]} gap-y-6`}>
            {s.stats.map((stat, idx) => (
              <div
                key={stat.id}
                className={`flex flex-col items-center text-center gap-2 px-6 ${
                  idx % cols !== 0 ? "sm:border-l sm:border-[#A4A4A4]/50" : ""
                } ${idx > 0 ? "border-t pt-6 sm:border-t-0 sm:pt-0 border-zinc-200" : ""}`}
              >
                <span className="text-4xl sm:text-5xl font-extrabold leading-none text-[#1D1D1D]">{stat.valeur}</span>
                <span className="text-base sm:text-lg leading-snug text-[#5C5C6F]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (row.kind === "full" && row.s.type === "equipe") {
      const s = row.s as Extract<StoredSection, { type: "equipe" }>;
      const cols = s.colonnes ?? 3;
      const bleu = s.bleu ?? false;
      const titreCentre = s.titreCentre ?? false;
      const carte = s.carte ?? false;
      // Bases calculées pour tenir compte du gap-x-4 (1rem) dans un flex-wrap :
      // avec des fractions simples (1/n), la somme basis + gaps dépasse 100% et fait sauter une colonne.
      // Classes littérales (nécessaire pour que le scanner Tailwind les génère).
      const ITEM_BASIS: Record<number, string> = {
        2: "basis-[calc((100%_-_1rem)/2)] sm:basis-[calc((100%_-_1rem)/2)]",
        3: "basis-[calc((100%_-_1rem)/2)] sm:basis-[calc((100%_-_2rem)/3)]",
        4: "basis-[calc((100%_-_1rem)/2)] sm:basis-[calc((100%_-_3rem)/4)]",
      };
      const itemBasisCls = ITEM_BASIS[cols] ?? ITEM_BASIS[3];
      // Le fond bleu ne s'applique qu'aux cartes individuelles (si "carte" est coché),
      // jamais à toute la section.
      const carteBleu = carte && bleu;
      return (
        <div key={`${keyPrefix}-${ri}`} className="py-2">
          {s.titre && (
            <h2 className={`flex items-center gap-2 text-2xl font-bold mb-6 text-brand ${titreCentre ? "justify-center text-center" : ""}`}>
              <SectionIcon svg={s.icone} />
              {s.titre}
            </h2>
          )}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-8">
            {s.membres.map((membre) => (
              <div key={membre.id} className={`${itemBasisCls} shrink-0 grow-0 min-w-0 px-2`}>
                <div className={`flex flex-col items-center text-center gap-3 h-full ${
                  carte
                    ? carteBleu
                      ? bleuCardCls
                      : "rounded-2xl bg-white border border-zinc-200 shadow-sm px-4 py-6"
                    : ""
                }`}>
                  <div className={`h-28 w-28 rounded-full overflow-hidden shrink-0 ${carteBleu ? "ring-2 ring-white/30" : "ring-2 ring-zinc-200"}`}>
                    {membre.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={membre.photo} alt={membre.nom} className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full flex items-center justify-center text-2xl font-bold ${carteBleu ? "bg-white/10 text-white/50" : "bg-zinc-100 text-zinc-400"}`}>
                        {membre.nom.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${carteBleu ? "text-white" : "text-zinc-900"}`}>{membre.nom}</p>
                    {membre.texte && (
                      <p className={`text-sm mt-1 ${carteBleu ? "text-white/80" : "text-zinc-500"}`}>{membre.texte}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (row.kind === "full" && row.s.type === "onglets") {
      const s = row.s as Extract<StoredSection, { type: "onglets" }>;
      const tabs = s.onglets.map((o) => {
        let blocks: Block[] = [];
        try { blocks = JSON.parse(o.contenu_json); } catch { /* ignore */ }
        const bodyHtml = renderBlocks(blocks);
        return { id: o.id, label: o.label || "Onglet", bodyHtml, image: o.image, boutons: o.boutons };
      });
      return (
        <div key={`${keyPrefix}-${ri}`} className="space-y-6">
          {s.titre && (
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1D1D1D]">{s.titre}</h2>
          )}
          <TabsSection tabs={tabs} contentCls={contentCls} />
        </div>
      );
    }

    if (row.kind === "group" && (row.cols === 2 || row.cols === 3)) {
      // Groupe de 2 ou 3 sections (ex. "Le marché" / "Le local" [/ un 3e critère]) :
      // rendu interactif, la carte active prend la plus grande part de la largeur,
      // les autres se replient et s'échangent au clic.
      const panels = row.pair.map((s) => {
        const { titre, bodyHtml } = renderTextSection(s as Extract<StoredSection, { type?: "texte" }>);
        return { id: s.id, titre: titre || "", bodyHtml, icone: (s as { icone?: string }).icone };
      });
      return <ExpandableSplitGroup key={`${keyPrefix}-${ri}`} panels={panels} contentCls={contentCls} />;
    }

    if (row.kind === "group") {
      return (
        <div key={`${keyPrefix}-${ri}`} className={GROUP_GRID[row.cols]}>
          {row.pair.map((s, idx) => {
            const bleu = (s as { bleu?: boolean }).bleu ?? false;
            const titreCentre = (s as { titreCentre?: boolean }).titreCentre ?? false;
            const carte = (s as { carte?: boolean }).carte ?? true;
            const separateurDroite = (s as { separateurDroite?: boolean }).separateurDroite ?? false;
            const prevSeparateurDroite = idx > 0 && ((row.pair[idx - 1] as { separateurDroite?: boolean }).separateurDroite ?? false);
            const { titre, bodyHtml } = renderTextSection(s as Extract<StoredSection, { type?: "texte" }>);
            const cls = !carte
              ? `py-4 ${separateurDroite ? "pr-4 sm:pr-6 border-r border-zinc-200" : ""} ${prevSeparateurDroite ? "pl-4 sm:pl-6" : ""}`
              : `${bleu ? bleuCardCls : colCardCls} ${separateurDroite ? "border-r-2 border-r-zinc-200" : ""}`;
            return (
              <div key={s.id} className={cls}>
                {titre && (
                  <h2 className={`flex items-center gap-2 text-2xl font-bold mb-4 ${bleu && carte ? "text-white" : "text-brand"} ${titreCentre ? "justify-center text-center" : ""}`}>
                    <SectionIcon svg={(s as { icone?: string }).icone} />
                    {titre}
                  </h2>
                )}
                {bodyHtml.trim() && <div className={bleu && carte ? contentClsDark : contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
              </div>
            );
          })}
        </div>
      );
    }
    {
      const bleu = (row.s as { bleu?: boolean }).bleu ?? false;
      const titreCentre = (row.s as { titreCentre?: boolean }).titreCentre ?? false;
      const carte = (row.s as { carte?: boolean }).carte ?? true;
      const { titre, bodyHtml } = renderTextSection(row.s as Extract<StoredSection, { type?: "texte" }>);
      return (
        <div key={`${keyPrefix}-${ri}`} className={!carte ? "" : bleu ? bleuCardCls : cardCls}>
          {titre && (
            <h2 className={`flex items-center gap-2 text-2xl font-bold mb-4 ${bleu && carte ? "text-white" : "text-brand"} ${titreCentre ? "justify-center text-center" : ""}`}>
              <SectionIcon svg={(row.s as { icone?: string }).icone} />
              {titre}
            </h2>
          )}
          {bodyHtml.trim() && <div className={bleu && carte ? contentClsDark : contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
        </div>
      );
    }
  });
}

export function parseStoredSections(raw: unknown): StoredSection[] | null {
  if (!raw) return null;
  try {
    return Array.isArray(raw) ? (raw as StoredSection[]) : (JSON.parse(raw as string) as StoredSection[]);
  } catch {
    return null;
  }
}
