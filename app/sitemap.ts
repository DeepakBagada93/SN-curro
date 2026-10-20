import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://curro.example.com";
  const pages = ["", "/how-it-works", "/pricing", "/signup", "/signin"];
  return pages.map((p) => ({ url: base + (p || "/"), lastModified: new Date(), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));
}
