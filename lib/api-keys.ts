import { createHash, randomBytes } from "crypto";
import type { DB } from "./store";
import type { ApiKey } from "./types";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { plaintext: string; prefix: string; keyHash: string } {
  const secret = randomBytes(24).toString("base64url");
  const plaintext = `cos_${secret}`;
  return { plaintext, prefix: plaintext.slice(0, 12), keyHash: hashApiKey(plaintext) };
}

export function authenticateApiKey(req: Request, db: DB): { key: ApiKey } | null {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(cos_[A-Za-z0-9_-]+)$/);
  if (!match) return null;
  const hash = hashApiKey(match[1]);
  const key = db.apiKeys.find((k) => k.keyHash === hash && !k.revokedAt);
  return key ? { key } : null;
}

export function mcpManifest(baseUrl: string) {
  return {
    name: "curro-knowledge-os",
    version: "1.0.0",
    description: "Search and write client knowledge, then create approved content assets.",
    transport: { type: "http", url: `${baseUrl}/api/mcp` },
    auth: { type: "bearer", description: "Create an API key in Integrations → API keys." },
    tools: [
      {
        name: "search_knowledge",
        description: "Search approved knowledge for one client. Returns titled citations.",
        inputSchema: {
          type: "object",
          required: ["clientId", "query"],
          properties: { clientId: { type: "string" }, query: { type: "string" }, kind: { type: "string" } }
        }
      },
      {
        name: "add_knowledge",
        description: "Add a candidate or approved knowledge item for a client.",
        inputSchema: {
          type: "object",
          required: ["clientId", "kind", "title", "body"],
          properties: {
            clientId: { type: "string" },
            kind: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            status: { type: "string", enum: ["candidate", "approved"] }
          }
        }
      },
      {
        name: "list_clients",
        description: "List clients in the workspace with knowledge counts.",
        inputSchema: { type: "object", properties: {} }
      }
    ]
  };
}
