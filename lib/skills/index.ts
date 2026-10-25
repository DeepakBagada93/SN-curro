export * from "./core-skills";
export * from "./token-compressor";
export * from "./content-skill";
export * from "./visual-skill";
export * from "./brainstorm-skill";
export * from "./audit-skill";
export * from "./ingest-skill";
export * from "./plan-skill";

import { contentSkill } from "./content-skill";
import { visualSkill } from "./visual-skill";
import { brainstormSkill } from "./brainstorm-skill";
import { auditSkill } from "./audit-skill";
import { ingestSkill } from "./ingest-skill";
import { planSkill } from "./plan-skill";
import type { CurroSkill } from "./core-skills";

export const SKILL_REGISTRY: Record<string, CurroSkill> = {
  content: contentSkill,
  visual: visualSkill,
  brainstorm: brainstormSkill,
  audit: auditSkill,
  ingest: ingestSkill,
  plan: planSkill
};

export function getSkillBySlashCommand(command: string): CurroSkill | undefined {
  const norm = command.toLowerCase().trim();
  switch (norm) {
    case "/draft":
    case "/content":
    case "/write":
      return contentSkill;
    case "/image":
    case "/visual":
    case "/svg":
      return visualSkill;
    case "/brainstorm":
    case "/angle":
    case "/hook":
      return brainstormSkill;
    case "/audit":
    case "/check":
    case "/verify":
      return auditSkill;
    case "/ingest":
    case "/crawl":
    case "/scrape":
      return ingestSkill;
    case "/plan":
    case "/calendar":
    case "/roadmap":
      return planSkill;
    default:
      return undefined;
  }
}
