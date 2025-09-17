export type DiffType = "typeMismatch" | "valueMismatch" | "missing" | "unexpected" | "lengthMismatch";

export interface DiffItem {
  path: string;              // JSON Pointer, t.ex. "/user/id"
  type: DiffType;
  expected?: any;
  actual?: any;
  severity?: "info" | "warn" | "error";
  suggestion?: string;       // ex: "copyFromTemplate"
}

export interface CompareResponse {
  template: any;
  customerData: any;
  diffs: DiffItem[];
}

export interface Decision {
  path: string;
  action: "applyTemplate" | "keepCustomer";
}