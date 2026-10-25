import { NextResponse } from "next/server";
import { executeAgentPrompt } from "@/lib/agent-engine";
import type { AssetFormat } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt || "").trim();
    const clientId = String(body.clientId || "").trim();
    const format = body.format as AssetFormat | undefined;

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Prompt is required" }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ ok: false, error: "Client ID is required" }, { status: 400 });
    }

    const result = await executeAgentPrompt({
      prompt,
      clientId,
      explicitFormat: format
    });

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute agent prompt";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
