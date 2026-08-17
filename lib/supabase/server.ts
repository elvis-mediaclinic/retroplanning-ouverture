import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Un nouveau client par requête, jamais partagé entre requêtes (cf. doc @supabase/ssr).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component (cookie store non mutable) :
            // proxy.ts se charge du rafraîchissement de session, donc on ignore.
          }
        },
      },
    }
  );
}
