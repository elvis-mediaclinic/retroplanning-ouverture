export type TimelineEvent = { id: string; date: string; titre: string; description?: string };

function EventContent({ e, align }: { e: TimelineEvent; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
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

// Frise chronologique : liste simple à gauche sur mobile, en quinconce de
// part et d'autre d'une ligne centrale à partir de sm (gain de place).
export function TimelineSection({ evenements }: { evenements: TimelineEvent[] }) {
  return (
    <>
      {/* Mobile : ligne à gauche */}
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

      {/* Desktop : ligne centrale, événements en quinconce */}
      <div className="hidden sm:block">
        {evenements.map((e, i) => {
          const onLeft = i % 2 === 0;
          const isLast = i === evenements.length - 1;
          return (
            <div key={e.id} className="grid grid-cols-[1fr_32px_1fr] items-stretch gap-6">
              <div className="pt-1">{onLeft && <EventContent e={e} align="right" />}</div>
              <div className="flex flex-col items-center">
                <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full bg-brand ring-4 ring-white" />
                {!isLast && <span className="w-0.5 flex-1 bg-brand/20" />}
              </div>
              <div className={`pt-1 ${isLast ? "" : "pb-10"}`}>{!onLeft && <EventContent e={e} />}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
