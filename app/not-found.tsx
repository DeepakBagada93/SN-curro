export default function NotFound() {
  return (
    <div className="container-x max-w-xl py-24 text-center">
      <p className="font-display text-7xl font-semibold text-muted-foreground">404</p>
      <h1 className="h-display mt-4 text-3xl">This signal doesn&apos;t exist.</h1>
      <p className="prose-muted mt-2">The page moved, was archived, or never had evidence behind it. Start from a cited source instead:</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/brief" className="btn btn-accent">This week&apos;s brief</a>
        <a href="/" className="btn btn-outline">Homepage</a>
      </div>
    </div>
  );
}
