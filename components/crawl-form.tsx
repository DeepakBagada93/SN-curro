"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn btn-accent w-full flex items-center justify-center gap-2"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <>
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            aria-hidden="true"
          />
          <span>Crawling &amp; Extracting Facts…</span>
        </>
      ) : (
        <span>Extract Facts with AI →</span>
      )}
    </button>
  );
}

export function CrawlForm({
  action,
  defaultValue = "",
  placeholder = "https://client.com/about or client.com"
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [url, setUrl] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    let clean = url.trim();
    if (clean && !/^https?:\/\//i.test(clean) && clean.includes(".")) {
      clean = `https://${clean}`;
      setUrl(clean);
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="mt-3 space-y-3">
      <div>
        <label className="label" htmlFor="crawlUrl">
          Target URL
        </label>
        <input
          id="crawlUrl"
          name="crawlUrl"
          type="text"
          className="input"
          placeholder={placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Enter any public page URL (e.g. saasnext.in or https://client.com/pricing).
        </p>
      </div>
      <SubmitButton />
    </form>
  );
}
