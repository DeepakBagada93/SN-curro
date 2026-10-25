"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Logo } from "./ui";

export interface NavClient {
  id: string;
  name: string;
  brandColor: string;
  industry: string;
}

export interface NavRecentAsset {
  id: string;
  title: string;
  format: string;
  status: string;
  clientId?: string;
  createdAt: string;
}

const PUBLIC_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" }
];

const WORKSPACE_NAV = [
  { href: "/studio", label: "Studio & Chat", icon: "✎", description: "Chat & draft from knowledge" },
  { href: "/clients", label: "Client Brain", icon: "🧠", description: "Approved facts & memory" },
  { href: "/planner", label: "30-Day Planner", icon: "▥", description: "Monthly editorial roadmap" },
  { href: "/calendar", label: "Publishing Calendar", icon: "▦", description: "Scheduled dispatches" },
  { href: "/images", label: "Brand Images", icon: "◧", description: "AI visual assets" },
  { href: "/analytics", label: "Token Analytics", icon: "◫", description: "Generations & cost tracker" }
];

const SETTINGS_LINKS = [
  { href: "/settings/plan", label: "Plan & usage" },
  { href: "/settings/brand", label: "Brand Brief" },
  { href: "/settings/usage", label: "Usage & costs" },
  { href: "/settings/account", label: "Account" }
];

function isAppPath(p: string) {
  return [
    "/studio",
    "/clients",
    "/planner",
    "/calendar",
    "/images",
    "/analytics",
    "/integrations",
    "/brief",
    "/signals",
    "/drafts",
    "/memory",
    "/settings",
    "/getting-started"
  ].some((s) => p === s || p.startsWith(s + "/"));
}

