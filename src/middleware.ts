import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Allow static files, api routes, and public auth assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // 1. Primary authentication check: PostgreSQL session cookies
  const hasSessionCookie =
    request.cookies.has("bytbuild_session") || request.cookies.has("buildflow_session");

  let isAuthenticated = hasSessionCookie;

  // 2. Optional Supabase Auth fallback (only if valid anon public key is configured)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("[YOUR-PROJECT-REF]") &&
    !supabaseUrl.includes("your-project") &&
    !supabaseKey.includes("your-anon") &&
    !supabaseKey.includes("[YOUR-ANON") &&
    supabaseKey.length > 30 &&
    supabaseUrl.startsWith("http")
  );

  if (!isAuthenticated && isSupabaseConfigured) {
    try {
      const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        isAuthenticated = true;
      }
    } catch {
      // In case of network / URL issues, fall back cleanly
    }
  }

  // If on login page and already authenticated, redirect to dashboard
  if (pathname === "/login") {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // If trying to access protected routes without authentication, force login!
  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
