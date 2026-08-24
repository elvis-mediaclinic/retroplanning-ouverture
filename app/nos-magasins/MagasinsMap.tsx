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
  lat: number;
  lng: number;
};

const icon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#0089bd;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function MagasinsMap({ points }: { points: MagasinPoint[] }) {
  if (points.length === 0) return null;

  const center: [number, number] = [
    points.reduce((s, p) => s + p.lat, 0) / points.length,
    points.reduce((s, p) => s + p.lng, 0) / points.length,
  ];

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
            <Popup>
              <span className="font-semibold">{p.nom}</span>
              <br />
              {[p.adresse, p.codePostal, p.ville].filter(Boolean).join(", ")}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
