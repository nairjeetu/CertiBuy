import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

interface CookieJar {
  getAll(): { name: string; value: string }[];
  set(...args: [string, string, ...unknown[]] | [unknown]): unknown;
}

export function createSupabaseMiddlewareClient(
  requestCookies: CookieJar,
  responseCookies: CookieJar,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return requestCookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          for (const { name, value, options } of cookiesToSet) {
            requestCookies.set(name, value);
            responseCookies.set(name, value, options);
          }
        },
      },
    },
  );
}
