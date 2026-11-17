const BASE = "/api/v1";

export async function fetchView<T = Record<string, unknown>>(name: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${BASE}/views/${name}${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `View ${name} failed (${res.status})`);
  }
  return res.json();
}

export async function runCommand<T = Record<string, unknown>>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/commands/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Command ${name} failed (${res.status})`);
  }
  return res.json();
}
