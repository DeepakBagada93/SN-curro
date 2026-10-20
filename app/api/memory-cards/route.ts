import { NextResponse } from "next/server";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";

export async function GET() {
  const db = await loadDB();
  return NextResponse.json({ memoryCards: db.memoryCards });
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.body || typeof body.body !== "string" || body.body.length < 5)
    return NextResponse.json({ error: "body too short" }, { status: 400 });
  const db = await loadDB();
  const card = { id: uid("mem"), workspaceId: "ws_curro_beta", kind: (body.kind ?? "fact") as never, body: String(body.body).slice(0, 600), status: "candidate" as const, provenance: String(body.provenance ?? "API entry"), createdAt: nowIso(), approvedAt: null };
  db.memoryCards.push(card);
  await audit(db, "memory.created", "memory", card.id);
  await saveDB(db);
  return NextResponse.json({ memoryCard: card }, { status: 201 });
}
