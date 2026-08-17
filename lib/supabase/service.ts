import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client avec la clé secrète (secret key) : bypass RLS, réservé aux actions
// admin (création de comptes). Ne jamais importer depuis un composant client.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
