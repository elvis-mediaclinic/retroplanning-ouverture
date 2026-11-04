"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BoldText } from "@/components/BoldText";
import { InteretSpontaneModal } from "@/components/InteretSpontaneModal";

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
      className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#00B9FF]/10 px-2.5 py-1 text-xs font-medium text-[#00729e] hover:bg-[#00B9FF]/20 transition-colors"
    >
      {copied ? "Lien copié !" : "Copier mon lien"}
    </button>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Annonce = {
  id: string;
  titre: string;
  accroche: string | null;
  imageUrl: string | null;
  isCession: boolean;
  ville: { nom: string; departement: string | null; region: string | null } | null;
  magasin: { nom: string; ville: string | null; code_postal: string | null } | null;
  sharedWithConsultant?: boolean;
};


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
    <div className="space-y-6" style={{ fontFamily: "var(--font-poppins)" }}>
      <div className="mx-auto flex w-full max-w-3xl flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-full bg-white px-3 py-2 sm:py-2.5 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
        {/* Leurres pour Safari qui détecte les champs texte comme des logins */}
        <input type="text" name="fake_user" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
        <input type="password" name="fake_pass" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
        <div className="flex flex-1 items-center gap-2 px-3">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 text-[#AAAABE]">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher une ville, un département…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            className="w-full border-0 bg-transparent text-sm text-[#1D1D1D] placeholder:text-[#AAAABE] focus:outline-none"
          />
        </div>
        <InteretSpontaneModal
          triggerLabel="Ma ville n'est pas dans la liste →"
          triggerClassName="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors shrink-0 whitespace-nowrap"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-center py-8">Aucune opportunité ne correspond à votre recherche.</p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          {filtered.map((a) => {
            const cityLabel = a.ville?.nom ?? a.magasin?.ville ?? null;
            const dept = a.ville?.departement ?? a.magasin?.code_postal?.slice(0, 2) ?? null;

            return (
              <div
                key={a.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/annonce/${a.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/annonce/${a.id}`); }}
                className="group flex flex-col overflow-hidden rounded-[27px] border border-[#E3E8EF] bg-white shadow-[2px_2px_5px_rgba(0,0,0,0.05)] cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <div className="relative h-[220px] w-full shrink-0 overflow-hidden bg-[#00B9FF]">
                  {a.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {a.isCession && (
                    <span className="absolute top-3 right-3 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                      Cession
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-5 py-5">
                  <h2 className="text-xl font-bold leading-snug text-[#1D1D1D] line-clamp-2">{a.titre}</h2>
                  {a.accroche && (
                    <p className="mt-2 text-sm leading-relaxed text-[#6B7281] line-clamp-3">
                      <BoldText text={a.accroche} />
                    </p>
                  )}

                  <div className="mt-4 border-t border-[#6B7281]/25" />

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {dept && (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00B9FF] text-sm font-bold text-white">
                          {dept}
                        </span>
                      )}
                      {cityLabel && (
                        <span className="truncate text-base font-bold text-[#1D1D1D]">{cityLabel}</span>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#00B9FF]">
                      Voir l&apos;annonce complète
                      <ArrowRight />
                    </span>
                  </div>

                  {consultantId && a.sharedWithConsultant && <CopyLienButton annonceId={a.id} consultantId={consultantId} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
