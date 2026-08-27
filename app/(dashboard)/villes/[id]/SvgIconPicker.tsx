"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { svgUseCurrentColor } from "@/lib/utils";

type SvgIcon = { id: string; svg: string };

// Cache partagé entre toutes les instances du picker sur une même page —
// évite un aller-retour Supabase par section ouverte.
let cache: SvgIcon[] | null = null;
let cachePromise: Promise<SvgIcon[]> | null = null;

async function loadIcons(): Promise<SvgIcon[]> {
  if (cache) return cache;
  if (!cachePromise) {
    cachePromise = (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("svg_icons")
        .select("id, svg")
        .order("created_at", { ascending: false });
      cache = data ?? [];
      return cache;
    })();
  }
  return cachePromise;
}

export function SvgIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (svg: string | undefined) => void;
}) {
  const [icons, setIcons] = useState<SvgIcon[]>(cache ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadIcons().then(setIcons); }, []);

  const saveToLibrary = useCallback(async (svg: string) => {
    if (!svg.trim() || icons.some((i) => i.svg === svg)) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("svg_icons")
      .upsert({ svg }, { onConflict: "svg" })
      .select("id, svg")
      .maybeSingle();
    setSaving(false);
    if (data) {
      cache = [data, ...(cache ?? []).filter((i) => i.svg !== data.svg)];
      setIcons(cache);
    }
  }, [icons]);

  return (
    <div className="space-y-2">
      {icons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {icons.map((i) => (
            <button
              key={i.id}
              type="button"
              title="Utiliser cette icône"
              onClick={() => onChange(i.svg)}
              className={`flex items-center justify-center h-8 w-8 rounded border shrink-0 ${
                value === i.svg ? "border-brand bg-brand/10" : "border-zinc-300 bg-white hover:border-brand/50"
              }`}
            >
              <span
                className="w-4 h-4 text-zinc-700 [&_svg]:w-full [&_svg]:h-full"
                dangerouslySetInnerHTML={{ __html: svgUseCurrentColor(i.svg) }}
              />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder='<svg viewBox="0 0 24 24" fill="black">...</svg>'
          rows={3}
          className="flex-1 min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-mono"
        />
        <button
          type="button"
          disabled={!value.trim() || saving || icons.some((i) => i.svg === value)}
          onClick={() => saveToLibrary(value)}
          title="Ajouter à la bibliothèque pour la réutiliser ailleurs"
          className="shrink-0 rounded border border-zinc-300 bg-white px-2 py-2 text-xs text-zinc-500 hover:text-brand hover:border-brand disabled:opacity-30"
        >
          {saving ? "…" : icons.some((i) => i.svg === value) && value.trim() ? "✓ Enregistrée" : "+ Bibliothèque"}
        </button>
      </div>
    </div>
  );
}
