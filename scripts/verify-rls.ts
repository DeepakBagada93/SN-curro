import { Client } from "pg";

// Functional RLS test (TODO #8): two workspaces, two users. As the
// low-privilege `authenticated` role with a forged JWT claim each user must
// see ONLY their own rows — reads, writes, and ledger rewrites denied.
const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";

async function asUser(client: Client, userId: string, fn: (c: Client) => Promise<void>) {
  await client.query("begin");
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId })]);
  try {
    await fn(client);
  } finally {
    await client.query("rollback");
  }
}

// Runs a statement that MUST be denied, without poisoning the transaction.
async function expectDenied(client: Client, sql: string, params: unknown[]): Promise<boolean> {
  await client.query("savepoint deny_probe");
  try {
    await client.query(sql, params);
    await client.query("release savepoint deny_probe");
    return false;
  } catch {
    await client.query("rollback to savepoint deny_probe");
    return true;
  }
}

async function main() {
  const admin = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });
  await admin.connect();
  const results: Array<[string, boolean]> = [];
  const check = (name: string, ok: boolean) => { results.push([name, ok]); console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); };

  try {
    // --- structural checks
    const tables = await admin.query(
      `select tablename from pg_tables where schemaname = 'public' and tablename in
       ('workspaces','workspace_members','brand_briefs','memory_cards','research_runs',
        'source_results','signal_cards','angles','content_assets','content_versions',
        'claim_ledger_entries','usage_events','audit_events')`
    );
    check(`13 tenant tables exist (found ${tables.rowCount})`, tables.rowCount === 13);
    const rls = await admin.query(
      `select count(*)::int as n from pg_tables where schemaname='public'
       and tablename in ('workspaces','workspace_members','brand_briefs','memory_cards','research_runs',
        'source_results','signal_cards','angles','content_assets','content_versions',
        'claim_ledger_entries','usage_events','audit_events') and rowsecurity`
    );
    check(`RLS enabled on all 13 tables (${rls.rows[0].n})`, rls.rows[0].n === 13);
    const pols = await admin.query(
      `select count(*)::int as n from pg_policies where schemaname='public'`
    );
    check(`policies present (${pols.rows[0].n} >= 19)`, pols.rows[0].n >= 19);

    // --- fixture: two isolated workspaces (pre-clean for idempotency)
    await admin.query("delete from public.workspaces where name in ('ws-a', 'ws-b')");
    const wa = (await admin.query(
      "insert into public.workspaces (name, owner_user_id) values ('ws-a', $1) returning id", [USER_A])).rows[0].id as string;
    const wb = (await admin.query(
      "insert into public.workspaces (name, owner_user_id) values ('ws-b', $1) returning id", [USER_B])).rows[0].id as string;
    await admin.query("insert into public.workspace_members (workspace_id, user_id) values ($1, $2), ($3, $4)",
      [wa, USER_A, wb, USER_B]);
    await admin.query("insert into public.memory_cards (workspace_id, kind, body, status) values ($1, 'fact', 'A secret', 'approved')", [wa]);
    await admin.query("insert into public.memory_cards (workspace_id, kind, body, status) values ($1, 'fact', 'B secret', 'approved')", [wb]);
    const verId = (await admin.query(
      `with a as (insert into public.content_assets (workspace_id) values ($1) returning id)
       insert into public.content_versions (workspace_id, content_asset_id, version, body)
       select $1, a.id, 1, 'v1' from a returning id`, [wa])).rows[0].id as string;

    const reader = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000
    });
    await reader.connect();
    try {
      await asUser(reader, USER_A, async (c) => {
        const mine = await c.query("select body from public.memory_cards");
        check("A reads exactly 1 row (own)", mine.rowCount === 1 && mine.rows[0].body === "A secret");
        const cross = await c.query("select * from public.memory_cards where workspace_id = $1", [wb]);
        check("A reads 0 rows from B workspace", cross.rowCount === 0);
        check("A INSERT into B denied",
          await expectDenied(c, "insert into public.memory_cards (workspace_id, kind, body) values ($1, 'fact', 'sneaky')", [wb]));
        // No UPDATE policy exists on append-only ledgers: PG rewrites 0 rows, silently.
        const upd = await c.query("update public.content_versions set body = 'forged' where id = $1", [verId]);
        check("A UPDATE own ledger version rewrites 0 rows (append-only)", upd.rowCount === 0);
        const still = await c.query("select body from public.content_versions where id = $1", [verId]);
        check("ledger body unchanged", still.rows[0]?.body === "v1");
      });
      await asUser(reader, USER_B, async (c) => {
        const mine = await c.query("select body from public.memory_cards");
        check("B reads exactly 1 row (own)", mine.rowCount === 1 && mine.rows[0].body === "B secret");
      });
    } finally {
      await reader.end();
    }

    // --- cleanup fixtures (cascades)
    await admin.query("delete from public.workspaces where id in ($1, $2)", [wa, wb]);
    const left = await admin.query("select count(*)::int as n from public.memory_cards where body in ('A secret','B secret')");
    check("fixtures cleaned up", left.rows[0].n === 0);
  } finally {
    await admin.end();
  }
  const failed = results.filter(([, ok]) => !ok);
  console.log(`\nRLS_VERIFY: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((e) => { console.error("RLS_VERIFY_FAIL", e instanceof Error ? e.message : e); process.exit(1); });
