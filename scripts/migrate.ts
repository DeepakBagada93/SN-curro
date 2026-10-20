import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Client } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });
  await client.connect();
  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      );
    `);
    const applied = new Set(
      (await client.query("select version from public.schema_migrations")).rows.map((r) => r.version as string)
    );
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
    if (files.length === 0) { console.log("MIGRATE: no migration files found"); return; }
    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      if (applied.has(version)) { console.log(`MIGRATE: skip ${version} (already applied)`); continue; }
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      console.log(`MIGRATE: applying ${version} ...`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into public.schema_migrations (version) values ($1)", [version]);
        await client.query("commit");
        console.log(`MIGRATE: applied ${version}`);
      } catch (e) {
        await client.query("rollback");
        throw e;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error("MIGRATE_FAIL", e instanceof Error ? e.message : e); process.exit(1); });
