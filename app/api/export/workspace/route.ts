import { NextResponse } from "next/server";
import { loadDB } from "@/lib/store";

// GET /api/export/workspace — full JSON portability dump (#52).
// Password hash redacted: portability covers content, never credentials.
export async function GET() {
  const db = await loadDB();
  const { profile, ...rest } = db;
  const dump = {
    exportedAt: new Date().toISOString(),
    workspace: db.brandBrief?.workspaceId ?? "ws_curro_beta",
    owner: profile ? { name: profile.name, email: profile.email, createdAt: profile.createdAt } : null,
    ...rest
  };
  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="curro-workspace-export.json"`
    }
  });
}
