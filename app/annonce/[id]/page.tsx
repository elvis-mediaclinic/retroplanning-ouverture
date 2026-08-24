import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicSidebar } from "@/components/PublicSidebar";
import { BoldText } from "@/components/BoldText";
import {
  renderStoredSections,
  parseStoredSections,
  groupSections,
  renderBlock,
  renderBlocks,
  cardCls,
  contentCls,
  type LegacySection,
} from "@/components/StoredSectionsRenderer";
import { CandidatureForm } from "./CandidatureForm";
import { ViewTracker } from "./ViewTracker";

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
  const storedSections = parseStoredSections(annonce.sections);

  // Sections concept global — seulement celles cochées "Afficher dans les annonces"
  const conceptSections = (parseStoredSections(conceptPage?.sections) ?? [])
    .filter((s) => s.dansAnnonces);

  // Fallback : ancien format plat
  let legacySections: LegacySection[] = [];
  if (!storedSections && annonce.contenu_json) {
    try {
      const blocks = JSON.parse(annonce.contenu_json);
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
          <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${annonce.hero_bleu ? "text-white/70" : "text-[#0089bd]"}`}>
            Opportunité de franchise
          </p>
          <h1 className={`text-3xl sm:text-4xl font-bold leading-tight ${annonce.hero_bleu ? "text-white" : "text-zinc-900"}`}>
            {annonce.titre}
          </h1>
          {annonce.accroche && (
            <p className={`mt-4 text-lg sm:text-xl leading-relaxed ${annonce.hero_bleu ? "text-white/80" : "text-zinc-500"}`}>
              <BoldText text={annonce.accroche} />
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
                    {headingHtml && <div className="text-2xl font-bold text-[#0089bd] mb-4 [&_h2]:text-2xl [&_h3]:text-xl [&_h2]:font-bold [&_h3]:font-semibold" dangerouslySetInnerHTML={{ __html: headingHtml }} />}
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
        {conceptSections.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-1 [&::-webkit-details-marker]:hidden">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2 text-base font-medium text-zinc-500 hover:border-[#0089bd] hover:text-[#0089bd] transition-colors select-none whitespace-nowrap">
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
