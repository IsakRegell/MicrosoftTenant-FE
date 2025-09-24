import type { CustomerApi, Customer, CustomerListItem } from "@/types/customer";

const BASE = import.meta.env.VITE_API_BASE_URL as string;

// Liten hjälpare: välj första fältet som finns (_id | id | objectId)
const pickObjectId = (c: CustomerApi) => c.objectId ?? c._id ?? c.id ?? "";


// Mappa API → FE-modell
// Mappa API → FE-modell (robust mot olika fältnamn)
const mapCustomer = (c: CustomerApi): Customer => ({
  objectId: pickObjectId(c),
  customerId: c.customerId,
  name: c.name,
  // plocka första matchande e-post-fält
  contactEmail:
    (c as any).contactEmail ??
    (c as any).email ??
    (c as any).contact_email ??
    "",
  // plocka första matchande orgnr-fält
  orgNumber:
    (c as any).orgNumber ??
    (c as any).orgnr ??
    (c as any).organizationNumber ??
    "",
  isActive: Boolean(c.isActive ?? true),
});


// Mappa till list-item (din Sidebar/AdminPanel använder id + name)
const toListItem = (c: Customer): CustomerListItem => ({
  id: c.customerId,          // 👈 viktigt: id = customerId (ex "volvo")
  customerId: c.customerId,  // om din typ har detta fält
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
// Låter den träffa backend och returnera list-items.
export async function listCustomers(signal?: AbortSignal): Promise<CustomerListItem[]>{
  const customers = await getAllCustomers(signal);
  return customers.map(toListItem)
}

// --- DELETE ---

export async function deleteCustomer(objectId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/Customers/${objectId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Delete misslyckades (${res.status}): ${body}`);
  }
}


