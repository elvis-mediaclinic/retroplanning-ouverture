"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Bornes approximatives de la France métropolitaine
const FRANCE_BOUNDS: L.LatLngBoundsExpression = [
  [41.2, -5.3],
  [51.2, 9.7],
];

function FitFranceBounds() {
  const map = useMap();
  map.fitBounds(FRANCE_BOUNDS, { animate: false });
  return null;
}

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

const ICON_INTEGRE = dotIcon("#7c3aed");
const ICON_FRANCHISE = dotIcon("#0089bd");
const ICON_EN_ETUDE = dotIcon("#f59e0b");

export function MagasinsMap({
  points,
  villesEnEtude = [],
}: {
  points: MagasinPoint[];
  villesEnEtude?: VilleEnEtudePoint[];
}) {
  const all = [...points, ...villesEnEtude];
  if (all.length === 0) return null;

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
      <MapContainer center={[46.6, 2.2]} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <FitFranceBounds />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
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
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
