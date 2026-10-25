import type { AssetFormat, ClaimKind, Client, KnowledgeItem, MemoryCard } from "./types";
import { formatChannel, formatLabel } from "./agency";
import { auditDraftForQuality } from "./platform-guidelines";

export interface GeneratedClaim {
  text: string;
  kind: ClaimKind;
  sourceIds: string[];
  reviewNote: string | null;
}

export interface GeneratedStudioDraft {
  title: string;
  body: string;
  claims: GeneratedClaim[];
  qualityFlags: string[];
  promptTemplate: string;
}

function firstSentence(text: string, max = 190): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const cut = clean.match(/^(.{20,}?[.!?])(\s|$)/)?.[1] ?? clean;
  return cut.length > max ? `${cut.slice(0, max - 1)}…` : cut;
}

function hashtags(items: KnowledgeItem[]): string {
  const tags = Array.from(new Set(items.flatMap((i) => i.tags))).slice(0, 4);
  return tags.map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, "")}`).join(" ");
}

function opinionLine(client: Client, brief: string, memory?: MemoryCard[]): string {
  if (brief.trim()) return brief.trim();
  const memOpinion = memory?.find((m) => m.status === "approved" && m.kind === "opinion")?.body;
  if (memOpinion?.trim()) return memOpinion.trim();
  if (client.summary.trim()) return client.summary.trim();
  return `Our view: the decision is easier when the format fits the life around it.`;
}

export function generateStudioDraft(input: {
  client: Client;
  knowledge: KnowledgeItem[];
  memory?: MemoryCard[];
  format: AssetFormat;
  title?: string;
  brief?: string;
}): GeneratedStudioDraft {
  const { client, knowledge, memory, format } = input;
  const brief = (input.brief ?? "").slice(0, 600);
  const pick = knowledge.slice(0, 3);
  if (pick.length === 0) throw new Error("At least one approved knowledge item is required.");

  const label = formatLabel(format);
  const title = (input.title?.trim() || `${pick[0].title} — ${label}`).slice(0, 200);
  const facts = pick.map((k) => firstSentence(k.body));
  const sourceLines = pick.map((k) => `${k.title}${k.sourceUrl ? ` — ${k.sourceUrl}` : ""}`);
  const view = opinionLine(client, brief, memory);

  const claims: GeneratedClaim[] = pick.map((k, i) => ({
    text: facts[i],
    kind: "factual" as const,
    sourceIds: [k.id],
    reviewNote: `From approved ${k.kind.replace("_", " ")}: ${k.title}.`
  }));
  claims.push({
    text: view,
    kind: "opinion",
    sourceIds: [],
    reviewNote: "Owned agency/client point of view — not externally verified."
  });
  const unsupportedLine =
    format === "seo_article" || format === "newsletter"
      ? "This approach will increase qualified applications."
      : "This will outperform our previous content.";
  claims.push({
    text: unsupportedLine,
    kind: "unsupported",
    sourceIds: [],
    reviewNote: "Outcome comparison with no cited control — remove or rewrite before approval."
  });

  let body = "";

  if (format === "linkedin_post") {
    body = [
      brief ? brief : `The question we keep hearing from ${client.audience || "our audience"}:`,
      "",
      facts[0],
      "",
      facts[1] ?? "",
      "",
      view,
      "",
      facts[2] ? `${facts[2]}` : "",
      "",
      "If you are weighing this decision, start with the constraint — not the brochure.",
      "",
      `Sources: ${sourceLines.join(" · ")}`
    ].filter(Boolean).join("\n");
  } else if (format === "x_thread") {
    body = [
      `1/ ${brief || `What ${client.name} actually knows about this decision:`}`,
      `2/ ${facts[0]}`,
      facts[1] ? `3/ ${facts[1]}` : "",
      facts[2] ? `4/ ${facts[2]}` : "",
      `5/ ${view}`,
      `6/ Next step: ${pick[pick.length - 1].title}.${pick[pick.length - 1].sourceUrl ? ` ${pick[pick.length - 1].sourceUrl}` : ""}`
    ].filter(Boolean).join("\n\n");
  } else if (format === "reel_script") {
    body = [
      `# ${title}`,
      "",
      `**Format:** 30–45s vertical reel · ${client.name}`,
      `**Hook (0–3s)**`,
      brief || `Most people get this decision backwards.`,
      "",
      `**Beat 1 (3–10s)**`,
      `VOICEOVER: ${facts[0]}`,
      `ON-SCREEN: ${pick[0].title}`,
      "",
      facts[1] ? `**Beat 2 (10–18s)**\nVOICEOVER: ${facts[1]}\nON-SCREEN: ${pick[1]?.title ?? "The detail that matters"}` : "",
      "",
      `**Beat 3 (18–28s)**`,
      `VOICEOVER: ${view}`,
      `ON-SCREEN: Your angle, in one line`,
      "",
      facts[2] ? `**Beat 4 (28–35s)**\nVOICEOVER: ${facts[2]}` : "",
      "",
      `**CTA (35–45s)**`,
      `VOICEOVER: If this is the decision in front of you, start with ${pick[pick.length - 1].title.toLowerCase()}.`,
      `ON-SCREEN: Save this · ${pick[pick.length - 1].sourceUrl ? pick[pick.length - 1].sourceUrl : client.website}`,
      "",
      `**Production note:** vertical 9:16, captions burned in, no claim or number that is not on screen.`,
      "",
      `Sources: ${sourceLines.join(" · ")}`
    ].filter(Boolean).join("\n");
  } else if (format === "seo_article") {
    body = [
      `# ${title}`,
      "",
      `If you are comparing options, the useful information is rarely on the homepage. Here is what ${client.name} has approved for publication.`,
      "",
      "## What we know",
      ...facts.map((f, i) => `- ${f}${pick[i]?.sourceUrl ? ` ([source](${pick[i].sourceUrl}))` : ""}`),
      "",
      "## Why it matters",
      view,
      "",
      "## What to do next",
      `Start with ${pick[pick.length - 1].title}. Confirm the current dates and requirements with the admissions team before you plan around them.`,
      "",
      "## Sources",
      ...sourceLines.map((s) => `- ${s}`)
    ].join("\n");
  } else if (format === "faq") {
    body = [
      `# ${title}`,
      "",
      ...pick.flatMap((k) => [
        `## ${k.title}?`,
        firstSentence(k.body, 400),
        ""
      ]),
      "## How should I decide?",
      view,
      "",
      `Sources: ${sourceLines.join(" · ")}`
    ].join("\n");
  } else if (format === "caption") {
    body = [
      brief || `${client.name}: one specific answer beats ten generic ones.`,
      "",
      facts[0],
      "",
      `${view}`,
      "",
      hashtags(pick)
    ].filter(Boolean).join("\n").slice(0, 2200);
  } else {
    body = [
      `Subject: ${title}`,
      "",
      `Hi — here is the short version of what ${client.name} can say with confidence this month.`,
      "",
      "## What we know",
      ...facts.map((f) => `- ${f}`),
      "",
      "## Our view",
      view,
      "",
      "## Next step",
      "If this matches your situation, the next useful step is to check the current dates and requirements. Reply and we will send the checklist.",
      "",
      `Sources: ${sourceLines.join(" · ")}`
    ].join("\n");
  }

  const qualityFlags: string[] = [];
  if (brief.length > 0 && brief.length < 20) qualityFlags.push("brief-too-short");
  if (pick.some((k) => k.status !== "approved")) qualityFlags.push("unapproved-knowledge");

  const qualityAudit = auditDraftForQuality(body, client, format);
  for (const flag of qualityAudit.qualityFlags) {
    if (!qualityFlags.includes(flag)) qualityFlags.push(flag);
  }

  return {
    title,
    body: body.slice(0, 12000),
    claims: claims.slice(0, 12),
    qualityFlags,
    promptTemplate: `studio-${format}-v1`
  };
}

export function studioChannel(format: AssetFormat) {
  return formatChannel(format);
}
