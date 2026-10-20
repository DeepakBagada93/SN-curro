import { NextResponse } from "next/server";
import { loadDB, saveDB, audit } from "@/lib/store";

export async function GET() {
  const db = await loadDB();
  return NextResponse.json({ brandBrief: db.brandBrief });
}
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const db = await loadDB();
  if (!db.brandBrief) return NextResponse.json({ error: "no brief" }, { status: 404 });
  db.brandBrief = { ...db.brandBrief, ...body, workspaceId: db.brandBrief.workspaceId, updatedAt: new Date().toISOString() };
  await audit(db, "brand.updated", "brand", "current");
  await saveDB(db);
  return NextResponse.json({ brandBrief: db.brandBrief });
}
