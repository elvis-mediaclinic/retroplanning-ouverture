"use client";

import { useState, useEffect, useRef } from "react";

type Commune = {
  nom: string;
  departement: { code: string; nom: string };
  region: { code: string; nom: string };
};

type Props = {
  // Champ code postal
  cpName: string;
  cpDefaultValue?: string;
  cpLabel?: string;

  // Champ ville / nom de commune
  villeName: string;
  villeDefaultValue?: string;
  villeLabel?: string;

  // Champs optionnels à auto-remplir
  departementName?: string;
  departementDefaultValue?: string;
  regionName?: string;
  regionDefaultValue?: string;

  className?: string;
};

export function CodePostalAutocomplete({
  cpName,
  cpDefaultValue = "",
  cpLabel = "Code postal",
  villeName,
  villeDefaultValue = "",
  villeLabel = "Ville",
  departementName,
  departementDefaultValue = "",
  regionName,
  regionDefaultValue = "",
  className = "",
}: Props) {
  const [cp, setCp] = useState(cpDefaultValue);
  const [ville, setVille] = useState(villeDefaultValue);
  const [departement, setDepartement] = useState(departementDefaultValue);
  const [region, setRegion] = useState(regionDefaultValue);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cp.length !== 5) { setCommunes([]); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,departement,region&format=json`)
      .then((r) => r.json())
      .then((data: Commune[]) => {
        if (cancelled) return;
        setCommunes(data ?? []);
        if (data?.length > 0) setOpen(true);
        // Auto-sélectionner si une seule commune
        if (data?.length === 1) selectCommune(data[0]);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cp]);

  // Fermer le dropdown si clic extérieur
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
    setOpen(false);
  }

  return (
    <div className={`contents ${className}`}>
      {/* Code postal */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-700">{cpLabel}</label>
        <input
          name={cpName}
          type="text"
          value={cp}
          onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="ex : 64000"
          maxLength={5}
          className="input w-full"
        />
      </div>

      {/* Ville avec dropdown */}
      <div className="space-y-1 relative" ref={containerRef}>
        <label className="text-sm font-medium text-zinc-700">{villeLabel}</label>
        <input
          name={villeName}
          type="text"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          onFocus={() => communes.length > 0 && setOpen(true)}
          placeholder={loading ? "Recherche…" : ""}
          className="input w-full"
        />
        {open && communes.length > 1 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg text-sm">
            {communes.map((c) => (
              <li key={c.nom}>
                <button
                  type="button"
                  onMouseDown={() => selectCommune(c)}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-50"
                >
                  {c.nom}
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
