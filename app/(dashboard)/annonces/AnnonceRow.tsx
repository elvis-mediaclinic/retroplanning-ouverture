"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type Ville = { id: string; nom: string; departement?: string };

export function AnnonceRow({ ville, children, className = "" }: { ville: Ville | null; children: ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <tr
      onClick={ville ? () => router.push(`/villes/${ville.id}`) : undefined}
      className={`${ville ? "cursor-pointer hover:bg-zinc-50" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}
