import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renomme le middleware en "proxy" (même fonctionnement).
// Vérification optimiste de session : lit le cookie, rafraîchit le token si
// besoin, redirige. Les vérifications d'autorisation "dures" (par rôle) restent
// faites plus près des données (Server Actions + RLS), pas ici.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPath = pathname.startsWith("/login");
  // Doit rester accessible sans session : c'est cette route qui en crée une
  // (verifyOtp) à partir du lien d'invitation/récupération envoyé par email.
  const isAuthConfirmPath = pathname.startsWith("/auth/confirm");
  const isPublicAnnoncePath = pathname.startsWith("/annonce");

  if (!user && !isLoginPath && !isAuthConfirmPath && !isPublicAnnoncePath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
