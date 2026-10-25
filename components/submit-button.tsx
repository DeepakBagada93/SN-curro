"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className = "btn btn-accent",
  disabled = false
}: {
  children: React.ReactNode;
  pendingText?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>{pendingText || "Processing…"}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
