import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "@/i18n/config";

/**
 * Locale routing for the storefront.
 * - /en/... and /bn/... pass through; the locale is remembered in a cookie and forwarded
 *   to Server Actions via a request header.
 * - Any un-prefixed storefront URL (including every pre-i18n link like /shop or /product/x)
 *   redirects to the visitor's language: cookie → Accept-Language → English.
 * Admin, API, Next internals and static files are excluded by the matcher.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, first);
    const res = NextResponse.next({ request: { headers } });
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url, 307);
}

function preferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = request.headers.get("accept-language") ?? "";
  // Pick the first listed language we support (q-values in practice follow list order).
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (isLocale(tag)) return tag;
  }
  return DEFAULT_LOCALE;
}

export const config = {
  matcher: [
    "/((?!api|admin|_next|_vercel|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|icon|apple-icon|brand|images|uploads|.*\\..*).*)",
  ],
};
