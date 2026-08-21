"use client";

import { useEffect, useState } from "react";
import { recordView } from "./actions";

const CONSENT_KEY = "mc_analytics_consent";
const VISITOR_KEY  = "mc_visitor";
const MAX_AGE      = 60 * 60 * 24 * 365; // 1 an en secondes

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge = MAX_AGE) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function genUUID(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ViewTracker({ annonceId }: { annonceId: string }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getCookie(CONSENT_KEY);

    if (consent === "yes") {
      // Consentement déjà donné — enregistre la vue silencieusement
      const visitorId = getCookie(VISITOR_KEY) ?? (() => {
        const id = genUUID();
        setCookie(VISITOR_KEY, id);
        return id;
      })();
      recordView(annonceId, visitorId);
    } else if (consent === "no") {
      // Refus enregistré — rien à faire
    } else {
      // Pas encore de décision — affiche la bannière
      setShowBanner(true);
    }
  }, [annonceId]);

  function accept() {
    const visitorId = getCookie(VISITOR_KEY) ?? genUUID();
    setCookie(CONSENT_KEY, "yes");
    setCookie(VISITOR_KEY, visitorId);
    recordView(annonceId, visitorId);
    setShowBanner(false);
  }

  function refuse() {
    setCookie(CONSENT_KEY, "no");
    setShowBanner(false);
  }

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white shadow-lg">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-700">
            <span className="font-medium">Mesure d&apos;audience</span> — Nous utilisons un cookie anonyme pour compter les visiteurs de cette page.
            Aucune donnée personnelle n&apos;est collectée.{" "}
            <span className="text-zinc-400 text-xs">
              (Cookie &laquo;&nbsp;mc_visitor&nbsp;&raquo;, durée 1 an)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refuse}
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Non merci
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
