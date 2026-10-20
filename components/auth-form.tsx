"use client";

import { useFormState } from "react-dom";

type Action = (formData: FormData) => Promise<{ error?: string }>;

export function AuthForm({ action, children, submitLabel, glow = false }: { action: Action; children: React.ReactNode; submitLabel: string; glow?: boolean }) {
  const [state, formAction] = useFormState(async (_prev: { error?: string }, formData: FormData) => action(formData), {});
  return (
    <form action={formAction} className="card rise rise-1 mt-8 space-y-4">
      {state?.error && <p className="alert alert-danger" role="alert">{state.error}</p>}
      {children}
      <button className={`btn btn-accent w-full !py-3 ${glow ? "btn-glow" : ""}`} type="submit">{submitLabel}</button>
    </form>
  );
}
