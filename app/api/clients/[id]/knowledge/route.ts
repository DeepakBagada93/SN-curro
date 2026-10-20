import { NextResponse } from "next/server";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { KnowledgeCreateSchema } from "@/lib/clients";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === params.id);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const items = db.knowledgeItems.filter((k) => k.clientId === client.id);
  return NextResponse.json({ client, knowledgeItems: items });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = KnowledgeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid knowledge item", issues: parsed.error.flatten() }, { status: 400 });
  }
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === params.id);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const t = nowIso();
  const item = {
    id: uid("kn"),
    workspaceId: client.workspaceId,
    clientId: client.id,
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body,
    sourceUrl: parsed.data.sourceUrl || null,
    status: parsed.data.status,
    provenance: parsed.data.provenance,
    tags: parsed.data.tags,
    createdAt: t,
    updatedAt: t,
    approvedAt: parsed.data.status === "approved" ? t : null
  };
  db.knowledgeItems.push(item);
  await audit(db, "knowledge.created", "knowledge_item", item.id);
  await saveDB(db);
  return NextResponse.json({ knowledgeItem: item }, { status: 201 });
}
