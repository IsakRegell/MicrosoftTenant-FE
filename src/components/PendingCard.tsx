import React from "react";
import type { ChangeCardDto } from "@/types/changes";

type Props = {
  item: ChangeCardDto;              // datat till kortet
  onOpen: (id: string) => void;     // vad som händer när man klickar "Visa detaljer"
};

export default function PendingCard({ item, onOpen }: Props) {
  const badge =
    item.status === "applied"
      ? "bg-green-500/20 text-green-300"
      : item.status === "failed"
      ? "bg-red-500/20 text-red-300"
      : "bg-yellow-500/20 text-yellow-300";

  return (
    <div className="rounded-2xl bg-neutral-800/60 p-4 shadow">
      {/* överrad */}
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">{item.customerId}</div>
        <span className={`text-xs px-2 py-1 rounded-full ${badge}`}>{item.status}</span>
      </div>

      {/* tider */}
      <div className="mt-2 text-xs opacity-70">
        <div>Created: {new Date(item.createdUtc).toLocaleString()}</div>
        {item.appliedUtc && <div>Applied: {new Date(item.appliedUtc).toLocaleString()}</div>}
      </div>

      {/* decisions teaser */}
      <div className="mt-3 space-y-1">
        {item.decisions.map((d, i) => (
          <div key={i} className="text-sm font-mono truncate">
            {d.action} → <span className="opacity-90">{d.path}</span>
          </div>
        ))}
        {item.decisionCount > item.decisions.length && (
          <div className="text-xs opacity-60">
            + {item.decisionCount - item.decisions.length} fler…
          </div>
        )}
      </div>

      <button
        onClick={() => onOpen(item.id)}
        className="mt-3 w-full rounded-xl border border-neutral-600 px-3 py-2 text-sm hover:bg-neutral-700"
      >
        Visa detaljer
      </button>
    </div>
  );
}
