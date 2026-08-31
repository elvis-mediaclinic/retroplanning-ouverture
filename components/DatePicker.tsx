"use client";

import { useEffect, useRef, useState } from "react";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

function toISO(y: number, m: number, d: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseISO(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

// Lundi = 0 ... Dimanche = 6
function weekdayMondayFirst(y: number, m: number, d: number) {
  return (new Date(y, m, d).getDay() + 6) % 7;
}

/**
 * Calendrier maison pour un champ date de formulaire — remplace le picker
 * natif du navigateur (mois par mois + sélecteur d'année par blocs de 12).
 * Uncontrolled par défaut (comme un <input type="date">, un champ caché
 * porte la valeur), avec un onChange optionnel pour réagir aux changements
 * (auto-submit, etc.).
 */
export function DatePicker({
  name,
  defaultValue,
  className,
  required,
  allowClear = true,
  onChange,
}: {
  name: string;
  defaultValue?: string | null;
  className?: string;
  required?: boolean;
  allowClear?: boolean;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  const [open, setOpen] = useState(false);
  const [yearPicker, setYearPicker] = useState(false);
  const initial = parseISO(value ?? "") ?? (() => {
    const today = new Date();
    return { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
  })();
  const [viewY, setViewY] = useState(initial.y);
  const [viewM, setViewM] = useState(initial.m);
  const [decadeStart, setDecadeStart] = useState(Math.floor(initial.y / 12) * 12);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setYearPicker(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function commit(v: string) {
    setValue(v);
    onChange?.(v);
  }

  function openCalendar() {
    const p = parseISO(value);
    if (p) { setViewY(p.y); setViewM(p.m); setDecadeStart(Math.floor(p.y / 12) * 12); }
    setYearPicker(false);
    setOpen(true);
  }

  function selectDay(d: number) {
    commit(toISO(viewY, viewM, d));
    setOpen(false);
  }

  function changeMonth(delta: number) {
    let m = viewM + delta;
    let y = viewY;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewM(m); setViewY(y);
  }

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const leadingBlanks = weekdayMondayFirst(viewY, viewM, 1);
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selected = parseISO(value);
  const isSelected = (d: number) => selected && selected.y === viewY && selected.m === viewM && selected.d === d;
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === viewY && today.getMonth() === viewM && today.getDate() === d;

  const displayValue = selected
    ? `${String(selected.d).padStart(2, "0")}/${String(selected.m + 1).padStart(2, "0")}/${selected.y}`
    : "";

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        onClick={openCalendar}
        className={className ?? "input w-full text-sm text-left"}
        style={!value ? { borderStyle: "dashed", opacity: 0.6 } : undefined}
      >
        {displayValue || <span className="text-zinc-400">jj/mm/aaaa</span>}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
          {yearPicker ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setDecadeStart((y) => y - 12)} className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100">‹</button>
                <span className="text-sm font-medium text-zinc-700">{decadeStart} – {decadeStart + 11}</span>
                <button type="button" onClick={() => setDecadeStart((y) => y + 12)} className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100">›</button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, i) => decadeStart + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewY(y); setYearPicker(false); }}
                    className={`rounded-md py-1.5 text-sm ${
                      y === viewY ? "bg-brand text-white font-medium" : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => changeMonth(-1)} className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100">‹</button>
                <button
                  type="button"
                  onClick={() => setYearPicker(true)}
                  className="rounded px-2 py-0.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  {MOIS[viewM]} {viewY}
                </button>
                <button type="button" onClick={() => changeMonth(1)} className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100">›</button>
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {JOURS.map((j, i) => (
                  <span key={i} className="text-[11px] font-medium text-zinc-400">{j}</span>
                ))}
                {cells.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={d === null}
                    onClick={() => d && selectDay(d)}
                    className={`h-7 w-7 mx-auto rounded-full text-sm ${
                      d === null ? "" :
                      isSelected(d) ? "bg-brand text-white font-semibold" :
                      isToday(d) ? "border border-brand text-brand font-medium" :
                      "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {d ?? ""}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { const t = new Date(); commit(toISO(t.getFullYear(), t.getMonth(), t.getDate())); setOpen(false); }}
                  className="flex-1 rounded-md border border-zinc-200 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
                >
                  Aujourd&apos;hui
                </button>
                {allowClear && value && (
                  <button
                    type="button"
                    onClick={() => { commit(""); setOpen(false); }}
                    className="flex-1 rounded-md border border-zinc-200 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
