export function zonedTimeToUtc(local: string, timeZone: string): Date {
  const base = new Date(`${local.length === 16 ? `${local}:00` : local}Z`);
  if (Number.isNaN(base.getTime())) return new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).formatToParts(base);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const asZone = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    const offset = asZone - base.getTime();
    return new Date(base.getTime() - offset);
  } catch {
    return base;
  }
}

export function formatInTimeZone(iso: string | null, timeZone: string, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", { timeZone, dateStyle: "medium", timeStyle: "short", ...opts });
  } catch {
    return iso;
  }
}

export function toLocalInputValue(iso: string | null, timeZone: string): string {
  if (!iso) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
  } catch {
    return iso.slice(0, 16);
  }
}
