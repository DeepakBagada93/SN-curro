"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="alert alert-danger" role="alert">
      <strong>Something failed safely.</strong>
      <p className="mt-1 text-sm text-muted-foreground">Nothing was invented to cover it — the operation stopped instead. {error.digest && <span className="font-mono text-xs">Ref {error.digest}.</span>}</p>
      <button className="btn btn-outline btn-sm mt-3" onClick={reset}>Try again</button>
    </div>
  );
}
