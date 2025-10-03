// AdminPayload.tsx
import { useEffect, useState } from "react";
import { getPayload, savePayload, compareSaved, getActualTemplate } from "@/services/api";
import type { DiffItem } from "@/types/diff";



export default function AdminPayload({ customerId }: {customerId: string}) {

  //const [customerId, setCustomerId] = useState("code4value");

  const [payloadText, setPayloadText] = useState<string>("{}");
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [isValid, setIsValid] = useState(true);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<"idle" | "ok" | "differences" | "error">("idle");
  const [diffs, setDiffs] = useState<DiffItem[]>([]);

  // Ladda payload vid mount / kund-byte
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setStatus("idle");
        const data = await getPayload(customerId);
        setPayloadText(JSON.stringify(data.body ?? {}, null, 2));
        setUpdatedAt(data.updatedAt);
        setIsValid(true);
      } catch {
        // 404 eller annat fel -> tom mall
        setPayloadText("{\n\n}");
        setUpdatedAt(undefined);
        setIsValid(false); // inte giltig JSON förrän användaren fyller i
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  // Validera text -> JSON
  function onEdit(text: string) {
    setPayloadText(text);
    try {
      JSON.parse(text);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  }

  // Spara payload till DB
  async function onSave() {
    if (!isValid) return;
    try {
      setLoading(true);
      const obj = JSON.parse(payloadText);
      await savePayload(customerId, obj);
      setUpdatedAt(new Date().toISOString());
    } catch {
      alert("Kunde inte spara payload.");
    } finally {
      setLoading(false);
    }
  }

  // Kör jämförelse mot sparad payload
  async function onCompare() {
    try {
      setLoading(true);
      setStatus("idle");
      const res = await compareSaved(customerId);
      setStatus(res.status);
      setDiffs(res.diffs ?? []);
    } catch {
      setStatus("error");
      setDiffs([]);
    } finally {
      setLoading(false);
    }
  }

  // (valfritt) visa template i console
  async function onShowTemplate() {
    try {
      const tpl = await getActualTemplate(customerId);
      console.log("template.body", tpl.body);
      console.log("optionalPaths", tpl.optionalPaths);
      console.log("ignorePaths", tpl.ignorePaths);
      alert("Template loggad i console");
    } catch {
      alert("Kunde inte hämta template.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 960 }}>
      {/* Ta bort kund-inputen här, vi får customerId från AdminPanel */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onShowTemplate}>Visa template (console)</button>
      </div>

      {/* Rad 2: Editor */}
      <div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Senast sparad: {updatedAt ?? "—"}
        </div>
        <textarea
          value={payloadText}
          onChange={(e) => onEdit(e.target.value)}
          style={{ width: "100%", height: 320, fontFamily: "monospace" }}
        />
        {!isValid && <div style={{ color: "red", fontSize: 12 }}>JSON ogiltig.</div>}
      </div>

      {/* Rad 3: Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSave} disabled={!isValid || loading}>Spara payload</button>
        <button onClick={onCompare} disabled={loading}>Kör jämförelse</button>
      </div>

      {/* Rad 4: Resultat */}
      <div>
        <div>Status: {status}</div>
        {status === "differences" && diffs.length > 0 && (
          <ul style={{ marginTop: 8 }}>
            {diffs.map((d, i) => (
              <li key={i}>
                <strong>{d.type}</strong> @ <code>{d.path}</code>
              </li>
            ))}
          </ul>
        )}
        {status === "ok" && <div>✅ Inga skillnader.</div>}
        {status === "error" && <div>❌ Ett fel inträffade.</div>}
      </div>
    </div>
  );
}
