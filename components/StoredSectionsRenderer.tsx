import { svgUseCurrentColor } from "@/lib/utils";

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
      return `<a href="${item.href}" class="text-[#0089bd] underline">${renderInline(item.content as InlineItem[])}</a>`;
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
  2: "grid grid-cols-2",
  3: "grid grid-cols-2 sm:grid-cols-3",
  4: "grid grid-cols-2 sm:grid-cols-4",
};

export const cardCls =
  "rounded-2xl bg-white border border-zinc-200 shadow-sm px-4 py-4 sm:px-6 sm:py-6";

export const contentCls =
  "text-zinc-700 text-base leading-relaxed " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#0089bd] [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_h3]:mb-2 " +
  "[&_p]:mb-3 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-3 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-[#0089bd]/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-4 " +
  "[&_a]:text-[#0089bd] [&_a]:underline " +
  "[&_strong]:font-semibold";

export const contentClsDark =
  "text-white/85 text-base leading-relaxed " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mb-2 " +
  "[&_p]:mb-3 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-3 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-white/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/70 [&_blockquote]:my-4 " +
  "[&_a]:text-white [&_a]:underline " +
  "[&_strong]:font-semibold [&_strong]:text-white";

export const bleuCardCls = "rounded-2xl bg-gradient-to-br from-[#00729e] to-[#0089bd] shadow-sm px-4 py-4 sm:px-6 sm:py-6";

export const colCardCls = "rounded-2xl bg-white border border-zinc-200 border-l-2 border-l-[#0ea5e9] shadow-sm px-4 py-4 sm:px-6 sm:py-6";

// ── Types de sections stockées ───────────────────────────────────────────────

export type StatItem = { id: string; valeur: string; label: string };

export type StoredSection =
  | { id: string; type?: "texte"; titre: string; contenu_json: string; disposition?: "pleine" | "moitie" | "tiers"; bleu?: boolean; icone?: string; dansAnnonces?: boolean; titreCentre?: boolean; carte?: boolean; separateurDroite?: boolean }
  | { id: string; type: "stats"; titre: string; stats: StatItem[]; colonnes: 2 | 3 | 4; alignement?: "gauche" | "centre"; bleu?: boolean; icone?: string; dansAnnonces?: boolean; separateurs?: boolean }
  | { id: string; type: "titre"; titre: string; icone?: string; dansAnnonces?: boolean }
  | { id: string; type: "separateur"; espacement?: "petit" | "moyen" | "grand" };

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
export function renderStoredSections(list: StoredSection[], keyPrefix: string) {
  const rows: Array<{ kind: "full"; s: StoredSection } | { kind: "group"; cols: 2 | 3; pair: StoredSection[] }> = [];
  let i = 0;
  while (i < list.length) {
    const s = list[i];
    const disp = (s.type !== "stats" && s.type !== "titre" && s.type !== "separateur") ? s.disposition : undefined;
    if (disp === "moitie" || disp === "tiers") {
      const targetDisp = disp;
      const maxCols = disp === "moitie" ? 2 : 3;
      const group: StoredSection[] = [s];
      while (group.length < maxCols) {
        const next = list[i + 1];
        if (next && next.type !== "stats" && next.type !== "titre" && next.type !== "separateur" && next.disposition === targetDisp) {
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
          <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-[#0089bd]">
            <SectionIcon svg={row.s.icone} />
            {row.s.titre}
          </h2>
        </div>
      );
    }

    if (row.kind === "full" && row.s.type === "stats") {
      const s = row.s as Extract<StoredSection, { type: "stats" }>;
      const cols = s.colonnes ?? 3;
      const centré = s.alignement === "centre";
      const bleu = s.bleu ?? false;
      return (
        <div key={`${keyPrefix}-${ri}`} className={bleu ? bleuCardCls : "py-2"}>
          {s.titre && (
            <h2 className={`flex items-center gap-2 text-2xl font-bold mb-6 ${bleu ? "text-white" : "text-[#0089bd]"} ${centré ? "justify-center text-center" : ""}`}>
              <SectionIcon svg={s.icone} />
              {s.titre}
            </h2>
          )}
          <div className={`${STATS_GRID[cols] ?? STATS_GRID[3]} gap-y-4 ${s.separateurs ? "" : "gap-x-4"}`}>
            {s.stats.map((stat, idx) => {
              const borderCls = s.separateurs
                ? `${idx % 2 !== 0 ? "border-l" : ""} ${cols !== 2 ? (idx % cols !== 0 ? "sm:border-l" : "sm:border-l-0") : ""} ${bleu ? "border-white/20" : "border-zinc-200"}`
                : "";
              return (
                <div key={stat.id} className={`flex flex-col gap-1 px-4 sm:px-6 ${centré ? "items-center text-center" : ""} ${borderCls}`}>
                  <span className={`text-base leading-snug ${bleu ? "text-white/80" : "text-zinc-600"}`}>{stat.label}</span>
                  <span className={`text-5xl font-extrabold leading-none ${bleu ? "text-white" : "text-[#0089bd]"}`}>{stat.valeur}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    if (row.kind === "group") {
      return (
        <div key={`${keyPrefix}-${ri}`} className={GROUP_GRID[row.cols]}>
          {row.pair.map((s) => {
            const bleu = (s as { bleu?: boolean }).bleu ?? false;
            const titreCentre = (s as { titreCentre?: boolean }).titreCentre ?? false;
            const carte = (s as { carte?: boolean }).carte ?? true;
            const separateurDroite = (s as { separateurDroite?: boolean }).separateurDroite ?? false;
            const { titre, bodyHtml } = renderTextSection(s as Extract<StoredSection, { type?: "texte" }>);
            const cls = !carte
              ? `py-4 ${separateurDroite ? "pr-4 sm:pr-6 border-r border-zinc-200" : ""}`
              : `${bleu ? bleuCardCls : colCardCls} ${separateurDroite ? "border-r-2 border-r-zinc-200" : ""}`;
            return (
              <div key={s.id} className={cls}>
                {titre && (
                  <h2 className={`flex items-center gap-2 text-2xl font-bold mb-4 ${bleu && carte ? "text-white" : "text-[#0089bd]"} ${titreCentre ? "justify-center text-center" : ""}`}>
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
            <h2 className={`flex items-center gap-2 text-2xl font-bold mb-4 ${bleu && carte ? "text-white" : "text-[#0089bd]"} ${titreCentre ? "justify-center text-center" : ""}`}>
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
