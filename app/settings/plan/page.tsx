import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit } from "@/lib/store";
import { PLAN_CATALOG, PLAN_ORDER, generationsUsed, imagesUsed } from "@/lib/agency";
import { DEFAULT_WORKSPACE_ID, type PlanTier } from "@/lib/types";
import { fetchCashfreeOrder } from "@/lib/cashfree";
import { CashfreeCheckoutButton } from "@/components/cashfree-checkout-button";

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
  searchParams: { message?: string; tier?: string; error?: string; order_id?: string };
}) {
  const db = await loadDB();

  // Cashfree Order Return Verification
  let cashfreePaidOrder: { id: string; amount: number; tier: PlanTier } | null = null;
  if (searchParams.order_id) {
    const cfOrder = await fetchCashfreeOrder(searchParams.order_id);
    if (cfOrder && cfOrder.order_status === "PAID") {
      let targetTier: PlanTier = "studio";
      if (searchParams.tier && PLAN_ORDER.includes(searchParams.tier as PlanTier)) {
        targetTier = searchParams.tier as PlanTier;
      } else {
        const parts = searchParams.order_id.split("_");
        if (parts[1] && PLAN_ORDER.includes(parts[1] as PlanTier)) {
          targetTier = parts[1] as PlanTier;
        }
      }

      if (db.planTier !== targetTier) {
        db.planTier = targetTier;
        await audit(db, "billing.payment_received", "workspace", DEFAULT_WORKSPACE_ID);
        await saveDB(db);
      }
      cashfreePaidOrder = {
        id: cfOrder.order_id,
        amount: cfOrder.order_amount,
        tier: targetTier
      };
    }
  }

  const current = PLAN_CATALOG[db.planTier];
  const gens = generationsUsed(db.assets);
  const imgs = imagesUsed(db.images);
  const clientCount = db.clients.length;

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="eyebrow">Settings · Plan & Subscriptions</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">Plan and usage</h1>
        <p className="prose-muted mt-1 max-w-2xl text-sm">
          Caps are enforced across client knowledge brains, AI studio drafts, and brand visual generations.
          All payments processed securely in <strong>INR (₹)</strong> via <strong>Cashfree Payments</strong>.
        </p>
      </div>

      {/* Cashfree Success Notification */}
      {cashfreePaidOrder && (
        <div className="rounded-2xl border border-success/40 bg-success/10 p-5 text-foreground space-y-1 shadow-sm">
          <p className="font-semibold text-success flex items-center gap-2">
            <span>🎉</span> Payment Verified via Cashfree Payments!
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your workspace has been successfully upgraded to the <strong>{PLAN_CATALOG[cashfreePaidOrder.tier]?.label}</strong>.
            Transaction Amount: ₹{cashfreePaidOrder.amount.toLocaleString()} (Order ID: <code className="font-mono text-foreground font-semibold">{cashfreePaidOrder.id}</code>).
            Your 100% compliant GST invoice has been queued.
          </p>
        </div>
      )}

      {searchParams.message === "changed" && (
        <p className="alert alert-warning">
          Plan updated to {PLAN_CATALOG[searchParams.tier as PlanTier]?.label ?? searchParams.tier}. New limits apply now.
        </p>
      )}
      {searchParams.error && <p className="alert alert-danger">Choose a valid plan.</p>}

      {/* Current Plan Overview Card */}
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current active plan</p>
            <p className="font-display text-2xl font-semibold">
              {current.label}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {current.priceInr}/mo ({current.priceUsd}/mo)
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="badge badge-success">✓ 100% Active</span>
            <span className="text-muted-foreground">{current.blurb}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="flex justify-between text-xs">
              <span>Clients</span>
              <span className="text-muted-foreground">{clientCount}/{current.clients === 999 ? "∞" : current.clients}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, (clientCount / current.clients) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <span>Generations / 30d</span>
              <span className="text-muted-foreground">{gens}/{current.generations}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, (gens / current.generations) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <span>Images / 30d</span>
              <span className="text-muted-foreground">{imgs}/{current.images}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, (imgs / current.images) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Cards with Cashfree Checkout */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((tier) => {
          const plan = PLAN_CATALOG[tier];
          const active = tier === db.planTier;
          return (
            <div
              key={tier}
              className={`card flex flex-col justify-between ${
                active ? "border-accent ring-2 ring-accent/20 bg-accent/5" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">{plan.label}</h2>
                  {active && <span className="badge badge-accent">current</span>}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold tracking-tight text-foreground">
                    {plan.priceInr}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Original {plan.originalPriceInr} · Annual {plan.annualPriceInr}/mo
                </p>
                <p className="prose-muted mt-2 text-xs leading-relaxed">{plan.blurb}</p>

                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground border-t border-border/60 pt-3">
                  <li className="flex items-center gap-1.5">
                    <span className="text-success">✓</span>
                    <span>{plan.clients === 999 ? "Unlimited" : plan.clients} Client Brain{plan.clients === 1 ? "" : "s"}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-success">✓</span>
                    <span>{plan.generations} AI Drafts / mo</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-success">✓</span>
                    <span>{plan.images} Branded Graphics / mo</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-success">✓</span>
                    <span>{plan.seats} Agency Seat{plan.seats === 1 ? "" : "s"}</span>
                  </li>
                </ul>
              </div>

              {/* Cashfree Action */}
              <div className="mt-6 pt-3 border-t border-border/60">
                {active ? (
                  <button className="btn btn-outline w-full text-xs" disabled>
                    ✓ Active Plan
                  </button>
                ) : (
                  <CashfreeCheckoutButton
                    tier={tier}
                    label={`Pay ${plan.priceInr} with Cashfree →`}
                    className="btn btn-accent w-full text-xs font-semibold !py-2"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Compliance Badge */}
      <div className="card text-xs space-y-2 border-border/80 bg-muted/20">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span>🔒</span>
          <span>Secured by Cashfree Payments India</span>
        </div>
        <p className="prose-muted leading-relaxed">
          Payments are processed securely via UPI (Google Pay, PhonePe, Paytm), RuPay, Visa, Mastercard, and NetBanking.
          Billed in Indian Rupees (INR) with 18% GST invoice generation and 7-Day Money-Back Guarantee.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <a className="text-accent hover:underline font-medium" href="/refunds">Refund Policy</a>
          <span>·</span>
          <a className="text-accent hover:underline font-medium" href="/terms">Terms & Conditions</a>
          <span>·</span>
          <a className="text-accent hover:underline font-medium" href="/contact">Billing Help</a>
        </div>
      </div>
    </div>
  );
}
