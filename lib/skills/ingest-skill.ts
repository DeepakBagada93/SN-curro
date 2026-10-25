import { loadDB, saveDB, audit, uid, nowIso } from "../store";
import { scrapeUrlForKnowledge, extractFactsFromText, type ExtractedFact } from "../crawler";
import type { KnowledgeItem } from "../types";
import { REGISTERED_SKILLS, type CurroSkill, type SkillExecutionContext } from "./core-skills";

export interface IngestSkillOutput {
  extractedFacts: KnowledgeItem[];
  allFacts: KnowledgeItem[];
  sourceUrl?: string;
  sourceText?: string;
}

export const ingestSkill: CurroSkill<IngestSkillOutput> = {
  metadata: REGISTERED_SKILLS.ingest,
  async execute(ctx: SkillExecutionContext): Promise<IngestSkillOutput> {
    const db = await loadDB();
    const client = db.clients.find((c) => c.id === ctx.client.id) || ctx.client;

    const cleanPrompt = ctx.prompt.replace(/^\/ingest\s*/i, "").trim();
    const urlMatch = cleanPrompt.match(/https?:\/\/[^\s]+/i);
    let extracted: ExtractedFact[] = [];
    let sourceUrl: string | undefined;

    if (urlMatch) {
      sourceUrl = urlMatch[0];
      extracted = await scrapeUrlForKnowledge(sourceUrl);
    } else {
      extracted = await extractFactsFromText(cleanPrompt);
    }

    if (extracted.length === 0) {
      extracted = [
        {
          title: `${client.name} Operational Directive`,
          body: cleanPrompt.slice(0, 300),
          kind: "brand_fact",
          tags: ["distilled", "agent"]
        }
      ];
    }

    const t = nowIso();
    const newItems: KnowledgeItem[] = extracted.map((ef) => ({
      id: uid("kno"),
      workspaceId: client.workspaceId,
      clientId: client.id,
      kind: ef.kind,
      title: ef.title,
      body: ef.body,
      tags: ef.tags.length > 0 ? ef.tags : ["ingested"],
      provenance: sourceUrl || "prompt",
      sourceUrl: sourceUrl || null,
      status: "candidate",
      approvedAt: null,
      createdAt: t,
      updatedAt: t
    }));

    db.knowledgeItems.unshift(...newItems);

    await audit(db, "knowledge.bulk_created", "knowledge_item", newItems[0]?.id || "");
    await saveDB(db);

    const allFacts = db.knowledgeItems.filter((k) => k.clientId === client.id);

    return {
      extractedFacts: newItems,
      allFacts,
      sourceUrl
    };
  }
};
