import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicSidebar } from "@/components/PublicSidebar";
import { CandidatureForm } from "./CandidatureForm";
import { ViewTracker } from "./ViewTracker";

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

  switch (block.type) {
    case "paragraph":
      return inner ? `<p${ca}>${inner}</p>` : "<br/>";
    case "heading": {
      const lvl = (block.props?.level as number) ?? 2;
      const tag = lvl === 1 ? "h1" : lvl === 2 ? "h2" : "h3";
      return `<${tag}${ca}>${inner}</${tag}>`;
    }
    case "bulletListItem":
      return `<li${ca}>${inner}</li>`;
    case "numberedListItem":
      return `<li${ca}>${inner}</li>`;
    case "image": {
      const url = block.props?.url as string | undefined;
      const caption = block.props?.caption as string | undefined;
      if (!url) return "";
      const img = `<img src="${url}" alt="${caption ? esc(caption) : ""}" style="max-width:100%;border-radius:0.75rem;margin:1rem 0;" />`;
      return caption ? `<figure>${img}<figcaption style="text-align:center;font-size:0.875rem;color:#71717a;margin-top:0.25rem;">${esc(caption)}</figcaption></figure>` : img;
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

// ── Section grouping ─────────────────────────────────────────────────────────

type Section =
  | { kind: "columns"; cols: Block[][] }
  | { kind: "image"; block: Block }
  | { kind: "section"; heading: Block | null; blocks: Block[] };


function groupSections(blocks: Block[]): Section[] {
  const sections: Section[] = [];
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

// ── Card styles ───────────────────────────────────────────────────────────────

const STATS_GRID: Record<number, string> = {
  2: "grid grid-cols-2 gap-4",
  3: "grid grid-cols-2 sm:grid-cols-3 gap-4",
  4: "grid grid-cols-2 sm:grid-cols-4 gap-4",
};

const cardCls =
  "rounded-2xl bg-white border border-zinc-200 shadow-sm px-4 py-4 sm:px-6 sm:py-6";

const contentCls =
  "text-zinc-700 text-base leading-relaxed " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_h3]:mb-2 " +
  "[&_p]:mb-3 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-3 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-brand/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-4 " +
  "[&_a]:text-brand [&_a]:underline " +
  "[&_strong]:font-semibold";

const contentClsDark =
  "text-white/85 text-base leading-relaxed " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mb-2 " +
  "[&_p]:mb-3 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-3 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-white/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/70 [&_blockquote]:my-4 " +
  "[&_a]:text-white [&_a]:underline " +
  "[&_strong]:font-semibold [&_strong]:text-white";

const bleuCardCls = "rounded-2xl bg-gradient-to-br from-[#00729e] to-[#0089bd] shadow-sm px-4 py-4 sm:px-6 sm:py-6";

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: annonce }, { data: conceptPage }, { data: { user } }] = await Promise.all([
    supabase
      .from("annonces")
      .select("id, titre, accroche, contenu, contenu_json, sections, actif, hero_bleu, villes(id, nom)")
      .eq("id", id)
      .single(),
    supabase.from("pages").select("sections").eq("key", "concept").maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!annonce) notFound();

  const villeRaw = annonce.villes as unknown;
  const ville = Array.isArray(villeRaw)
    ? (villeRaw[0] as { id: string; nom: string } | undefined)
    : (villeRaw as { id: string; nom: string } | null);

  // Sections structurées (nouveau format) ou fallback sur l'ancien contenu_json
  type StatItem = { id: string; valeur: string; label: string };
  type StoredSection =
    | { id: string; type?: "texte"; titre: string; contenu_json: string; disposition?: "pleine" | "moitie" | "tiers"; bleu?: boolean; icone?: string }
    | { id: string; type: "stats"; titre: string; stats: StatItem[]; colonnes: 2 | 3 | 4; alignement?: "gauche" | "centre"; bleu?: boolean; icone?: string }
    | { id: string; type: "titre"; titre: string; icone?: string };

  function SectionIcon({ svg, className }: { svg?: string; className?: string }) {
    if (!svg) return null;
    return (
      <span
        className={`inline-flex shrink-0 [&_svg]:w-full [&_svg]:h-full ${className ?? "w-6 h-6"}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  let storedSections: StoredSection[] | null = null;
  if (annonce.sections) {
    try {
      const s = annonce.sections;
      storedSections = Array.isArray(s) ? (s as StoredSection[]) : JSON.parse(s as string) as StoredSection[];
    } catch { /* ignore */ }
  }

  // Sections concept global
  let conceptSections: StoredSection[] | null = null;
  if (conceptPage?.sections) {
    try {
      const s = conceptPage.sections;
      conceptSections = Array.isArray(s) ? (s as StoredSection[]) : JSON.parse(s as string) as StoredSection[];
    } catch { /* ignore */ }
  }

  // Helper : render un tableau de StoredSection en JSX (annonce + concept)
  function renderStoredSections(list: StoredSection[], keyPrefix: string) {
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
          const width = sec.block.props?.width as number | undefined;
          if (!url) return "";
          return `<figure style="text-align:center;margin:1rem 0"><img src="${url}" alt="${caption ?? ""}" style="max-width:${width ? `${width}px` : "100%"};border-radius:0.75rem" />${caption ? `<figcaption style="font-size:0.875rem;color:#71717a;margin-top:0.25rem">${esc(caption)}</figcaption>` : ""}</figure>`;
        }
        return [sec.heading ? renderBlock(sec.heading) : "", renderBlocks(sec.blocks)].join("\n");
      }).join("\n");
      return { titre: s.titre, bodyHtml };
    }

    const rows: Array<{ kind: "full"; s: StoredSection } | { kind: "group"; cols: 2 | 3; pair: StoredSection[] }> = [];
    let i = 0;
    while (i < list.length) {
      const s = list[i];
      const disp = (s.type !== "stats" && s.type !== "titre") ? s.disposition : undefined;
      if (disp === "moitie" || disp === "tiers") {
        const targetDisp = disp;
        const maxCols = disp === "moitie" ? 2 : 3;
        const group: StoredSection[] = [s];
        while (group.length < maxCols) {
          const next = list[i + 1];
          if (next && next.type !== "stats" && next.type !== "titre" && next.disposition === targetDisp) {
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
        const centré = s.alignement === "centre";
        const bleu = s.bleu ?? false;
        return (
          <div key={`${keyPrefix}-${ri}`} className={bleu ? bleuCardCls : "py-2"}>
            {s.titre && (
              <h2 className={`flex items-center gap-2 text-2xl font-bold mb-6 ${bleu ? "text-white" : "text-brand"} ${centré ? "justify-center text-center" : ""}`}>
                <SectionIcon svg={s.icone} />
                {s.titre}
              </h2>
            )}
            <div className={STATS_GRID[cols] ?? STATS_GRID[3]}>
              {s.stats.map((stat) => (
                <div key={stat.id} className={`flex flex-col gap-1 px-4 sm:px-6 ${centré ? "items-center text-center" : ""}`}>
                  <span className={`text-base leading-snug ${bleu ? "text-white/80" : "text-zinc-600"}`}>{stat.label}</span>
                  <span className={`text-5xl font-extrabold leading-none ${bleu ? "text-white" : "text-brand"}`}>{stat.valeur}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      if (row.kind === "group") {
        return (
          <div key={`${keyPrefix}-${ri}`} className={GROUP_GRID[row.cols]}>
            {row.pair.map((s) => {
              const bleu = (s as { bleu?: boolean }).bleu ?? false;
              const { titre, bodyHtml } = renderTextSection(s as Extract<StoredSection, { type?: "texte" }>);
              return (
                <div key={s.id} className={bleu ? bleuCardCls : "col-card px-4 py-4 sm:px-6 sm:py-6"}>
                  {titre && (
                    <h2 className={`flex items-center gap-2 text-2xl font-bold mb-4 ${bleu ? "text-white" : "text-brand"}`}>
                      <SectionIcon svg={(s as { icone?: string }).icone} />
                      {titre}
                    </h2>
                  )}
                  {bodyHtml.trim() && <div className={bleu ? contentClsDark : contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
                </div>
              );
            })}
          </div>
        );
      }
      {
        const bleu = (row.s as { bleu?: boolean }).bleu ?? false;
        const { titre, bodyHtml } = renderTextSection(row.s as Extract<StoredSection, { type?: "texte" }>);
        return (
          <div key={`${keyPrefix}-${ri}`} className={bleu ? bleuCardCls : cardCls}>
            {titre && (
              <h2 className={`flex items-center gap-2 text-2xl font-bold mb-4 ${bleu ? "text-white" : "text-brand"}`}>
                <SectionIcon svg={(row.s as { icone?: string }).icone} />
                {titre}
              </h2>
            )}
            {bodyHtml.trim() && <div className={bleu ? contentClsDark : contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
          </div>
        );
      }
    });
  }

  // Fallback : ancien format plat
  let legacySections: Section[] = [];
  if (!storedSections && annonce.contenu_json) {
    try {
      const blocks: Block[] = JSON.parse(annonce.contenu_json);
      legacySections = groupSections(blocks);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 md:flex-row">
      <style>{`
        [data-text-color="gray"]   { color: #9b9a97 !important; }
        [data-text-color="brown"]  { color: #64473a !important; }
        [data-text-color="red"]    { color: #e03e3e !important; }
        [data-text-color="orange"] { color: #d9730d !important; }
        [data-text-color="yellow"] { color: #dfab01 !important; }
        [data-text-color="green"]  { color: #4d6461 !important; }
        [data-text-color="blue"]   { color: #0b6e99 !important; }
        [data-text-color="purple"] { color: #6940a5 !important; }
        [data-text-color="pink"]   { color: #ad1a72 !important; }
        [data-text-color] [data-style-type="textColor"][data-value="rgb(0, 0, 0)"] { color: inherit !important; }
        .card-heading h1, .card-heading h2, .card-heading h3 { font-size: 1.5rem; font-weight: 700; margin: 0; }
        .col-card { background: #fff; border: 1px solid #e4e4e7; border-left: 2px solid #0ea5e9; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
      `}</style>

      <PublicSidebar active="opportunites" />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 pt-3 pb-8 space-y-6">

        {!annonce.actif && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ Brouillon — cette annonce n&apos;est pas publiée et n&apos;est visible que par vous.
          </div>
        )}

        {/* Hero — titre + accroche */}
        <div className={annonce.hero_bleu
          ? "rounded-2xl bg-gradient-to-br from-[#00729e] to-[#0089bd] shadow-sm px-4 py-4 sm:px-6 sm:py-6"
          : cardCls
        }>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${annonce.hero_bleu ? "text-white/70" : "text-brand"}`}>
            Opportunité de franchise
          </p>
          <h1 className={`text-3xl sm:text-4xl font-bold leading-tight ${annonce.hero_bleu ? "text-white" : "text-zinc-900"}`}>
            {annonce.titre}
          </h1>
          {annonce.accroche && (
            <p className={`mt-4 text-lg sm:text-xl leading-relaxed ${annonce.hero_bleu ? "text-white/80" : "text-zinc-500"}`}>
              {annonce.accroche}
            </p>
          )}
        </div>

        {/* Sections de contenu de l'annonce */}
        {storedSections
          ? renderStoredSections(storedSections, "annonce")


          : /* Fallback legacy : ancien contenu_json plat */
            legacySections.length > 0
            ? legacySections.map((section, i) => {
                if (section.kind === "columns") {
                  return (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {section.cols.map((colBlocks, j) => {
                        const firstIsHeading = colBlocks[0]?.type === "heading";
                        const headingBlock = firstIsHeading ? colBlocks[0] : null;
                        const bodyBlocks = firstIsHeading ? colBlocks.slice(1) : colBlocks;
                        const headingHtml = headingBlock ? renderBlock(headingBlock) : null;
                        const bodyHtml = renderBlocks(bodyBlocks);
                        return (
                          <div key={j} className="col-card px-8 py-8 sm:px-10 sm:py-10">
                            {headingHtml && <div className="card-heading mb-4" dangerouslySetInnerHTML={{ __html: headingHtml }} />}
                            <div className={contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                if (section.kind === "image") {
                  const url = section.block.props?.url as string | undefined;
                  const caption = section.block.props?.caption as string | undefined;
                  const width = section.block.props?.width as number | undefined;
                  if (!url) return null;
                  return (
                    <figure key={i} className="flex flex-col items-center gap-2">
                      <img src={url} alt={caption ?? ""} style={{ maxWidth: width ? `${width}px` : "100%", width: "100%", borderRadius: "0.75rem" }} />
                      {caption && <figcaption className="text-sm text-zinc-400 text-center">{caption}</figcaption>}
                    </figure>
                  );
                }
                const headingHtml = section.heading ? renderBlock(section.heading) : null;
                const bodyHtml = renderBlocks(section.blocks);
                if (!headingHtml && !bodyHtml.trim()) return null;
                return (
                  <div key={i} className={cardCls}>
                    {headingHtml && <div className="text-2xl font-bold text-brand mb-4 [&_h2]:text-2xl [&_h3]:text-xl [&_h2]:font-bold [&_h3]:font-semibold" dangerouslySetInnerHTML={{ __html: headingHtml }} />}
                    {bodyHtml.trim() && <div className={contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
                  </div>
                );
              })
            : annonce.contenu && (
                <div className={cardCls}>
                  <div className={contentCls} dangerouslySetInnerHTML={{ __html: annonce.contenu }} />
                </div>
              )
        }

        {/* Sections concept Mediaclinic — communes à toutes les annonces */}
        {conceptSections && conceptSections.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-1 [&::-webkit-details-marker]:hidden">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2 text-base font-medium text-zinc-500 hover:border-brand hover:text-brand transition-colors select-none whitespace-nowrap">
                <span className="group-open:hidden">Découvrir le concept Mediaclinic →</span>
                <span className="hidden group-open:inline">Masquer le concept Mediaclinic ↑</span>
              </span>
              <div className="h-px flex-1 bg-zinc-200" />
            </summary>
            <div className="mt-6 space-y-4">
              {renderStoredSections(conceptSections, "concept")}
            </div>
          </details>
        )}

        {/* Formulaire */}
        <div className={`${cardCls}`}>
          <h2 className="text-xl font-semibold text-zinc-900 mb-1">Je candidate</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Remplissez ce formulaire et l&apos;équipe Mediaclinic vous recontactera rapidement.
          </p>
          <CandidatureForm annonceId={annonce.id} villeId={ville?.id ?? ""} />
        </div>

        <p className="text-center text-xs text-zinc-400 py-4">
          © Mediaclinic — Réseau de franchise
        </p>
      </main>

      {/* Suivi d'audience RGPD — ignoré si l'utilisateur est connecté */}
      {!user && <ViewTracker annonceId={annonce.id} />}
    </div>
  );
}
