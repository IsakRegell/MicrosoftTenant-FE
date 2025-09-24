// src/types/diff.ts

export type DiffType =
  | "missing"
  | "unexpected"
  | "typeMismatch"
  | "valueMismatch"
  | "lengthMismatch";

export type Severity = "info" | "warn" | "error";

export interface DiffItem {
  path: string;             // ex: "/user/age"
  type: DiffType;
  expected?: unknown;
  actual?: unknown;
  severity?: Severity;
  suggestion?: "applyTemplate" | "copyFromTemplate";
}

export type Decision = {
  path: string;
  action: "applyTemplate" | "keepCustomer";
};

// ⬇️ Lägg till status här (gör den gärna optional)
export interface CompareResponse {
  template: any;
  customerData: any;
  diffs: DiffItem[];
  status?: "ok" | "differences";
}
