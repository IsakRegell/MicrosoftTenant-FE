// src/services/customers.ts
import type { CustomerApi, Customer, CustomerListItem } from "@/types/customer";

const BASE = import.meta.env.VITE_API_BASE_URL as string;

// Hjälp: välj första fältet som finns (_id | id | objectId)
const pickObjectId = (c: CustomerApi) => c.objectId ?? c._id ?? c.id ?? "";

// Hjälp: tolka isActive robust (boolean | number | string)
const coerceIsActive = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    // "false", "0", "no", "nej" → false
    return !/^(false|0|no|nej)$/.test(s);
  }
  return true; // default → aktiv om inget värde alls
};

// Mappa API → FE-modell (robust mot olika fältnamn)
const mapCustomer = (c: CustomerApi): Customer => ({
  objectId: pickObjectId(c),
  customerId: c.customerId,
  name: c.name,
  contactEmail:
    (c as any).contactEmail ??
    (c as any).email ??
    (c as any).contact_email ??
    "",
  orgNumber:
    (c as any).orgNumber ??
    (c as any).orgnr ??
    (c as any).organizationNumber ??
    "",
  isActive: coerceIsActive((c as any).isActive),
});

// Mappa till list-item (din Sidebar/AdminPanel använder id + name)
const toListItem = (c: Customer): CustomerListItem => ({
  id: c.customerId,          // 👈 viktigt: id = customerId (ex "volvo")
  customerId: c.customerId,
  name: c.name,
  orgNumber: c.orgNumber,
  contactEmail: c.contactEmail,
  isActive: c.isActive,
});

// --- READ ---

export async function getActiveCustomers(signal?: AbortSignal): Promise<Customer[]> {
  const res = await fetch(`${BASE}/api/Customers/active`, { signal });
  if (!res.ok) throw new Error("Failed to fetch active customers");
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(mapCustomer);
}

export async function getInactiveCustomers(signal?: AbortSignal): Promise<Customer[]> {
  const res = await fetch(`${BASE}/api/Customers/inactive`, { signal });
  if (!res.ok) throw new Error("Failed to fetch inactive customers");
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(mapCustomer);
}

export async function getAllCustomers(signal?: AbortSignal): Promise<Customer[]> {
  const res = await fetch(`${BASE}/api/Customers/all`, { signal });
  if (!res.ok) throw new Error("Failed to fetch all customers");
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(mapCustomer);
}

// Din AdminPanel anropar `listCustomers()`.
export async function listCustomers(signal?: AbortSignal): Promise<CustomerListItem[]> {
  const customers = await getActiveCustomers(signal);
  return customers.map(toListItem);
}

// --- DELETE ---

export async function deleteCustomer(objectId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/Customers/${objectId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Delete misslyckades (${res.status}): ${body}`);
  }
}
