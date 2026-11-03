"use client";

import { useState } from "react";
import { svgUseCurrentColor } from "@/lib/utils";

export type SplitPanel = {
  id: string;
  titre: string;
  bodyHtml: string;
  icone?: string;
  bleu?: boolean;
};

// Deux cartes côte à côte : celle active prend 2/3 de la largeur et affiche son
// contenu complet, l'autre se replie à 1/3 (titre seul, cliquable pour l'ouvrir).
export function ExpandableSplitGroup({ panels, contentCls }: { panels: SplitPanel[]; contentCls: string }) {
  const [activeId, setActiveId] = useState(panels[0]?.id);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch">
      {panels.map((p) => {
        const active = p.id === activeId;
        return (
          <div
            key={p.id}
            onClick={() => !active && setActiveId(p.id)}
            role={active ? undefined : "button"}
            tabIndex={active ? undefined : 0}
            onKeyDown={(e) => { if (!active && e.key === "Enter") setActiveId(p.id); }}
            className={`rounded-[25px] bg-[#F6F6F6] shadow-[2px_2px_5px_rgba(0,0,0,0.05)] px-5 py-5 sm:px-8 sm:py-8 transition-all duration-300 ${
              active ? "sm:flex-[2]" : "sm:flex-[1] cursor-pointer hover:bg-[#EFEFEF]"
            }`}
          >
            <h2
              className={`flex items-center gap-2 text-2xl font-bold ${active ? "mb-4" : "mb-0"} text-brand`}
            >
              {p.icone && (
                <span
                  className="inline-flex shrink-0 w-6 h-6 [&_svg]:w-full [&_svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: svgUseCurrentColor(p.icone) }}
                />
              )}
              {p.titre}
              {!active && (
                <span className="ml-auto text-xl text-[#5C5C6F] leading-none">+</span>
              )}
            </h2>
            {active && <div className={contentCls} dangerouslySetInnerHTML={{ __html: p.bodyHtml }} />}
          </div>
        );
      })}
    </div>
  );
}
