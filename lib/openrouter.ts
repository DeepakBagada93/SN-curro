// Server-only OpenRouter client. Never import from a client component.
// The API key is read from the server environment and never returned in errors.

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const DEFAULT_CHEAP = "nvidia/nemotron-3.5-lightning:free";
const DEFAULT_STRONG = "nvidia/nemotron-3.5-super-vl:free";
const FALLBACK_MODEL: Record<ModelTier, string> = {
  cheap: DEFAULT_CHEAP,
  strong: DEFAULT_STRONG
};

export type ModelTier = "cheap" | "strong";

export function openRouterConfigured(): boolean {
  if (process.env.MODEL_PROVIDER === "mock") return false;
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function modelFor(tier: ModelTier): string {
  return tier === "strong"
    ? (process.env.OPENROUTER_STRONG_MODEL ?? DEFAULT_STRONG)
    : (process.env.OPENROUTER_CHEAP_MODEL ?? DEFAULT_CHEAP);
}

async function attemptChat(input: {
  system: string;
  user: string;
  model: string;
  maxTokens: number;
  temperature: number;
  excludeReasoning: boolean;
}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "Curro Agency Knowledge OS"
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user }
        ],
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        ...(input.excludeReasoning ? { reasoning: { exclude: true } } : {}),
        stream: false
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 240)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }>; reasoning?: string } }>;
      error?: { message?: string };
    };
    if (data.error?.message) throw new Error(`OpenRouter error: ${data.error.message}`);
    const message = data.choices?.[0]?.message;
    const content = message?.content;
    if (typeof content === "string" && content.trim()) return content;
    if (Array.isArray(content)) {
      const text = content.map((c) => c.text ?? "").join("");
      if (text.trim()) return text;
    }
    if (typeof message?.reasoning === "string" && message.reasoning.trim()) {
      const embedded = message.reasoning.match(/\{[\s\S]*\}/)?.[0];
      if (embedded) return embedded;
    }
    throw new Error("OpenRouter returned an empty response.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function chatText(input: {
  system: string;
  user: string;
  tier: ModelTier;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; model: string }> {
  const configured = modelFor(input.tier);
  const fallback = FALLBACK_MODEL[input.tier];
  const maxTokens = input.maxTokens ?? 3000;
  const temperature = input.temperature ?? 0.4;

  // Reasoning models can spend the whole budget thinking and return no content
  // when reasoning is excluded. Try three shapes, then let the caller fall back
  // to the deterministic composer — never leave a request hanging.
  const attempts = [
    { model: configured, excludeReasoning: true },
    { model: configured, excludeReasoning: false },
    ...(configured !== fallback ? [{ model: fallback, excludeReasoning: false }] : [])
  ];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const text = await attemptChat({ system: input.system, user: input.user, maxTokens, temperature, ...attempt });
      return { text, model: attempt.model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("OpenRouter request failed.");
}

export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("Model response did not contain a JSON object.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}
