"use client";

import { useState } from "react";
import type { PlanTier } from "@/lib/types";

declare global {
  interface Window {
    Cashfree?: (options: { mode: "production" | "sandbox" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_modal" | HTMLElement;
      }) => Promise<void>;
    };
  }
}

function loadCashfreeSDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Cashfree) return resolve(true);

    const existing = document.getElementById("cashfree-js-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "cashfree-js-sdk";
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CashfreeCheckoutButton({
  tier,
  annual = false,
  label,
  className = "btn btn-accent w-full",
  disabled = false
}: {
  tier: PlanTier;
  annual?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Create order on Cashfree PG via server API
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, annual })
      });

      const data = await res.json();
      if (!res.ok || !data.ok || !data.paymentSessionId) {
        throw new Error(data.error || "Unable to initialize Cashfree payment");
      }

      // 2. Load Cashfree v3 SDK
      const sdkReady = await loadCashfreeSDK();
      if (!sdkReady || !window.Cashfree) {
        // Fallback: If SDK fails to load, prompt user or use return_url
        throw new Error("Cashfree Payment Gateway SDK could not be loaded. Please check your internet connection.");
      }

      // 3. Trigger Cashfree Checkout
      const cashfree = window.Cashfree({ mode: "production" });
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self"
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment initialization failed";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={className}
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-spin">⏳</span>
            <span>Opening Cashfree…</span>
          </span>
        ) : (
          label || `Subscribe with Cashfree →`
        )}
      </button>
      {errorMsg && (
        <p className="mt-1.5 text-[11px] text-destructive leading-tight">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
