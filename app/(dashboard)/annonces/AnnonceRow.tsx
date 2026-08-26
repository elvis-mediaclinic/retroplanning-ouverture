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

// Lien externe à l'intérieur d'une AnnonceRow : bloque la propagation du
// clic pour ne pas déclencher aussi la navigation de la ligne.
export function VoirArticleLink({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      Voir l&apos;article ↗
    </a>
  );
}
