import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { RefreshCw, X } from "lucide-react";
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
    <div className="space-y-4 pb-24">
      {/* header + refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? `${total} ändringar` : "Inga ändringar ännu"}
        </div>
        <Button
          onClick={load}
          variant="outline"
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
          Uppdatera historik
        </Button>
      </div>

      {/* states */}
      {loading && <div className="text-sm text-muted-foreground">Laddar…</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {/* grid med kort */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <PendingCard key={it.id} item={it} onOpen={openDetails} />
        ))}
      </div>

      {/* popup med detaljer */}
      <Dialog open={!!openId} onOpenChange={(open) => { if (!open) { setOpenId(null); setDetails(null); }}}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Change Details</DialogTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {openId}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {detailsLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {!detailsLoading && details && (
              <>
                {details.error && (
                  <Card className="bg-destructive/10 border-destructive/30">
                    <CardContent className="p-4">
                      <p className="text-sm text-destructive">{details.error}</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-muted/30 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kund:</span>
                      <span className="font-medium">{details.customerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge 
                        variant={
                          details.status === "applied" ? "default" : 
                          details.status === "failed" ? "destructive" : 
                          "secondary"
                        }
                      >
                        {details.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-mono text-xs">{new Date(details.createdUtc).toLocaleString()}</span>
                    </div>
                    {details.appliedUtc && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Applied:</span>
                        <span className="font-mono text-xs">{new Date(details.appliedUtc).toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Decisions ({(details.decisions ?? []).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {(details.decisions ?? []).map((d: any, i: number) => (
                        <div 
                          key={i} 
                          className="rounded-lg bg-gradient-to-r from-muted/60 to-muted/40 p-3 font-mono text-sm border border-primary/10"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {d.action}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <span className="flex-1 truncate">{d.path}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
