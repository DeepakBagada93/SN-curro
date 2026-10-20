import { NextResponse } from "next/server";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { authenticateApiKey, mcpManifest } from "@/lib/api-keys";
import { KNOWLEDGE_KINDS, KNOWLEDGE_KIND_LABELS, knowledgeStats } from "@/lib/clients";
import type { KnowledgeKind } from "@/lib/types";

export const dynamic = "force-dynamic";

function rpc(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status: 200 });
}

function textResult(text: string) {
  return { content: [{ type: "text", text }] };
}

export async function GET(req: Request) {
  const db = await loadDB();
  const auth = authenticateApiKey(req, db);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(mcpManifest(new URL(req.url).origin));
}

export async function POST(req: Request) {
  const db = await loadDB();
  const auth = authenticateApiKey(req, db);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = auth.key;
  key.lastUsedAt = nowIso();
  await saveDB(db);

  let body: { id?: unknown; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };
  try {
    body = await req.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  if (body.method === "initialize") {
    return rpc(body.id, {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "curro-knowledge-os", version: "1.0.0" },
      capabilities: { tools: {} }
    });
  }

  const manifest = mcpManifest(new URL(req.url).origin);
  if (body.method === "tools/list") return rpc(body.id, { tools: manifest.tools });

  if (body.method === "tools/call") {
    const name = body.params?.name;
    const args = body.params?.arguments ?? {};
    const requestedClient = typeof args.clientId === "string" ? args.clientId : null;
    if (key.clientId && requestedClient && requestedClient !== key.clientId) {
      return rpcError(body.id, -32602, "This API key is scoped to a different client.");
    }
    const clientId = key.clientId ?? requestedClient;

    if (name === "list_clients") {
      const clients = db.clients.filter((c) => !key.clientId || c.id === key.clientId);
      const rows = clients.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        knowledge: knowledgeStats(db.knowledgeItems.filter((k) => k.clientId === c.id))
      }));
      return rpc(body.id, textResult(JSON.stringify(rows, null, 2)));
    }

    if (name === "search_knowledge") {
      if (!clientId) return rpcError(body.id, -32602, "clientId is required.");
      if (!db.clients.some((c) => c.id === clientId)) return rpcError(body.id, -32602, "Unknown clientId.");
      const query = String(args.query ?? "").trim().toLowerCase();
      const kind = typeof args.kind === "string" ? args.kind : "";
      if (query.length < 2) return rpcError(body.id, -32602, "query must be at least 2 characters.");
      const hits = db.knowledgeItems
        .filter((k) => k.clientId === clientId && k.status === "approved")
        .filter((k) => !kind || k.kind === kind)
        .filter((k) => `${k.title} ${k.body} ${k.tags.join(" ")}`.toLowerCase().includes(query))
        .slice(0, 10)
        .map((k) => ({
          id: k.id,
          title: k.title,
          kind: k.kind,
          body: k.body.slice(0, 1400),
          sourceUrl: k.sourceUrl,
          tags: k.tags,
          approvedAt: k.approvedAt
        }));
      return rpc(body.id, textResult(JSON.stringify({ count: hits.length, items: hits }, null, 2)));
    }

    if (name === "add_knowledge") {
      if (!clientId) return rpcError(body.id, -32602, "clientId is required.");
      const client = db.clients.find((c) => c.id === clientId);
      if (!client) return rpcError(body.id, -32602, "Unknown clientId.");
      const kind = String(args.kind ?? "");
      if (!(KNOWLEDGE_KINDS as readonly string[]).includes(kind)) {
        return rpcError(body.id, -32602, `kind must be one of ${KNOWLEDGE_KINDS.join(", ")}.`);
      }
      const title = String(args.title ?? "").trim().slice(0, 200);
      const text = String(args.body ?? "").trim().slice(0, 20000);
      if (title.length < 3 || text.length < 20) return rpcError(body.id, -32602, "title and body are required.");
      const status = args.status === "approved" ? "approved" : "candidate";
      const t = nowIso();
      const item = {
        id: uid("kn"),
        workspaceId: client.workspaceId,
        clientId: client.id,
        kind: kind as KnowledgeKind,
        title,
        body: text,
        sourceUrl: typeof args.sourceUrl === "string" ? args.sourceUrl.slice(0, 500) : null,
        status: status as "approved" | "candidate",
        provenance: "MCP agent",
        tags: Array.isArray(args.tags) ? args.tags.map((t) => String(t).slice(0, 40)).slice(0, 8) : [],
        createdAt: t,
        updatedAt: t,
        approvedAt: status === "approved" ? t : null
      };
      db.knowledgeItems.push(item);
      await audit(db, "mcp.knowledge.added", "knowledge_item", item.id, `api:${key.name}`);
      await saveDB(db);
      return rpc(body.id, textResult(JSON.stringify({ id: item.id, status: item.status, kindLabel: KNOWLEDGE_KIND_LABELS[item.kind] }, null, 2)));
    }

    return rpcError(body.id, -32601, `Unknown tool: ${name ?? "(none)"}`);
  }

  return rpcError(body.id, -32601, `Unknown method: ${body.method ?? "(none)"}`);
}
