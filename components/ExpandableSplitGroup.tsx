"use client";

import { useState } from "react";
import { svgUseCurrentColor } from "@/lib/utils";

export type SplitPanel = {
  id: string;
  titre: string;
  bodyHtml: string;
  icone?: string;
  image?: string;
};

// 2 ou 3 cartes côte à côte : la carte active occupe la plus grande part de la
// largeur et affiche son contenu complet (fond gris clair). Les autres se
// replient (fond bleu clair texturé, titre + bouton "voir plus"), toute la
// carte étant cliquable pour l'ouvrir à son tour.
export function ExpandableSplitGroup({ panels, contentCls }: { panels: SplitPanel[]; contentCls: string }) {
  const [activeId, setActiveId] = useState(panels[0]?.id);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch">
      {panels.map((p) => {
        const active = p.id === activeId;

        if (active) {
          return (
            <div
              key={p.id}
              className="rounded-[25px] bg-[#F6F6F6] shadow-[2px_2px_5px_rgba(0,0,0,0.05)] px-5 py-5 sm:px-8 sm:py-8 transition-all duration-300 sm:flex-[2]"
            >
              <div className="flex flex-col sm:flex-row gap-6 items-stretch">
                <div className="flex-1 min-w-0">
                  <h2 className="flex items-center gap-2 text-3xl sm:text-5xl font-bold mb-4 text-[#1D1D1D] max-w-md">
                    {p.icone && (
                      <span
                        className="inline-flex shrink-0 w-6 h-6 [&_svg]:w-full [&_svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: svgUseCurrentColor(p.icone) }}
                      />
                    )}
                    {p.titre}
                  </h2>
                  <div className={contentCls} dangerouslySetInnerHTML={{ __html: p.bodyHtml }} />
                </div>
                {p.image && (
                  <div className="w-full h-56 sm:h-auto sm:w-56 shrink-0 self-stretch overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div
            key={p.id}
            onClick={() => setActiveId(p.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") setActiveId(p.id); }}
            className="relative overflow-hidden flex flex-col justify-between gap-6 min-h-[220px] rounded-[25px] bg-[#CCF1FF] shadow-[2px_2px_5px_rgba(0,0,0,0.05)] px-5 py-5 sm:px-8 sm:py-8 transition-all duration-300 sm:flex-1 cursor-pointer hover:brightness-[0.97]"
          >
            {/* Texture décorative : cercles translucides, façon maquette */}
            <span className="pointer-events-none absolute -left-12 bottom-4 h-40 w-40 rounded-full bg-white/40" />
            <span className="pointer-events-none absolute left-14 -bottom-4 h-24 w-24 rounded-full bg-white/40" />

            <h2 className="relative flex items-center gap-2 text-2xl sm:text-4xl font-bold text-[#1D1D1D]">
              {p.icone && (
                <span
                  className="inline-flex shrink-0 w-5 h-5 [&_svg]:w-full [&_svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: svgUseCurrentColor(p.icone) }}
                />
              )}
              {p.titre}
            </h2>

            <span className="relative inline-flex w-fit items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white">
              voir plus
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
                <path d="M5 15L15 5M15 5H7M15 5V13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        );
      })}
    </div>
  );
}
