import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@certibuy/integrations/supabase/middleware";
import { checkRateLimit } from "@/lib/rate-limit";

const PUBLIC_PATHS = ["/login", "/register", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";

    const isCommand = pathname.startsWith("/api/v1/commands/");
    const limit = isCommand ? 20 : 60;
    const key = `${ip}:${isCommand ? "cmd" : "view"}`;

    const result = checkRateLimit(key, limit, 60_000);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfter) },
        },
      );
    }

    const response = NextResponse.next({ request });
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    return response;
  }

  // Auth redirect for page routes
  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request.cookies, response.cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && PUBLIC_PATHS.some((p) => pathname.startsWith(p)) && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
