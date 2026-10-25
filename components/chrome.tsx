"use client";

import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Logo } from "./ui";

const PUBLIC_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" }
];
const APP_LINKS = [
  { href: "/clients", label: "Clients", icon: "▦" },
  { href: "/planner", label: "Planner", icon: "▥" },
  { href: "/studio", label: "Studio", icon: "✎" },
  { href: "/images", label: "Images", icon: "◧" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/analytics", label: "Analytics", icon: "◫" },
  { href: "/integrations", label: "Integrations", icon: "⚯" },
  { href: "/brief", label: "Brief", icon: "◈" },
  { href: "/drafts", label: "Drafts", icon: "✎" },
  { href: "/history", label: "History", icon: "◷" },
  { href: "/memory", label: "Memory", icon: "❖" },
  { href: "/getting-started", label: "Guide", icon: "◎" }
];
const SETTINGS_LINKS = [
  { href: "/settings/plan", label: "Plan & usage" },
  { href: "/settings/brand", label: "Brand Brief" },
  { href: "/settings/usage", label: "Usage & costs" },
  { href: "/settings/account", label: "Account" }
];

function isAppPath(p: string) {
  return ["/clients", "/planner", "/studio", "/images", "/calendar", "/analytics", "/integrations", "/brief", "/signals", "/drafts", "/memory", "/settings", "/getting-started"].some((s) => p === s || p.startsWith(s + "/"));
}

export function Chrome({ children, profile }: { children: React.ReactNode; profile?: { name: string; email: string } | null }) {
  const pathname = usePathname();
  if (pathname.startsWith("/review/")) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }
  if (!isAppPath(pathname)) {
    return (
      <>
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
          <div className="container-x flex h-16 items-center justify-between">
            <Logo />
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex" aria-label="Primary">
              <a className="transition-colors hover:text-foreground font-semibold text-accent" href="/clients">Dashboard</a>
              {PUBLIC_LINKS.map((l) => <a key={l.href} className="transition-colors hover:text-foreground" href={l.href}>{l.label}</a>)}
            </nav>
            <div className="flex items-center gap-2">
              <a href="/pricing" className="btn btn-outline btn-sm sm:!px-3 sm:!py-1.5 sm:!text-xs">Pricing</a>
              <a href="/signup" className="btn btn-accent btn-sm sm:!px-4 sm:!py-2 sm:!text-sm">Start 3-Day Trial →</a>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border">
          <div className="container-x grid gap-10 py-12 md:grid-cols-4">
            <div>
              <Logo />
              <p className="prose-muted mt-3 max-w-xs text-sm">The knowledge OS for SEO and content agencies. Approved client knowledge → plan → claim-checked drafts → client approval → publishing calendar.</p>
            </div>
            <nav aria-label="Product">
              <p className="label">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a className="text-muted-foreground hover:text-foreground" href="/how-it-works">How it works</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/pricing">Pricing</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/signup">Start free in beta</a></li>
              </ul>
            </nav>
            <nav aria-label="Workspace">
              <p className="label">Platform</p>
              <ul className="space-y-2 text-sm">
                <li><a className="text-muted-foreground hover:text-foreground" href="/clients">Client knowledge</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/planner">Planner</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/studio">Studio</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/calendar">Calendar</a></li>
              </ul>
            </nav>
            <div>
              <p className="label">Our promise</p>
              <p className="text-sm text-muted-foreground">No auto-publishing. Unsupported claims block approval. Client review links expire after seven days.</p>
            </div>
          </div>
          <div className="border-t border-border">
            <p className="container-x py-5 text-xs text-muted-foreground">© 2026 Curro · The claim ledger is a review aid, not a truth guarantee.</p>
          </div>
        </footer>
      </>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r" aria-label="Workspace">
        <div className="container-x flex h-16 items-center justify-between lg:justify-start">
          <Logo compact />
        </div>
        <nav className="container-x flex gap-1 overflow-x-auto pb-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:py-4" aria-label="App">
          {APP_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <a key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
                <span aria-hidden>{l.icon}</span>{l.label}
              </a>
            );
          })}
          <p className="label hidden !mb-0 px-3 pb-1 pt-4 lg:block">Settings</p>
          {SETTINGS_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <a key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm transition-colors lg:pl-9 ${active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
                {l.label}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto hidden p-4 lg:block">
          {profile && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{profile.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <form action={signOut}><button className="btn btn-ghost btn-sm shrink-0" type="submit" aria-label="Sign out">⏻</button></form>
            </div>
          )}
          <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            Agency workspace · approved knowledge first. <a href="/clients" className="font-semibold text-accent hover:underline">Manage clients</a>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="border-b border-border bg-accent/5 px-4 py-2 text-xs text-foreground">
          <div className="container-x flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="text-accent">⏳</span> <strong>3-Day Agency Trial Active</strong> — All features unlocked. Keep your client memory safe.
            </span>
            <a href="/pricing" className="font-semibold text-accent hover:underline">
              View Plans & Pricing (from ₹999/mo) →
            </a>
          </div>
        </div>
        <main className="container-x py-6 lg:py-8">{children}</main>
        <p className="container-x pb-8 text-xs text-muted-foreground">Curro · no auto-publishing · unsupported claims block approval.</p>
      </div>
    </div>
  );
}
