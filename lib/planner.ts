import { z } from "zod";
import type { Channel, Client, KnowledgeItem, MemoryCard, PlanItemStatus } from "./types";
import { KNOWLEDGE_KIND_LABELS } from "./clients";
import { dateInMonth } from "./agency";
import { chatText, extractJson, openRouterConfigured } from "./openrouter";

export interface CalendarDraft {
  channel: Channel;
  title: string;
  pillar: string;
  publishDate: string;
  owner: string;
  status: PlanItemStatus;
  notes: string;
}

export interface CalendarPlannerInput {
  client: Client;
  knowledge: KnowledgeItem[];
  memory?: MemoryCard[];
  month: string;
}

const CADENCE_SCHEDULE: Array<{ day: number; channel: Channel }> = [
  { day: 2, channel: "linkedin" },
  { day: 5, channel: "x" },
  { day: 8, channel: "blog" },
  { day: 11, channel: "instagram" },
  { day: 14, channel: "linkedin" },
  { day: 16, channel: "newsletter" },
  { day: 19, channel: "x" },
  { day: 22, channel: "blog" },
  { day: 25, channel: "instagram" },
  { day: 27, channel: "linkedin" },
  { day: 29, channel: "x" }
];

function titleForChannel(channel: Channel, item: KnowledgeItem, index: number): string {
  const t = item.title.toLowerCase();
  switch (channel) {
    case "linkedin":
      return index % 2 === 0
        ? `Why most teams get ${t} backwards (and what works)`
        : `The framework behind ${t}: what we learned`;
    case "blog":
      return `${item.title}: The Definitive Architecture & Implementation Guide`;
    case "x":
      return index % 2 === 0
        ? `Breakdown: 4 counter-intuitive realities of ${t} 🧵`
        : `How top teams approach ${t} in production (step-by-step)`;
    case "instagram":
      return `Reel: ${item.title} explained in 30 seconds`;
    case "newsletter":
      return `Monthly Dispatch: The reality of ${t} — founder notes`;
    default:
      return item.title;
  }
}

// Deterministic 30-day calendar plan grounded in approved brain & memory
export function buildCalendarDrafts(
  client: Client,
  knowledge: KnowledgeItem[],
  month: string,
  memory: MemoryCard[] = []
): CalendarDraft[] {
  const approved = knowledge.filter((k) => k.status === "approved" && k.clientId === client.id);
  if (approved.length === 0) return [];

  const approvedMem = memory.filter((m) => m.status === "approved");
  const defaultMem = approvedMem.find((m) => m.kind === "opinion")?.body ?? "Ground decisions in verified reality over hype.";

  return CADENCE_SCHEDULE.map((slot, i) => {
    const item = approved[i % approved.length];
    const pillar = item.tags[0] ?? KNOWLEDGE_KIND_LABELS[item.kind] ?? "Strategy";
    const memOpinion = approvedMem[i % (approvedMem.length || 1)]?.body ?? defaultMem;

    return {
      channel: slot.channel,
      title: titleForChannel(slot.channel, item, i).slice(0, 200),
      pillar: pillar.slice(0, 80),
      publishDate: dateInMonth(month, slot.day),
      owner: "Unassigned",
      status: "idea" as const,
      notes: `Grounded in approved knowledge: ${item.title}. Memory POV: "${memOpinion.slice(0, 80)}". Platform: ${slot.channel} cadence.`
    };
  });
}

const AiPlanSchema = z.array(
  z.object({
    channel: z.enum(["linkedin", "x", "blog", "newsletter", "instagram"]),
    title: z.string().min(5).max(200),
    pillar: z.string().min(2).max(80),
    day: z.number().int().min(1).max(31),
    notes: z.string().min(10).max(600)
  })
);

export async function generateCalendarPlan(input: CalendarPlannerInput): Promise<CalendarDraft[]> {
  const { client, knowledge, memory = [], month } = input;
  const approved = knowledge.filter((k) => k.status === "approved" && k.clientId === client.id);
  if (approved.length === 0) return [];

  const fallback = buildCalendarDrafts(client, knowledge, month, memory);

  if (!openRouterConfigured()) {
    return fallback;
  }

  try {
    const knowledgeList = approved
      .map((k) => `- [${k.id}] (${k.kind}): ${k.title} — ${k.body.slice(0, 300)}`)
      .join("\n");
    const memoryList = memory
      .filter((m) => m.status === "approved")
      .map((m) => `- (${m.kind}): ${m.body.slice(0, 200)}`)
      .join("\n");

    const { text } = await chatText({
      tier: "strong",
      maxTokens: 2500,
      temperature: 0.4,
      system: [
        "You are an agency content director planning a high-converting 30-day multi-channel editorial calendar.",
        "Ground every single plan item in the client's approved knowledge brain and approved founder memory.",
        "Distribute items across channels: 'linkedin', 'x', 'blog', 'newsletter', 'instagram'.",
        "Generate 10 to 12 scheduled posts spread evenly throughout the month (days 2 to 30).",
        "Titles must be compelling, platform-native, and avoid generic AI filler words.",
        "In notes, you MUST include 'Grounded in approved knowledge: [Item Title]' and explain the specific hook angle.",
        "Return ONLY a JSON array with objects matching: { channel, title, pillar, day (1-31), notes }. No markdown fences."
      ].join(" "),
      user: [
        `CLIENT: ${client.name}`,
        `AUDIENCE: ${client.audience || "Industry professionals"}`,
        `TONE: ${client.tone || "Authoritative, practical"}`,
        `MONTH: ${month}`,
        "",
        "APPROVED KNOWLEDGE BRAIN:",
        knowledgeList,
        "",
        memoryList ? `FOUNDER MEMORY RULES & OPINIONS:\n${memoryList}` : ""
      ].filter(Boolean).join("\n")
    });

    const parsed = AiPlanSchema.parse(extractJson(text));
    if (parsed.length > 0) {
      return parsed.map((item) => ({
        channel: item.channel,
        title: item.title.trim().slice(0, 200),
        pillar: item.pillar.trim().slice(0, 80),
        publishDate: dateInMonth(month, Math.min(Math.max(item.day, 1), 28)),
        owner: "Unassigned",
        status: "idea" as const,
        notes: item.notes.includes("approved knowledge")
          ? item.notes.slice(0, 600)
          : `Grounded in approved knowledge: ${item.notes.slice(0, 500)}`
      }));
    }
  } catch (error) {
    console.warn(`[planner] AI calendar generation failed, using deterministic planner:`, error);
  }

  return fallback;
}
