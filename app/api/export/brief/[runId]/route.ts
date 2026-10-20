import { NextResponse } from "next/server";
import { loadDB } from "@/lib/store";

// GET /api/export/brief/[runId] — markdown brief pack (#51).
export async function GET(_req: Request, { params }: { params: { runId: string } }) {
  const db = await loadDB();
  const run = db.runs.find((r) => r.id === params.runId);
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  const signals = db.signals.filter((s) => s.runId === run.id);

  const lines = [
    `# Founder Signal Brief — ${run.createdAt.slice(0, 10)}`,
    ``,
    `Run ${run.id.slice(-6)} · ${run.status} · themes: ${run.themes.join(", ")}`,
    `Cost ~$${run.usage.estCostUsd.toFixed(3)} · ${run.usage.results} results`,
    ``
  ];
  for (const [i, s] of signals.entries()) {
    const srcs = db.sources.filter((x) => s.sourceIds.includes(x.id));
    const angle = db.angles.find((a) => a.signalCardId === s.id);
    lines.push(`## ${i + 1}. ${s.title}`, ``, `${s.whyNow}`, ``, `_${s.relevance}_`, ``);
    lines.push(`**Sources:**`);
    for (const src of srcs) lines.push(`- [${src.title}](${src.canonicalUrl}) — ${src.publisher}`);
    lines.push(``, angle ? `**Founder angle:** ${angle.body}` : `**Founder angle:** _none yet_`, ``);
  }
  lines.push(`_Exported from Curro · Review aid, not truth guarantee._`, ``);

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="curro-brief-${run.createdAt.slice(0, 10)}.md"`
    }
  });
}
