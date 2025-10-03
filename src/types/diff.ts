// src/types/diff.ts

// ---- Diff-resultat från jämförelsen ----
export type DiffType =
  | "missing"
  | "unexpected"
  | "typeMismatch"
  | "valueMismatch"
  | "lengthMismatch";

export interface DiffItem {
  path: string;               // Ex: "/user/name"
  type: DiffType;             // Ex: "valueMismatch"
  expected?: unknown;         // Värdet i template
  actual?: unknown;           // Värdet hos kunden
  severity?: "error" | "warn" | "info";
  suggestion?: string;
}

// ---- Backend-beslut (det som skickas till API:t) ----
export type DecisionAction = "applyTemplate" | "keepCustomer";

export interface Decision {
  path: string;
  action: DecisionAction;
}

// ---- UI-beslut (lokalt i FE; tillåter även 'undo') ----
// Viktigt: denna MÅSTE komma EFTER att DecisionAction är definierad
export type UiDecisionAction = DecisionAction | "undo";

export interface UiDecision {
  path: string;
  action: UiDecisionAction;
}

// ---- Normaliserat svar som FE jobbar med ----
export interface CompareResponse {
  template: any;
  customerData: any;
  diffs: DiffItem[];
  status: "ok" | "differences";
}
