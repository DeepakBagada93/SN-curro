import { NextResponse } from "next/server";
import { loadDB } from "@/lib/store";

// GET /api/export/draft/[id] — LinkedIn-ready markdown download (#50).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === params.id);
  if (!asset) return NextResponse.json({ error: "not found" }, { status: 404 });
  const versions = db.versions.filter((v) => v.assetId === asset.id).sort((a, b) => b.version - a.version);
  const current = versions[0];
  if (!current) return NextResponse.json({ error: "no versions" }, { status: 404 });
  const signal = db.signals.find((s) => s.id === asset.signalCardId);
  const claims = db.claims.filter((c) => c.versionId === current.id);
  const sources = db.sources.filter((s) => current.sourceIds.includes(s.id));

  const md = [
    `# LinkedIn draft — v${current.version} (${asset.status.replace("_", " ")})`,
    ``,
    signal ? `> Signal: ${signal.title}` : ``,
    ``,
    current.body,
    ``,
    `---`,
    `## Claim ledger (private — do not publish)`,
    ...claims.map((c) => `- [${c.kind}/${c.reviewStatus}] ${c.claim}${c.reviewNote ? ` — ${c.reviewNote}` : ""}`),
    ``,
    `## Sources`,
    ...sources.map((s) => `- [${s.title}](${s.canonicalUrl}) — ${s.publisher}, retrieved ${s.retrievedAt.slice(0, 10)}`),
    ``,
    `_Exported from Curro · ${new Date().toISOString().slice(0, 10)} · Review aid, not truth guarantee._`,
    ``
  ].filter((l) => l !== null).join("\n");

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="curro-draft-v${current.version}.md"`
    }
  });
}
