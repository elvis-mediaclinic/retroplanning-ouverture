"use client";

import { useState, useRef, useEffect } from "react";

export function MultiSelect({
  name,
  options,
  defaultValue = [],
  placeholder = "—",
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string[];
  placeholder?: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(opt: string) {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Hidden inputs for form submission */}
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      {selected.length === 0 && <input type="hidden" name={name} value="" />}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-left flex items-center justify-between gap-2 h-8"
      >
        <span className="truncate text-zinc-700">
          {selected.length === 0 ? <span className="text-zinc-400">{placeholder}</span> : selected.join(", ")}
        </span>
        <span className="text-zinc-400 shrink-0">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded border border-zinc-200 bg-white shadow-lg py-1">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-zinc-300 h-3.5 w-3.5"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
