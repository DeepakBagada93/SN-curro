import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Chrome } from "@/components/chrome";
import { sessionProfile } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://curro.example.com"),
  title: { default: "Curro — the Agency Knowledge OS", template: "%s · Curro" },
  description: "Approved client knowledge, month planning, claim-checked LinkedIn posts, X threads, reel scripts and SEO articles, client review links and a publishing calendar. Built for SEO and content agencies.",
  openGraph: { title: "Curro — the Agency Knowledge OS", description: "One approved knowledge brain per client. Plan, draft, check every claim, get client approval and publish — in one workspace.", type: "website" }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await sessionProfile().catch(() => null);
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <Chrome profile={profile}>{children}</Chrome>
      </body>
    </html>
  );
}
