"use client";

import { useState, useEffect, useRef } from "react";

type Commune = {
  nom: string;
  codesPostaux: string[];
  departement: { code: string; nom: string };
  region: { code: string; nom: string };
};

type Props = {
  villeName: string;
  villeDefaultValue?: string;
  villeLabel?: string;

  departementName?: string;
  departementDefaultValue?: string;
  regionName?: string;
  regionDefaultValue?: string;

  className?: string;
};

export function VilleAutocomplete({
  villeName,
  villeDefaultValue = "",
  villeLabel = "Nom de la ville *",
  departementName,
  departementDefaultValue = "",
  regionName,
  regionDefaultValue = "",
  className = "",
}: Props) {
  const [ville, setVille] = useState(villeDefaultValue);
  const [departement, setDepartement] = useState(departementDefaultValue);
  const [region, setRegion] = useState(regionDefaultValue);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ville.trim().length < 2) { setCommunes([]); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville.trim())}&fields=nom,codesPostaux,departement,region&boost=population&limit=10&format=json`)
        .then((r) => r.json())
        .then((data: Commune[]) => {
          if (cancelled) return;
          setCommunes(data ?? []);
          if (data?.length > 0) setOpen(true);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function selectCommune(c: Commune) {
    setVille(c.nom);
    if (departementName) setDepartement(c.departement.code);
    if (regionName) setRegion(c.region.nom);
    setCommunes([]);
    setOpen(false);
  }

  return (
    <div className={`contents ${className}`}>
      {/* Ville avec dropdown */}
      <div className="space-y-1 relative" ref={containerRef}>
        <label className="text-sm font-medium text-zinc-700">{villeLabel}</label>
        <input
          name={villeName}
          type="text"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          onFocus={() => communes.length > 0 && setOpen(true)}
          placeholder={loading ? "Recherche…" : "ex : Pau"}
          className="input w-full"
          autoComplete="off"
        />
        {open && communes.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg text-sm">
            {communes.map((c) => (
              <li key={`${c.nom}-${c.departement.code}`}>
                <button
                  type="button"
                  onMouseDown={() => selectCommune(c)}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-50"
                >
                  {c.nom}
                  <span className="ml-2 text-xs text-zinc-400">
                    {c.codesPostaux?.[0]} · {c.departement.nom}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Département (si géré) */}
      {departementName && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Département</label>
          <input
            name={departementName}
            type="text"
            value={departement}
            onChange={(e) => setDepartement(e.target.value)}
            placeholder="ex : 64"
            className="input w-full"
          />
        </div>
      )}

      {/* Région (si gérée) */}
      {regionName && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Région</label>
          <input
            name={regionName}
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="ex : Nouvelle-Aquitaine"
            className="input w-full"
          />
        </div>
      )}
    </div>
  );
}
