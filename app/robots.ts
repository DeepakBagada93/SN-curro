import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/how-it-works", "/pricing", "/signup", "/signin"], disallow: ["/auth/", "/brief", "/signals/", "/drafts", "/memory", "/settings/", "/studio/", "/planner/", "/calendar/", "/clients/", "/api/"] }], sitemap: "https://curro.in/sitemap.xml" };
}
