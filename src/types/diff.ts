// ---- Diff-resultat från jämförelsen ----
export type DiffType =
  | "missing"
  | "unexpected"
  | "typeMismatch"
  | "valueMismatch"
  | "lengthMismatch";

export interface DiffItem {
  path: string;               // Ex: "/user/name" (slash-format i FE)
  type: DiffType;             // Ex: "valueMismatch"
  expected?: unknown;         // Värdet i template
  actual?: unknown;           // Värdet hos kunden
  severity?: "error" | "warn" | "info";
  suggestion?: string;
}

// ---- Backend-beslut (det som skickas till API:t) ----
// OBS: backend förväntar JSONPath i 'path', t.ex. $.address.city
export type DecisionAction = "set" | "applyTemplate" | "keepCustomer" | "remove";

export interface Decision {
  path: string;        // JSONPath (FE konverterar med toJsonPath)
  action: DecisionAction;
  value?: any;         // krävs när action === "set"
}

// ---- (nytt) changeset-status från backend ----
export type ChangeSetStatus = "pending" | "applied" | "failed";

export interface ChangeSetResult {
  changeSetId: string;
  status: ChangeSetStatus;
  error?: string;
}

// ---- UI-beslut (lokalt i FE; tillåter även 'undo') ----
export type UiDecisionAction = DecisionAction | "undo";

export interface UiDecision {
  path: string;               // slash-format i UI:t (ex. "/address/city")
  action: UiDecisionAction;
}

// ---- Normaliserat svar som FE jobbar med ----
export interface CompareResponse {
  template: any;
  customerData: any;
  diffs: DiffItem[];
  status: "ok" | "differences";
}
