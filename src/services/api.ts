// src/services/api.ts
import type { DiffItem, CompareResponse, Decision } from "@/types/diff";

// 1) Bas-URL (från .env). Tar bort ev. trailing slash.
const BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://localhost:7216"; // fallback om .env saknas

// 2) Hjälpare: JSONPath "$.user.items[0].price" → "/user/items/0/price"
const toSlashPath = (p: string): string =>
  (p || "")
    .replace(/^\$\./, "/")        // "$." → "/"
    .replace(/\[(\d+)\]/g, "/$1") // [0] → /0
    .replace(/\./g, "/");         // "." → "/"

// 3) Liten fetch-helper med bättre felutskrifter (används där vi INTE vill tillåta 404)
async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} @ ${String(input)}\n${text}`);
  }
  try { return (await res.json()) as T; } catch { return {} as T; }
}

// 4) Normalisera serversvar → FE:s CompareResponse (framförallt paths + typnamn)
//    ✅ VIKTIGT: backend skickar "kind" men FE-typen heter "type". Vi mappar om här.
function normalize(server: any): CompareResponse {
  const rawDiffs: any[] = Array.isArray(server?.diffs) ? server.diffs : [];

  const diffs: DiffItem[] = rawDiffs.map((d: any) => ({
    path: toSlashPath(String(d.path ?? "")),
    type: (d.type ?? d.kind ?? "valueMismatch") as DiffItem["type"], // ← mappar kind → type
    expected: d.expected,
    actual: d.actual,
    severity: d.severity,
    suggestion: d.suggestion,
  }));

  return {
    template: server?.template ?? server?.body ?? {},
    customerData: server?.customerData ?? server?.payload ?? {},
    diffs,
    status: server?.status ?? (diffs.length ? "differences" : "ok"),
  };
}

// ----------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------

/**
 * Hämta templaten för en kund.
 * - Provar kunden först.
 * - Om 404 → faller tillbaka till "default".
 */
export async function getTemplate(customerId: string, signal?: AbortSignal): Promise<any> {
  const url = `${BASE}/Compare/actual-template?customerId=${encodeURIComponent(customerId)}`;

  // 1) Prova kundens template
  const res = await fetch(url, { signal });

  if (res.ok) {
    const server = await res.json();
    return server?.body ?? server ?? {};
  }

  // 2) Om saknas → hämta default istället
  if (res.status === 404 && customerId !== "default") {
    const fb = await fetch(`${BASE}/Compare/actual-template?customerId=default`, { signal });
    if (fb.ok) {
      const server = await fb.json();
      return server?.body ?? server ?? {};
    }
  }

  // 3) Övriga fel → kasta
  const text = await res.text().catch(() => "");
  throw new Error(`template failed: ${res.status} ${res.statusText}\n${text}`);
}

/**
 * Jämför payload mot aktiv template för kund och få diffs.
 * POST /Compare/check-payload?customerId=...
 */
export async function compareCheck(
  customerId: string,
  payload: Record<string, unknown> = {},
  signal?: AbortSignal
): Promise<CompareResponse> {
  // 1) Hämta template med vår GET-fallback (du har redan detta)
  const template = await getTemplate(customerId, signal);
  console.log("template keys:", Object.keys(template));

  // 2) Försök POSTa mot kunden
  const url = `${BASE}/Compare/check-payload?customerId=${encodeURIComponent(customerId)}`;
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
    signal,
  });

  // 3) Om 404 → prova default
  if (res.status === 404 && customerId !== "default") {
    const fbUrl = `${BASE}/Compare/check-payload?customerId=default`;
    console.warn("diff POST 404 → fallback to default");
    res = await fetch(fbUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
      signal,
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`diff failed: HTTP ${res.status} ${res.statusText}\n${text}`);
  }

  const diffBody = await res.json().catch(() => ({}));
  return normalize({
    template,
    payload,
    diffs: Array.isArray(diffBody?.diffs) ? diffBody.diffs : [],
    status: diffBody?.status,
  });
}

/**
 * (Frivillig – använd bara om din backend har denna route)
 * POST /Compare/apply-decisions?customerId=...
 */
export async function compareApply(
  customerId: string,
  decisions: Decision[],
  payload?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<CompareResponse> {
  const url = `${BASE}/Compare/apply-decisions?customerId=${encodeURIComponent(customerId)}`;

  const server = await http<any>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ? { decisions, payload } : { decisions }),
    signal,
  });

  return normalize(server);
}

// 1. Hämta sparad payload för en kund
export async function getPayload(customerId: string) {
  const res = await fetch(`${BASE}/api/payloads/by-customer?customerId=${encodeURIComponent(customerId)}`);
  if (!res.ok) throw new Error(`getPayload ${res.status}`);
  return res.json() as Promise<{ customerId: string; body: unknown; updatedAt?: string }>;
}

// 2. Spara/Uppdatera payload för en kund.
export async function savePayload(customerId: string, body: unknown) {
  const res = await fetch(`${BASE}/api/payloads/upsert?customerId=${encodeURIComponent(customerId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`savePayload ${res.status}`);
  return res.json() as Promise<{ message: string; customerId: string }>;
}

// 4. Hämta aktiv template för kund
export async function getActualTemplate(customerId: string) {
  const res = await fetch(`${BASE}/Compare/actual-template?customerId=${encodeURIComponent(customerId)}`);
  if (!res.ok) throw new Error(`getActualTemplate ${res.status}`);
  return res.json() as Promise<{ body: unknown; optionalPaths: string[]; ignorePaths: string[] }>;
}

// ✅ CompareSavedResponse använder den *gemensamma* DiffItem-typen
export type CompareSavedResponse = {
  status: "ok" | "differences";
  diffs: DiffItem[];
  template: any;      // JSON från backend
  customerData: any;  // DB-payload
};

// ✅ Använd BASE och returnera CompareSavedResponse
export async function compareSaved(customerId: string): Promise<CompareSavedResponse> {
  const res = await fetch(`${BASE}/Compare/check-saved?customerId=${encodeURIComponent(customerId)}`, {
    method: "POST", // Controller har [HttpPost("check-saved")]
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  const server = await res.json();
  // Normalisera till CompareResponse först (för att få path/type mappning rätt),
  // och returnera i CompareSavedResponse-form.
  const normalized = normalize(server);
  return {
    status: normalized.status ?? "ok",
    diffs: normalized.diffs,
    template: normalized.template,
    customerData: normalized.customerData,
  };
}

export async function getActualPayload(customerId: string): Promise<{ body: any; updatedAt?: string }> {
  const res = await fetch(`${BASE}/Compare/actual-payload?customerId=${encodeURIComponent(customerId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`getActualPayload ${res.status}`);
  const data = await res.json();
  return { body: data?.body ?? {}, updatedAt: data?.updatedAt };
}

