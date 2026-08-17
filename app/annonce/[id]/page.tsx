import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CandidatureForm } from "./CandidatureForm";

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

const cardCls =
  "rounded-2xl bg-white border border-zinc-200 shadow-sm px-8 py-8 sm:px-10 sm:py-10";

const contentCls =
  "text-zinc-700 text-base leading-relaxed " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_h3]:mb-2 " +
  "[&_p]:mb-3 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-3 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-brand/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-4 " +
  "[&_a]:text-brand [&_a]:underline " +
  "[&_strong]:font-semibold";

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: annonce } = await supabase
    .from("annonces")
    .select("id, titre, accroche, contenu, contenu_json, sections, actif, villes(id, nom)")
    .eq("id", id)
    .eq("actif", true)
    .single();

  if (!annonce) notFound();

  const villeRaw = annonce.villes as unknown;
  const ville = Array.isArray(villeRaw)
    ? (villeRaw[0] as { id: string; nom: string } | undefined)
    : (villeRaw as { id: string; nom: string } | null);

  // Sections structurées (nouveau format) ou fallback sur l'ancien contenu_json
  type StoredSection = { id: string; titre: string; contenu_json: string; disposition?: "pleine" | "moitie" };
  let storedSections: StoredSection[] | null = null;
  if (annonce.sections) {
    try { storedSections = annonce.sections as StoredSection[]; } catch { /* ignore */ }
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
    <div className="min-h-screen bg-zinc-100">
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

      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-4 flex items-center gap-2">
          <span className="font-bold text-zinc-900 text-sm">Mediaclinic</span>
          {ville && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-sm text-zinc-500">{ville.nom}</span>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-8 sm:py-12 space-y-4">

        {/* Hero — titre + accroche */}
        <div className={cardCls}>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">
            Opportunité de franchise
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
            {annonce.titre}
          </h1>
          {annonce.accroche && (
            <p className="mt-4 text-lg sm:text-xl text-zinc-500 leading-relaxed max-w-3xl">
              {annonce.accroche}
            </p>
          )}
        </div>

        {/* Sections de contenu */}
        {/* Nouveau format : sections structurées */}
        {storedSections
          ? (() => {

              function renderStoredSection(s: StoredSection) {
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
                  return renderBlocks(sec.blocks);
                }).join("\n");

                return { titre: s.titre, bodyHtml };
              }

              // Grouper les sections consécutives en moitié
              const rows: Array<{ kind: "full"; s: StoredSection } | { kind: "half"; pair: StoredSection[] }> = [];
              let i = 0;
              while (i < storedSections.length) {
                const s = storedSections[i];
                if (s.disposition === "moitie") {
                  const pair: StoredSection[] = [s];
                  if (storedSections[i + 1]?.disposition === "moitie") {
                    pair.push(storedSections[i + 1]);
                    i++;
                  }
                  rows.push({ kind: "half", pair });
                } else {
                  rows.push({ kind: "full", s });
                }
                i++;
              }

              return rows.map((row, ri) => {
                if (row.kind === "half") {
                  return (
                    <div key={ri} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {row.pair.map((s) => {
                        const { titre, bodyHtml } = renderStoredSection(s);
                        return (
                          <div key={s.id} className={`col-card px-8 py-8 sm:px-10 sm:py-10`}>
                            {titre && <h2 className="text-2xl font-bold text-zinc-900 mb-4">{titre}</h2>}
                            {bodyHtml.trim() && <div className={contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                const { titre, bodyHtml } = renderStoredSection(row.s);
                return (
                  <div key={ri} className={cardCls}>
                    {titre && <h2 className="text-2xl font-bold text-zinc-900 mb-4">{titre}</h2>}
                    {bodyHtml.trim() && <div className={contentCls} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
                  </div>
                );
              });
            })()


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
                    {headingHtml && <div className="text-2xl font-bold text-zinc-900 mb-4 [&_h2]:text-2xl [&_h3]:text-xl [&_h2]:font-bold [&_h3]:font-semibold" dangerouslySetInnerHTML={{ __html: headingHtml }} />}
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
    </div>
  );
}