export function Chrome({
  children,
  profile,
  clients = [],
  recentAssets = []
}: {
  children: React.ReactNode;
  profile?: { name: string; email: string } | null;
  clients?: NavClient[];
  recentAssets?: NavRecentAsset[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [paramClientId, setParamClientId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      setParamClientId(p.get("client"));
    }
  }, [pathname]);

  // Sync collapsed state with localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("curro_sidebar_collapsed");
      if (stored !== null) setCollapsed(stored === "true");
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("curro_sidebar_collapsed", String(next));
    } catch {}
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/review/")) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  // Public Marketing Shell
  if (!isAppPath(pathname)) {
    return (
      <>
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
          <div className="container-x flex h-16 items-center justify-between">
            <Logo />
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex" aria-label="Primary">
              <a className="transition-colors hover:text-foreground font-semibold text-accent" href="/studio">Open Studio</a>
              <a className="transition-colors hover:text-foreground font-semibold text-foreground/80" href="/clients">Clients</a>
              {PUBLIC_LINKS.map((l) => (
                <a key={l.href} className="transition-colors hover:text-foreground" href={l.href}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <a href="/pricing" className="btn btn-outline btn-sm sm:!px-3 sm:!py-1.5 sm:!text-xs">
                Pricing
              </a>
              <a href="/studio" className="btn btn-accent btn-sm sm:!px-4 sm:!py-2 sm:!text-sm">
                Open Studio →
              </a>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border bg-card">
          <div className="container-x grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Logo />
              <p className="prose-muted mt-3 max-w-xs text-xs leading-relaxed">
                The Claude-like knowledge OS for SEO and content agencies. Grounded in approved client facts with traceable claim ledgers.
              </p>
              <div className="mt-4 text-[11px] text-muted-foreground leading-normal space-y-1">
                <p className="font-semibold text-foreground">Curro Technologies</p>
                <p>Moti Palace Compound, Junagadh, Gujarat 362001, India</p>
                <p>Email: <a href="mailto:support@curro.in" className="text-accent hover:underline">support@curro.in</a></p>
                <p>Helpline: +91 94092 11982</p>
              </div>
            </div>
            <nav aria-label="Product">
              <p className="label">Product</p>
              <ul className="space-y-2 text-xs">
                <li><a className="text-muted-foreground hover:text-foreground" href="/how-it-works">How it works</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/pricing">Pricing & Plans (INR)</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/signup">Start 3-Day Free Trial</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/signin">Sign In to Dashboard</a></li>
              </ul>
            </nav>
            <nav aria-label="Platform">
              <p className="label">Platform</p>
              <ul className="space-y-2 text-xs">
                <li><a className="text-muted-foreground hover:text-foreground" href="/studio">AI Studio & Chat</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/clients">Client Brain</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/planner">30-Day Planner</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/calendar">Publishing Calendar</a></li>
              </ul>
            </nav>
            <nav aria-label="Legal & Support">
              <p className="label">Legal & Compliance</p>
              <ul className="space-y-2 text-xs">
                <li><a className="text-muted-foreground hover:text-foreground" href="/contact">Contact Us</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/terms">Terms & Conditions</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/refunds">Refunds & Cancellations</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="/privacy">Privacy Policy</a></li>
              </ul>
            </nav>
          </div>
          <div className="border-t border-border">
            <div className="container-x py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
              <p>© 2026 Curro Technologies. All rights reserved.</p>
              <p className="flex items-center gap-1.5 text-[11px]">
                <span>🔒</span>
                <span>Secured by <strong>Cashfree Payments</strong> · UPI, RuPay, Cards & NetBanking accepted in INR (₹)</span>
              </p>
            </div>
          </div>
        </footer>
      </>
    );
  }

  // Active client detection from search params or first client
  const activeClientId = paramClientId || (clients.length > 0 ? clients[0]?.id : undefined);
  const activeClient = clients.find((c) => c.id === activeClientId) || clients[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground"
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <Logo compact />
        </div>
        <div className="flex items-center gap-2">
          <a href="/studio" className="btn btn-accent btn-sm !py-1 !px-2.5 text-xs">
            + New
          </a>
          {profile && (
            <div className="h-7 w-7 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center text-xs">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Claude-style Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E8E6DF] bg-[#F7F6F2] transition-all duration-200 lg:static lg:z-auto ${
          collapsed ? "lg:w-[68px]" : "lg:w-[264px]"
        } ${mobileOpen ? "w-[280px] translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Claude Workspace Navigation"
      >
        {/* Sidebar Header: Logo & Collapse Button */}
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-[#E8E6DF]/70">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <a href="/studio" className="flex items-center gap-2">
                <span className="font-display font-semibold text-lg tracking-tight text-foreground">Curro</span>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-accent/10 text-accent font-bold px-1.5 py-0.5 rounded-full">
                  Studio
                </span>
              </a>
              <button
                onClick={toggleCollapsed}
                className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#EAE8E1] transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                ◀
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full gap-2">
              <button
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#EAE8E1] transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                ▶
              </button>
            </div>
          )}
        </div>

        {/* Action Button: "+ New Draft / Chat" */}
        <div className="p-3">
          <a
            href="/studio"
            className={`flex items-center justify-center gap-2 rounded-xl bg-card border border-[#DDD9D0] text-foreground font-medium shadow-sm transition-all hover:bg-white hover:border-accent/40 hover:shadow ${
              collapsed ? "h-10 w-10 mx-auto p-0 text-base" : "h-10 w-full px-3 text-sm"
            }`}
            title="Start new draft"
          >
            <span className="text-accent text-base leading-none">＋</span>
            {!collapsed && <span className="font-semibold text-sm">New Draft</span>}
          </a>
        </div>

        {/* Client / Project Selector */}
        {!collapsed && clients.length > 0 && (
          <div className="px-3 pb-2 relative">
            <button
              onClick={() => setClientMenuOpen(!clientMenuOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#E2DFD7] bg-[#ECEAE3] hover:bg-[#E5E3DC] text-xs transition-colors"
              title="Switch Client"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeClient?.brandColor || "#d97706" }}
                />
                <span className="font-semibold truncate text-foreground">
                  {activeClient?.name || "Select Client"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-1">▾</span>
            </button>

            {/* Client Dropdown Popup */}
            {clientMenuOpen && (
              <div className="absolute top-full left-3 right-3 mt-1 z-30 rounded-xl border border-border bg-card p-1 shadow-lg anim-list">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Client Brain
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setClientMenuOpen(false);
                        router.push(`/studio?client=${c.id}`);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        c.id === activeClient?.id
                          ? "bg-accent/10 font-semibold text-accent"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.brandColor }} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{c.industry}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border mt-1 pt-1">
                  <a
                    href="/clients"
                    className="flex items-center justify-center py-1 text-[11px] font-medium text-accent hover:underline"
                  >
                    + Manage & Add Clients
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Navigation / Recent Content */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-1 text-sm">
          {/* Primary Workspace Links */}
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
            )}
            {WORKSPACE_NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 rounded-xl transition-all ${
                    collapsed ? "h-10 w-10 mx-auto justify-center" : "px-3 py-2 text-xs font-medium"
                  } ${
                    active
                      ? "bg-white font-semibold text-foreground shadow-sm border border-[#E0DCD4]"
                      : "text-muted-foreground hover:bg-[#EAE8E1] hover:text-foreground"
                  }`}
                >
                  <span className="text-sm shrink-0" aria-hidden>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </a>
              );
            })}
          </div>

          {/* Recent Drafts / Sessions (Claude Recents Style) */}
          {!collapsed && recentAssets.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#E8E6DF]/70">
              <div className="flex items-center justify-between px-2.5 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Drafts
                </span>
                <a href="/studio" className="text-[10px] text-accent hover:underline">
                  All
                </a>
              </div>
              <div className="space-y-0.5">
                {recentAssets.map((asset) => {
                  const isCurrent = pathname === `/studio/${asset.id}`;
                  return (
                    <a
                      key={asset.id}
                      href={`/studio/${asset.id}`}
                      className={`block px-2.5 py-1.5 rounded-lg text-xs truncate transition-all ${
                        isCurrent
                          ? "bg-white border border-[#E0DCD4] font-medium text-foreground"
                          : "text-muted-foreground hover:bg-[#EAE8E1] hover:text-foreground"
                      }`}
                      title={asset.title}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] opacity-70">📄</span>
                        <span className="truncate">{asset.title}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings Section */}
          {!collapsed && (
            <div className="space-y-0.5 pt-2 border-t border-[#E8E6DF]/70">
              <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Settings
              </p>
              {SETTINGS_LINKS.map((s) => {
                const active = pathname === s.href;
                return (
                  <a
                    key={s.href}
                    href={s.href}
                    className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      active
                        ? "bg-white font-medium text-foreground border border-[#E0DCD4]"
                        : "text-muted-foreground hover:bg-[#EAE8E1] hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer: User Profile & Trial Badge */}
        <div className="p-3 border-t border-[#E8E6DF] bg-[#F3F2EB]">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-accent/25 bg-accent/5 p-2 text-[11px] text-foreground flex items-center justify-between">
                <span className="font-medium flex items-center gap-1">
                  <span>⏳</span> 3-Day Pro Trial
                </span>
                <a href="/pricing" className="text-accent font-semibold hover:underline">
                  Upgrade →
                </a>
              </div>
              {profile && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-accent text-white font-display font-semibold flex items-center justify-center text-xs shrink-0 shadow-sm">
                      {profile.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground leading-tight">{profile.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground leading-tight">{profile.email}</p>
                    </div>
                  </div>
                  <form action={signOut}>
                    <button
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#EAE8E1] text-xs transition-colors"
                      type="submit"
                      title="Sign out"
                    >
                      ⏻
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {profile && (
                <div
                  className="h-8 w-8 rounded-full bg-accent text-white font-display font-semibold flex items-center justify-center text-xs shadow-sm cursor-pointer"
                  title={`${profile.name} (${profile.email})`}
                >
                  {profile.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col bg-background">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
        <footer className="border-t border-border/60 py-4 px-4 sm:px-6 lg:px-8 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <p>© 2026 Curro Technologies · Billed in INR (₹) via Cashfree Payments</p>
          <div className="flex items-center gap-3">
            <a href="/contact" className="hover:text-foreground hover:underline">Contact</a>
            <a href="/terms" className="hover:text-foreground hover:underline">Terms</a>
            <a href="/refunds" className="hover:text-foreground hover:underline">Refunds</a>
            <a href="/privacy" className="hover:text-foreground hover:underline">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
