"use client";

// Gère le flux implicite de Supabase : tokens passés en hash (#access_token=...&type=invite)
// après un clic sur un lien d'invitation ou de réinitialisation.
// Les fragments # ne sont jamais envoyés au serveur, donc cette page doit être un Client Component.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      router.replace("/login");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(
      ({ error }) => {
        if (error) {
          router.replace("/login");
          return;
        }
        // Invitation ou réinitialisation de mot de passe → choisir un mot de passe
        if (type === "invite" || type === "recovery") {
          router.replace("/set-password");
        } else {
          router.replace("/");
        }
      }
    );
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-zinc-500">Connexion en cours…</p>
    </div>
  );
}
