import { NextResponse } from "next/server";
import { fetchCashfreeOrder, fetchCashfreeOrderPayments } from "@/lib/cashfree";
import { loadDB, saveDB, audit } from "@/lib/store";
import { DEFAULT_WORKSPACE_ID, type PlanTier } from "@/lib/types";
import { PLAN_ORDER } from "@/lib/agency";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || "").trim();
    const requestedTier = body.tier as PlanTier | undefined;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Missing orderId" }, { status: 400 });
    }

    const order = await fetchCashfreeOrder(orderId);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found on Cashfree" }, { status: 404 });
    }

    const isPaid = order.order_status === "PAID";
    const payments = isPaid ? await fetchCashfreeOrderPayments(orderId) : [];

    if (isPaid) {
      const db = await loadDB();
      // Derive tier from orderId (e.g. order_studio_...) or requested tier
      let targetTier: PlanTier = "studio";
      if (requestedTier && PLAN_ORDER.includes(requestedTier)) {
        targetTier = requestedTier;
      } else {
        const parts = orderId.split("_");
        if (parts[1] && PLAN_ORDER.includes(parts[1] as PlanTier)) {
          targetTier = parts[1] as PlanTier;
        }
      }

      db.planTier = targetTier;
      await audit(db, "billing.payment_received", "workspace", DEFAULT_WORKSPACE_ID);
      await saveDB(db);

      return NextResponse.json({
        ok: true,
        paid: true,
        status: order.order_status,
        tier: targetTier,
        amount: order.order_amount,
        payments
      });
    }

    return NextResponse.json({
      ok: true,
      paid: false,
      status: order.order_status,
      message: `Order status is ${order.order_status}`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify Cashfree order";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
