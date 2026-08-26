"use client";

import { useState } from "react";

export function CopyConsultantLink({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {copied ? "Lien copié !" : "Copier mon lien"}
    </button>
  );
}
