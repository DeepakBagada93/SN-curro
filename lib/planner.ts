import type { Channel, Client, KnowledgeItem, PlanItemStatus } from "./types";
import { KNOWLEDGE_KIND_LABELS } from "./clients";
import { dateInMonth } from "./agency";

export interface CalendarDraft {
  channel: Channel;
  title: string;
  pillar: string;
  publishDate: string;
  owner: string;
  status: PlanItemStatus;
  notes: string;
}

const SLOT_DAYS = [3, 6, 10, 14, 17, 21, 24, 28];
const SLOT_CHANNELS: Channel[] = ["linkedin", "x", "blog", "instagram", "linkedin", "x", "blog", "instagram"];

function titleFor(channel: Channel, item: KnowledgeItem): string {
  switch (channel) {
    case "linkedin":
      return `The question behind ${item.title.toLowerCase()}`;
    case "blog":
      return `${item.title}: the practical guide`;
    case "x":
      return `Three things to know about ${item.title.toLowerCase()}`;
    case "instagram":
      return `Reel: ${item.title} in 30 seconds`;
    case "newsletter":
      return `${item.title} — what changed this month`;
    default:
      return item.title;
  }
}

// Deterministic 30-day calendar skeleton. Every item is grounded in an
// approved knowledge item; the agency still edits/reviews before generation.
export function buildCalendarDrafts(client: Client, knowledge: KnowledgeItem[], month: string): CalendarDraft[] {
  const approved = knowledge.filter((k) => k.status === "approved" && k.clientId === client.id);
  if (approved.length === 0) return [];
  return SLOT_DAYS.map((day, i) => {
    const item = approved[i % approved.length];
    const channel = SLOT_CHANNELS[i % SLOT_CHANNELS.length];
    return {
      channel,
      title: titleFor(channel, item).slice(0, 200),
      pillar: (item.tags[0] ?? KNOWLEDGE_KIND_LABELS[item.kind]).slice(0, 80),
      publishDate: dateInMonth(month, day),
      owner: "Unassigned",
      status: "idea" as const,
      notes: `Grounded in approved knowledge: ${item.title}`
    };
  });
}
