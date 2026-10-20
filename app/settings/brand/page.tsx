import { loadDB } from "@/lib/store";
export const dynamic = "force-dynamic";

async function saveBrand(formData: FormData) {
  "use server";
  const { loadDB: l, saveDB, audit, nowIso } = await import("@/lib/store");
  const db = await l();
  const get = (k: string) => String(formData.get(k) ?? "").slice(0, 2000);
  db.brandBrief = {
    workspaceId: "ws_curro_beta",
    audience: get("audience"), product: get("product"), category: get("category"),
    expertise: get("expertise"), voiceExamples: get("voice").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10),
    themes: get("themes").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5),
    exclusions: get("exclusions"), competitors: get("competitors"), restrictedClaims: get("restricted"),
    updatedAt: nowIso()
  };
  await audit(db, "brand.updated", "brand", "current");
  await saveDB(db);
}

export default async function BrandPage() {
  const db = await loadDB();
  const b = db.brandBrief;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">Brand Brief</h1>
        <p className="prose-muted mt-1 text-sm">The lens every brief is scored through. Saved as a snapshot into each research run — editing here never rewrites history.</p>
      </div>
      <form action={saveBrand} className="card grid gap-4 md:grid-cols-2">
        <div><label className="label" htmlFor="b-audience">Audience — who buys</label><input id="b-audience" name="audience" className="input" defaultValue={b?.audience ?? ""} placeholder="B2B SaaS founders doing founder-led content" /></div>
        <div><label className="label" htmlFor="b-product">Product — what you sell</label><input id="b-product" name="product" className="input" defaultValue={b?.product ?? ""} placeholder="One line, buyer language" /></div>
        <div><label className="label" htmlFor="b-category">Category</label><input id="b-category" name="category" className="input" defaultValue={b?.category ?? ""} placeholder="e.g. Founder-led marketing" /></div>
        <div><label className="label" htmlFor="b-expertise">Expertise — what you can credibly claim</label><input id="b-expertise" name="expertise" className="input" defaultValue={b?.expertise ?? ""} placeholder="e.g. B2B positioning, evidence-led writing" /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="b-themes">Market themes — comma-separated, max 5</label><input id="b-themes" name="themes" className="input" defaultValue={(b?.themes ?? []).join(", ")} placeholder="founder-led marketing, AI SDR tools, LinkedIn organic reach" /><p className="mt-1 text-xs text-muted-foreground">These become the search objectives for every manual run.</p></div>
        <div><label className="label" htmlFor="b-competitors">Competitors to be fair about</label><input id="b-competitors" name="competitors" className="input" defaultValue={b?.competitors ?? ""} placeholder="Names you refuse to strawman" /></div>
        <div><label className="label" htmlFor="b-exclusions">Exclusions — never cover</label><input id="b-exclusions" name="exclusions" className="input" defaultValue={b?.exclusions ?? ""} placeholder="e.g. engagement pods, scraped data" /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="b-voice">Voice examples — one per line, 3–10</label><textarea id="b-voice" name="voice" className="input min-h-[90px]" defaultValue={(b?.voiceExamples ?? []).join("\n")} placeholder={"Short sentences. No hype. Name the evidence."} /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="b-restricted">Restricted claims — never assert</label><input id="b-restricted" name="restricted" className="input" defaultValue={b?.restrictedClaims ?? ""} placeholder="e.g. No virality promises, no revenue figures without a source" /></div>
        <div className="md:col-span-2"><button className="btn btn-accent" type="submit">Save Brand Brief</button></div>
      </form>
    </div>
  );
}
