"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MagasinPoint = {
  id: string;
  nom: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  type: "integre" | "franchise";
  lat: number;
  lng: number;
};

export type VilleEnEtudePoint = {
  id: string;
  nom: string;
  departement: string | null;
  lat: number;
  lng: number;
};

function dotIcon(color: string, size = 22) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function starIcon(color: string, size = 28) {
  return L.divIcon({
    className: "",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5))">
      <path fill="${color}" stroke="white" stroke-width="1.5" d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-4-6.3 4 1.7-7L2 9.2l7.1-.6z"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ICON_INTEGRE = dotIcon("#7c3aed");
const ICON_FRANCHISE = dotIcon("#0089bd");
const ICON_EN_ETUDE = starIcon("#e60076");

export function MagasinsMap({
  points,
  villesEnEtude = [],
}: {
  points: MagasinPoint[];
  villesEnEtude?: VilleEnEtudePoint[];
}) {
  const all = [...points, ...villesEnEtude];
  if (all.length === 0) return null;

  const center: [number, number] = [
    all.reduce((s, p) => s + p.lat, 0) / all.length,
    all.reduce((s, p) => s + p.lng, 0) / all.length,
  ];

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={p.type === "integre" ? ICON_INTEGRE : ICON_FRANCHISE}>
            <Popup>
              <span className="font-semibold">{p.nom}</span>
              <br />
              {[p.adresse, p.codePostal, p.ville].filter(Boolean).join(", ")}
              <br />
              <span className="text-xs text-zinc-500">{p.type === "integre" ? "Magasin intégré" : "Magasin franchisé"}</span>
            </Popup>
          </Marker>
        ))}
        {villesEnEtude.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={ICON_EN_ETUDE}>
            <Popup>
              <span className="font-semibold">{v.nom}</span>
              {v.departement && <span className="text-xs text-zinc-500"> ({v.departement})</span>}
              <br />
              <span className="text-xs text-amber-600">Ville en étude</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
