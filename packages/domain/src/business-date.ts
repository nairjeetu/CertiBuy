import type { Settings } from "./types.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function businessDate(settings: Settings, now: Date): string {
  const istMs = now.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istMs);

  istDate.setUTCDate(istDate.getUTCDate() + settings.sim_day_offset);

  const y = istDate.getUTCFullYear();
  const m = pad(istDate.getUTCMonth() + 1);
  const d = pad(istDate.getUTCDate());
  return `${y}-${m}-${d}`;
}

export function diffDays(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  return `${y}-${m}-${day}`;
}

export function isValidBusinessDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}
