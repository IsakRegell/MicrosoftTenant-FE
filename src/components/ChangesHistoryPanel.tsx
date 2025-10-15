import React, { useEffect, useState } from "react";
import PendingCard from "@/components/PendingCard";
import type { ChangeCardDto } from "@/types/changes";
import { fetchChangeCards, fetchChangeById } from "@/services/api";

type Props = {
  customerId: string;
};

export default function ChangesHistoryPanel({ customerId }: Props) {
  const [items, setItems] = useState<ChangeCardDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // popup-state
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchChangeCards({
        customerId,         // visar bara denna kund
        page: 1,
        pageSize: 20,
        // status: undefined   // visa alla status; sätt "pending" om du vill filtrera
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message ?? "Kunde inte ladda ändringshistorik");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [customerId]);

  // öppna popup och hämta detaljer
  async function openDetails(id: string) {
    setOpenId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const full = await fetchChangeById(id);
      setDetails(full);
    } catch (e) {
      setDetails({ error: (e as any)?.message ?? "Kunde inte hämta detaljer" });
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* header + refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">
          {total > 0 ? `${total} ändringar` : "Inga ändringar ännu"}
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-neutral-600 px-3 py-2 text-sm hover:bg-neutral-800"
        >
          Uppdatera historik
        </button>
      </div>

      {/* states */}
      {loading && <div className="opacity-70 text-sm">Laddar…</div>}
      {error && <div className="text-sm text-red-300">{error}</div>}

      {/* grid med kort */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <PendingCard key={it.id} item={it} onOpen={openDetails} />
        ))}
      </div>

      {/* popup med detaljer */}
      {openId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 p-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Change {openId}</h2>
              <button
                onClick={() => { setOpenId(null); setDetails(null); }}
                className="px-3 py-1 rounded-xl border border-neutral-600 hover:bg-neutral-800"
              >
                Stäng
              </button>
            </div>

            {detailsLoading && <div className="mt-3 text-sm opacity-70">Hämtar detaljer…</div>}
            {!detailsLoading && details && (
              <div className="mt-3 space-y-3">
                {details.error && <div className="text-sm text-red-300">{details.error}</div>}

                <div className="text-sm opacity-80">
                  <div>Kund: {details.customerId}</div>
                  <div>Status: {details.status}</div>
                  <div>Created: {new Date(details.createdUtc).toLocaleString()}</div>
                  {details.appliedUtc && <div>Applied: {new Date(details.appliedUtc).toLocaleString()}</div>}
                  {details.error && <div className="text-red-300">Error: {details.error}</div>}
                </div>

                <div>
                  <div className="text-sm mb-2 opacity-70">Decisions:</div>
                  <div className="space-y-1 max-h-72 overflow-auto">
                    {(details.decisions ?? []).map((d: any, i: number) => (
                      <div key={i} className="rounded-lg bg-neutral-800/60 p-2 font-mono text-sm">
                        {d.action} → {d.path}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
