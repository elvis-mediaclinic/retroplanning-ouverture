export type TimelineEvent = { id: string; date: string; titre: string; description?: string };

// Frise chronologique verticale (ex. dates importantes du développement de la franchise).
export function TimelineSection({ evenements }: { evenements: TimelineEvent[] }) {
  return (
    <div className="space-y-0">
      {evenements.map((e, i) => (
        <div key={e.id} className="flex gap-6">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full bg-brand ring-4 ring-white" />
            {i < evenements.length - 1 && <span className="w-0.5 flex-1 bg-brand/20" />}
          </div>
          <div className={i < evenements.length - 1 ? "pb-10" : ""}>
            {e.date && (
              <p className="text-sm font-bold uppercase tracking-wide text-brand">{e.date}</p>
            )}
            <h3 className="text-xl sm:text-2xl font-bold text-[#1D1D1D] mt-1">{e.titre}</h3>
            {e.description && (
              <p className="mt-1 text-[#5C5C6F] leading-relaxed">{e.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
