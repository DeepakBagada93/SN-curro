import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/how-it-works", "/pricing", "/signup", "/signin"], disallow: ["/brief", "/signals/", "/drafts", "/memory", "/settings/", "/api/"] }], sitemap: "https://curro.example.com/sitemap.xml" };
}
