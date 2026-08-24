"use client";

import dynamic from "next/dynamic";
import type { MagasinPoint } from "./MagasinsMap";

const MagasinsMap = dynamic(() => import("./MagasinsMap").then((m) => m.MagasinsMap), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />,
});

export function MagasinsMapLoader({ points }: { points: MagasinPoint[] }) {
  return <MagasinsMap points={points} />;
}
