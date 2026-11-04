"use client";

import { useState } from "react";

export type TabBouton = { id: string; label: string; href: string };
export type Tab = { id: string; label: string; bodyHtml: string; image?: string; boutons?: TabBouton[] };

// Pastilles d'onglets + panneau de contenu (texte/puces + boutons + photo),
// un seul onglet affiché à la fois — façon maquette "Plus de détails…".
export function TabsSection({ tabs, contentCls }: { tabs: Tab[]; contentCls: string }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  if (!active) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
              t.id === active.id
                ? "bg-brand text-white"
                : "border border-[#1D1D1D]/15 text-[#1D1D1D] hover:border-[#1D1D1D]/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-[25px] bg-[#F6F6F6] px-5 py-8 sm:px-10 sm:py-10">
        <div className={`flex flex-col sm:flex-row items-center gap-8 ${active.image ? "" : "sm:justify-center"}`}>
          <div className="flex-1 min-w-0 w-full space-y-4">
            {active.label && (
              <h3 className="text-2xl sm:text-3xl font-bold text-[#1D1D1D]">{active.label}</h3>
            )}
            {active.bodyHtml.trim() && (
              <div className={contentCls} dangerouslySetInnerHTML={{ __html: active.bodyHtml }} />
            )}
            {active.boutons && active.boutons.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {active.boutons.map((b, i) =>
                  b.label ? (
                    <a
                      key={b.id}
                      href={b.href || "#"}
                      className={
                        i === 0
                          ? "rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors"
                          : "rounded-full border border-[#1D1D1D] px-5 py-2.5 text-sm font-bold text-[#1D1D1D] hover:bg-[#1D1D1D] hover:text-white transition-colors"
                      }
                    >
                      {b.label}
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
          {active.image && (
            <div className="w-full sm:w-80 shrink-0 aspect-[4/3] overflow-hidden rounded-[25px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.image} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
