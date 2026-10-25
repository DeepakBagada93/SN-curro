import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Chrome } from "@/components/chrome";
import { sessionProfile } from "@/lib/auth";
import { loadDB } from "@/lib/store";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://curro.in"),
  title: { default: "Curro — the Agency Knowledge OS", template: "%s · Curro" },
  description: "Approved client knowledge, month planning, claim-checked LinkedIn posts, X threads, reel scripts and SEO articles, client review links and a publishing calendar. Built for SEO and content agencies.",
  openGraph: { title: "Curro — the Agency Knowledge OS", description: "One approved knowledge brain per client. Plan, draft, check every claim, get client approval and publish — in one workspace.", type: "website" }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await sessionProfile().catch(() => null);
  const db = await loadDB().catch(() => null);
  const clients = (db?.clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    brandColor: c.brandColor,
    industry: c.industry
  }));
  const recentAssets = (db?.assets ?? [])
    .slice(-8)
    .reverse()
    .map((a) => ({
      id: a.id,
      title: a.title ?? "Untitled draft",
      format: a.format ?? "linkedin_post",
      status: a.status,
      clientId: a.clientId,
      createdAt: a.createdAt
    }));

  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <Chrome profile={profile} clients={clients} recentAssets={recentAssets}>
          {children}
        </Chrome>
      </body>
    </html>
  );
}
