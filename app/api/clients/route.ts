import { NextResponse } from "next/server";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { ClientCreateSchema, uniqueSlug } from "@/lib/clients";
import { DEFAULT_WORKSPACE_ID } from "@/lib/types";

export async function GET() {
  const db = await loadDB();
  const clients = db.clients.map((c) => {
    const knowledge = db.knowledgeItems.filter((k) => k.clientId === c.id);
    return {
      ...c,
      counts: {
        knowledge: knowledge.length,
        approved: knowledge.filter((k) => k.status === "approved").length,
        candidates: knowledge.filter((k) => k.status === "candidate").length,
        planItems: db.planItems.filter((p) => p.clientId === c.id).length
      }
    };
  });
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ClientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid client", issues: parsed.error.flatten() }, { status: 400 });
  }
  const db = await loadDB();
  const t = nowIso();
  const client = {
    id: uid("cl"),
    workspaceId: DEFAULT_WORKSPACE_ID,
    ...parsed.data,
    slug: uniqueSlug(db, parsed.data.name),
    status: "active" as const,
    createdAt: t,
    updatedAt: t
  };
  db.clients.push(client);
  await audit(db, "client.created", "client", client.id);
  await saveDB(db);
  return NextResponse.json({ client }, { status: 201 });
}
