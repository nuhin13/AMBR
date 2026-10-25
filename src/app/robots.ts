import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const priv = ["/account", "/checkout", "/cart", "/order", "/search", "/login", "/register", "/reset-password", "/forgot-password"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", ...["en", "bn"].flatMap((l) => priv.map((p) => `/${l}${p}`))] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
