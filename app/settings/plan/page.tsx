import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit } from "@/lib/store";
import { PLAN_CATALOG, PLAN_ORDER, generationsUsed, imagesUsed } from "@/lib/agency";
import { DEFAULT_WORKSPACE_ID, type PlanTier } from "@/lib/types";

export const dynamic = "force-dynamic";

async function changePlan(formData: FormData) {
  "use server";
  const tier = String(formData.get("tier") ?? "") as PlanTier;
  if (!PLAN_ORDER.includes(tier)) redirect("/settings/plan?error=tier");
  const db = await loadDB();
  db.planTier = tier;
  await audit(db, "billing.plan_changed", "workspace", DEFAULT_WORKSPACE_ID);
  await saveDB(db);
  revalidatePath("/settings/plan");
  redirect(`/settings/plan?message=changed&tier=${tier}`);
}

export default async function PlanSettingsPage({
  searchParams
}: {
  searchParams: { message?: string; tier?: string; error?: string };
}) {
  const db = await loadDB();
  const current = PLAN_CATALOG[db.planTier];
  const gens = generationsUsed(db.assets);
  const imgs = imagesUsed(db.images);
  const clientCount = db.clients.length;

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="eyebrow">Settings · Plan</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">Plan and usage</h1>
        <p className="prose-muted mt-1 max-w-2xl text-sm">Caps are enforced in the studio and image studio. Billing is simulated in this beta — switching a plan changes limits immediately.</p>
      </div>

      {searchParams.message === "changed" && <p className="alert alert-warning">Plan updated to {PLAN_CATALOG[searchParams.tier as PlanTier]?.label ?? searchParams.tier}. New limits apply now.</p>}
      {searchParams.error && <p className="alert alert-danger">Choose a valid plan.</p>}

      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
            <p className="font-display text-2xl font-semibold">{current.label} <span className="text-sm font-normal text-muted-foreground">{current.price}{current.cadence}</span></p>
          </div>
          <p className="text-xs text-muted-foreground">{current.blurb}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="flex justify-between text-xs"><span>Clients</span><span className="text-muted-foreground">{clientCount}/{current.clients === 999 ? "∞" : current.clients}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, (clientCount / current.clients) * 100)}%` }} /></div>
          </div>
          <div>
            <div className="flex justify-between text-xs"><span>Generations / 30d</span><span className="text-muted-foreground">{gens}/{current.generations}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, (gens / current.generations) * 100)}%` }} /></div>
          </div>
          <div>
            <div className="flex justify-between text-xs"><span>Images / 30d</span><span className="text-muted-foreground">{imgs}/{current.images}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, (imgs / current.images) * 100)}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((tier) => {
          const plan = PLAN_CATALOG[tier];
          const active = tier === db.planTier;
          return (
            <div key={tier} className={`card ${active ? "border-accent ring-1 ring-accent/30" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{plan.label}</h2>
                {active && <span className="badge badge-accent">current</span>}
              </div>
              <p className="mt-1 font-display text-2xl font-semibold">{plan.price}<span className="text-xs font-normal text-muted-foreground">{plan.cadence}</span></p>
              <p className="prose-muted mt-1 text-xs">{plan.blurb}</p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>{plan.clients === 999 ? "Unlimited" : plan.clients} client{plan.clients === 1 ? "" : "s"}</li>
                <li>{plan.generations} generations / mo</li>
                <li>{plan.images} images / mo</li>
                <li>{plan.seats} seat{plan.seats === 1 ? "" : "s"}</li>
              </ul>
              <form action={changePlan} className="mt-4">
                <input type="hidden" name="tier" value={tier} />
                <button className={`btn w-full ${active ? "btn-outline" : "btn-accent"}`} type="submit" disabled={active}>{active ? "Current plan" : tier === "enterprise" ? "Contact sales" : `Switch to ${plan.label}`}</button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="card text-xs">
        <h2 className="h-display text-lg">Beta billing honesty</h2>
        <p className="prose-muted mt-1">No card is charged in this build. Switching plans is an internal state change for testing caps. Usage costs on the Analytics page are estimates from recorded events — not invoices.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="btn btn-outline btn-sm" href="/settings/usage">Usage & costs</a>
          <a className="btn btn-ghost btn-sm" href="/analytics">Client analytics</a>
        </div>
      </div>
    </div>
  );
}
