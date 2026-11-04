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

// Frise chronologique : liste simple à gauche sur mobile. À partir de sm,
// ligne centrale avec événements en quinconce qui se chevauchent légèrement
// (le suivant démarre à mi-hauteur du précédent, pas en dessous).
export function TimelineSection({ evenements }: { evenements: TimelineEvent[] }) {
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

      {/* Desktop : ligne centrale, événements en quinconce qui se chevauchent */}
      <div className="hidden sm:block relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-brand/20" />
        {evenements.map((e, i) => {
          const onRight = i % 2 === 0;
          return (
            <div
              key={e.id}
              className={`relative flex ${onRight ? "justify-end" : "justify-start"} ${i > 0 ? "-mt-10" : ""}`}
            >
              <span className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-brand ring-4 ring-white z-10" />
              <div
                className={`w-1/2 ${onRight ? "pl-10" : "pr-10"}`}
              >
                <EventContent e={e} align={onRight ? "left" : "right"} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
