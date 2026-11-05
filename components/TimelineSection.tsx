"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type TimelineEvent = { id: string; date: string; titre: string; description?: string };

function EventContent({ e, align }: { e: TimelineEvent; align?: "left" | "right" }) {
  const borderCls = align === "right" ? "border-r-2 border-brand/30 pr-6" : "border-l-2 border-brand/30 pl-6";
  return (
    <div className={`${align === "right" ? "text-right" : ""} ${borderCls}`}>
      {e.date && (
        <p className="text-sm font-bold uppercase tracking-wide text-brand">{e.date}</p>
      )}
      <h3 className="text-xl sm:text-2xl font-bold text-[#1D1D1D] mt-1">{e.titre}</h3>
      {e.description && (
        <p className="mt-1 text-[#5C5C6F] leading-relaxed">{e.description}</p>
      )}
    </div>
  );
}

// Frise chronologique : liste simple à gauche sur mobile. À partir de sm,
// ligne centrale avec événements en quinconce, positionnés en absolu d'après
// leur hauteur réelle mesurée au rendu : un élément démarre à la moitié de la
// hauteur du précédent, mais jamais avant la fin du précédent élément de son
// propre côté (sinon deux éléments du même côté se chevaucheraient).
export function TimelineSection({ evenements }: { evenements: TimelineEvent[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [tops, setTops] = useState<number[]>(() => evenements.map((_, i) => i * 120));
  const [containerHeight, setContainerHeight] = useState(0);

  useLayoutEffect(() => {
    const els = refs.current;

    const GAP = 24; // espace minimal entre deux éléments consécutifs du même côté

    function recompute() {
      const heights = els.map((el) => el?.offsetHeight ?? 0);
      const nextTops: number[] = [];
      let leftNext = 0;
      let rightNext = 0;
      evenements.forEach((_, i) => {
        const onRight = i % 2 === 1;
        const top = onRight ? rightNext : leftNext;
        nextTops[i] = top;
        const half = heights[i] / 2;
        if (onRight) {
          rightNext = top + heights[i] + GAP;
          leftNext = Math.max(leftNext, top + half);
        } else {
          leftNext = top + heights[i] + GAP;
          rightNext = Math.max(rightNext, top + half);
        }
      });
      setTops(nextTops);
      setContainerHeight(Math.max(leftNext, rightNext) - GAP);
    }

    recompute();
    const ro = new ResizeObserver(recompute);
    els.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [evenements]);

  return (
    <>
      {/* Mobile : ligne à gauche, événements empilés */}
      <div className="sm:hidden">
        {evenements.map((e, i) => (
          <div key={e.id} className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full bg-brand ring-4 ring-white" />
              {i < evenements.length - 1 && <span className="w-0.5 flex-1 bg-brand/20" />}
            </div>
            <div className={i < evenements.length - 1 ? "pb-10" : ""}>
              <EventContent e={e} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop : ligne centrale, événements en quinconce, positions mesurées */}
      <div className="hidden sm:block relative" style={{ height: containerHeight || undefined }}>
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-brand/20" />
        {evenements.map((e, i) => {
          const onRight = i % 2 === 1;
          return (
            <div
              key={e.id}
              ref={(el) => { refs.current[i] = el; }}
              style={{ position: "absolute", top: tops[i], [onRight ? "left" : "right"]: "50%" }}
              className={`w-1/2 ${onRight ? "pl-8" : "pr-8"}`}
            >
              <span
                className="absolute top-2 h-4 w-4 rounded-full bg-brand ring-4 ring-white z-10"
                style={onRight ? { left: 0, transform: "translateX(-50%)" } : { right: 0, transform: "translateX(50%)" }}
              />
              <EventContent e={e} align={onRight ? "left" : "right"} />
            </div>
          );
        })}
      </div>
    </>
  );
}
