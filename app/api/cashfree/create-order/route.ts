import { NextResponse } from "next/server";
import { sessionProfile } from "@/lib/auth";
import { createCashfreeSubscriptionOrder, PLAN_INR_PRICING } from "@/lib/cashfree";
import type { PlanTier } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tier = (body.tier || "studio") as PlanTier;
    const annual = Boolean(body.annual);
    const phone = typeof body.phone === "string" ? body.phone : undefined;

    if (!PLAN_INR_PRICING[tier]) {
      return NextResponse.json({ ok: false, error: "Invalid plan tier" }, { status: 400 });
    }

    const profile = await sessionProfile().catch(() => null);
    const customerId = profile?.email ? profile.email.replace(/[^a-zA-Z0-9_-]/g, "_") : "agency_guest";
    const customerName = profile?.name || "Agency Subscriber";
    const customerEmail = profile?.email || "billing@curro.in";

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://curro.in";
    const returnUrl = `${origin}/settings/plan?order_id={order_id}&tier=${tier}`;

    const order = await createCashfreeSubscriptionOrder({
      planTier: tier,
      annual,
      customerId,
      customerName,
      customerEmail,
      customerPhone: phone,
      returnUrl
    });

    return NextResponse.json({
      ok: true,
      orderId: order.orderId,
      paymentSessionId: order.paymentSessionId,
      orderAmount: order.orderAmount,
      orderCurrency: order.orderCurrency
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create Cashfree order";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
