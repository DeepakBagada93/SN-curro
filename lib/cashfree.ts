import type { PlanTier } from "./types";

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | string;
  payment_session_id: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta?: {
    return_url?: string;
  };
}

export interface CashfreePaymentItem {
  payment_id: string;
  order_id: string;
  payment_status: "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED" | string;
  payment_amount: number;
  payment_currency: string;
  payment_message: string;
  payment_time: string;
  payment_method: Record<string, unknown>;
  bank_reference?: string;
}

// Plan Pricing in INR (₹)
export const PLAN_INR_PRICING: Record<
  PlanTier,
  {
    monthly: number;
    annualMonthly: number;
    annualTotal: number;
    label: string;
  }
> = {
  solo: {
    monthly: 999,
    annualMonthly: 799,
    annualTotal: 9588, // 799 * 12
    label: "Solo Plan"
  },
  studio: {
    monthly: 2999,
    annualMonthly: 2499,
    annualTotal: 29988, // 2499 * 12
    label: "Studio Plan"
  },
  agency: {
    monthly: 6999,
    annualMonthly: 5799,
    annualTotal: 69588, // 5799 * 12
    label: "Agency Plan"
  },
  enterprise: {
    monthly: 19999,
    annualMonthly: 16499,
    annualTotal: 197988, // 16499 * 12
    label: "Enterprise Plan"
  }
};

export function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID || "";
  const secretKey = process.env.CASHFREE_SECRET_KEY || "";
  const apiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";
  const baseUrl = process.env.CASHFREE_BASE_URL || "https://api.cashfree.com/pg";
  const env = process.env.CASHFREE_ENV || "production";

  return {
    appId,
    secretKey,
    apiVersion,
    baseUrl: baseUrl.replace(/\/$/, ""),
    env,
    isConfigured: Boolean(appId && secretKey)
  };
}

export async function createCashfreeSubscriptionOrder({
  planTier,
  annual = false,
  customerId,
  customerName,
  customerEmail,
  customerPhone = "9409211982",
  returnUrl
}: {
  planTier: PlanTier;
  annual?: boolean;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl?: string;
}): Promise<{
  orderId: string;
  paymentSessionId: string;
  orderAmount: number;
  orderCurrency: string;
  cfOrderId: string;
}> {
  const config = getCashfreeConfig();
  if (!config.isConfigured) {
    throw new Error("Cashfree payment gateway credentials are not configured in environment variables.");
  }

  const pricing = PLAN_INR_PRICING[planTier];
  if (!pricing) {
    throw new Error(`Invalid plan tier: ${planTier}`);
  }

  const orderAmount = annual ? pricing.annualTotal : pricing.monthly;
  const sanitizedPhone = (customerPhone || "9409211982").replace(/\D/g, "").slice(-10) || "9409211982";
  const sanitizedCustomerId = (customerId || "cust_user").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 45);
  const orderId = `order_${planTier}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://curro.in";
  const resolvedReturnUrl =
    returnUrl || `${siteUrl}/settings/plan?order_id={order_id}&tier=${planTier}`;

  const payload = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: "INR",
    customer_details: {
      customer_id: sanitizedCustomerId,
      customer_name: customerName || "Agency Subscriber",
      customer_email: customerEmail || "billing@curro.in",
      customer_phone: sanitizedPhone
    },
    order_meta: {
      return_url: resolvedReturnUrl
    },
    order_note: `Curro ${pricing.label} (${annual ? "Annual" : "Monthly"}) Subscription`
  };

  const response = await fetch(`${config.baseUrl}/orders`, {
    method: "POST",
    headers: {
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
      "x-api-version": config.apiVersion,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cashfree create order error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as CashfreeOrderResponse;

  return {
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
    orderAmount: data.order_amount,
    orderCurrency: data.order_currency,
    cfOrderId: data.cf_order_id
  };
}

export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrderResponse | null> {
  const config = getCashfreeConfig();
  if (!config.isConfigured) return null;

  try {
    const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: {
        "x-client-id": config.appId,
        "x-client-secret": config.secretKey,
        "x-api-version": config.apiVersion
      },
      cache: "no-store"
    });

    if (!response.ok) return null;
    return (await response.json()) as CashfreeOrderResponse;
  } catch {
    return null;
  }
}

export async function fetchCashfreeOrderPayments(orderId: string): Promise<CashfreePaymentItem[]> {
  const config = getCashfreeConfig();
  if (!config.isConfigured) return [];

  try {
    const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
      method: "GET",
      headers: {
        "x-client-id": config.appId,
        "x-client-secret": config.secretKey,
        "x-api-version": config.apiVersion
      },
      cache: "no-store"
    });

    if (!response.ok) return [];
    return (await response.json()) as CashfreePaymentItem[];
  } catch {
    return [];
  }
}
