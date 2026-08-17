import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Reçoit les liens d'invitation/réinitialisation envoyés par Supabase Auth.
// Le template email doit pointer vers :
// {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      if (type === "invite" || type === "recovery") {
        redirect("/set-password");
      }
      redirect("/");
    }
  }

  redirect("/login");
}
