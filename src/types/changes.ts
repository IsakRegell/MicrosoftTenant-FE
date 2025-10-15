//  NYTT: typer för cards-listan (speglar ChangeCardDto i backend)
export type CardDecisionDto  = {
  path: string;
  action: "applaTemplate" | "keepCustomer";
};

export type ChangeCardDto = {
  id: string;
  customerId: string;
  status: "pending" | "applied" | "failed";
  createdUtc: string;
  appliedUtc?: string | null;
  decisionCount: number;
  decisions: CardDecisionDto[];
}

export type ChangeListResponse = {
  total: number;
  items: ChangeCardDto[];
}
