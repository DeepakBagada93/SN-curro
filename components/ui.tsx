export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a href={compact ? "/brief" : "/"} className="flex items-center gap-2" aria-label="Curro home">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent font-display text-lg text-accent-foreground">C</span>
      <span className="font-display text-xl font-bold tracking-tight">Curro</span>
    </a>
  );
}

export function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.max(4, Math.min(100, Math.round((score / max) * 100)));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`Score ${score} of ${max}`}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: string; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>{icon}</div>
      <h3 className="h-display mt-4 text-lg">{title}</h3>
      <p className="prose-muted mt-1 max-w-md text-sm">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 font-display text-sm font-bold text-accent" aria-hidden>{n}</span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <div className="prose-muted mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}
