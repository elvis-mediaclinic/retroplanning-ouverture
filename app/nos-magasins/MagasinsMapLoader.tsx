"use client";

import dynamic from "next/dynamic";
import type { MagasinPoint, VilleEnEtudePoint } from "./MagasinsMap";

const MagasinsMap = dynamic(() => import("./MagasinsMap").then((m) => m.MagasinsMap), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />,
});

export function MagasinsMapLoader({
  points,
  villesEnEtude,
}: {
  points: MagasinPoint[];
  villesEnEtude?: VilleEnEtudePoint[];
}) {
  return <MagasinsMap points={points} villesEnEtude={villesEnEtude} />;
}
