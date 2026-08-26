"use client";

import { useState } from "react";

export function CopyEmail({ email, className }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponible — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copier l'adresse email"
      className={`text-left hover:underline ${className ?? ""}`}
    >
      {copied ? <span className="text-green-600">Copié !</span> : email}
    </button>
  );
}
