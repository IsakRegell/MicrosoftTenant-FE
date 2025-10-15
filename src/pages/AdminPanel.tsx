import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, Building2, Mail, Hash, History, RefreshCw, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ComparisonTableView } from '@/components/ComparisonTableView';
import type { DiffItem, Decision, UiDecision } from '@/types/diff';
import { CustomerListItem } from '@/types/customer';
import ChangesHistoryPanel from '@/components/ChangesHistoryPanel';

// API-funktioner
import {
applyAndWait,        
toJsonPath,          
compareCheck,
getLatestPayload,
getPayload,
CompareSavedResponse,
getTemplate,
} from '@/services/api';

import { listCustomers } from '@/services/customers';

export default function AdminPanel() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem>();


  // --- helpers för path-läsning/sättning ---
function getValueAtPath(obj: any, path: string): any {
  if (!path || path === '/') return obj;
  const parts = path.split('/').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function applyDecisionsLocally(
  customerData: any,
  template: any,
  decisions: Decision[]
) {
  const clone = structuredClone(customerData ?? {});
  for (const d of decisions) {
    if (d.action === 'applyTemplate') {
      const templateVal = getValueAtPath(template, d.path);
      setValueAtPath(clone, d.path, templateVal);
    }
    // keepCustomer = gör inget
  }
  return clone;
}


function setValueAtPath(obj: any, path: string, value: any) {
  if (!path || path === '/') return;
  const parts = path.split('/').filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    if (cur[key] == null) {
      cur[key] = nextIsIndex ? [] : {};
    }
    cur = cur[key];
  }
  const last = parts[parts.length - 1];
  cur[last] = value;
}


  // Det vi renderar i tabellen (template + customerData + diffs)
  const [compareData, setCompareData] = useState<CompareSavedResponse | null>(null);

  // ⬇️ Viktigt: håll UI-beslut (tillåter även 'undo' lokalt)
  const [pendingDecisions, setPendingDecisions] = useState<UiDecision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('compare');

  // Visa liten info-ruta om payload saknas
  const [missingPayload, setMissingPayload] = useState(false);

  // Badge-siffror
  const [visibleDiffCount, setVisibleDiffCount] = useState<number>(0);
  const [rawDiffCount, setRawDiffCount] = useState<number>(0);

  const { toast } = useToast();

  const loadCustomerData = async () => {
    if (!selectedCustomerId) return;
    try {
      const customers = await listCustomers();
      const customer = customers.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error('Failed to load customer data:', error);
    }
  };

  // Ladda data för tabellen:
  // 1) Hämta senaste payload (kundens värde)
  // 2) Diffa mot aktiv template (utan att logga)
  // 3) Vid 404 → visa endast template och info-ruta
  const loadCompareData = useCallback(async () => {
  if (!selectedCustomerId) return;

  setIsLoading(true);
  try {
    // 1) Primär källa: SPARAD payload i DB
    let latestBody: any;
    try {
      const actual = await getPayload(selectedCustomerId);
      latestBody = actual.body; // ✅ sanning från DB
    } catch {
      // 2) Fallback: senaste logg (om ingen sparad än)
      const latest = await getLatestPayload(selectedCustomerId);
      latestBody = latest.body;
    }

    // 3) Diffa mot template utan loggning
    const result = await compareCheck(selectedCustomerId, latestBody, undefined, { log: false });

    // 4) Mata in i vyn
    const next: CompareSavedResponse = {
      status: result.status,
      diffs: result.diffs as DiffItem[],
      template: result.template,
      customerData: latestBody,
    };

    setCompareData(next);
    setPendingDecisions([]);
    setMissingPayload(false);
  } catch (error) {
    try {
      const tpl = await getTemplate(selectedCustomerId);
      setCompareData({ status: 'ok', diffs: [], template: tpl, customerData: {} });
      setPendingDecisions([]);
      setMissingPayload(true);
    } catch {
      setCompareData(null);
      setMissingPayload(false);
      toast({
        title: 'Fel vid laddning',
        description: 'Kunde inte hämta template för kunden',
        variant: 'destructive',
      });
    }
  } finally {
    setIsLoading(false);
  }
}, [selectedCustomerId, toast]);


  useEffect(() => {
    if (!selectedCustomerId) {
      setCompareData(null);
      setPendingDecisions([]);
      setMissingPayload(false);
      setVisibleDiffCount(0);
      setRawDiffCount(0);
      return;
    }

    // Rensa först så inget gammalt visas
    setCompareData(null);
    setPendingDecisions([]);
    setMissingPayload(false);
    setVisibleDiffCount(0);
    setRawDiffCount(0);

    // Ladda ny data
    loadCustomerData();
    loadCompareData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  // ⬇️ Tar emot Ändra/Behåll/Ångra från tabellen
  const handleDecision = (decision: UiDecision) => {
    setPendingDecisions(prev => {
      // ta bort ev. tidigare för samma path
      const filtered = prev.filter(d => d.path !== decision.path);

      // 'undo' = rensa val för den raden (lägg inte till något nytt)
      if (decision.action === 'undo') return filtered;

      // annars uppdatera/addera
      return [...filtered, decision];
    });
  };

  const handleSave = async () => {
  if (!selectedCustomerId) return;

  // 1) Bygg beslut (filtrera bort 'undo' + konvertera path till JSONPath)
  const toSend: Decision[] = pendingDecisions
  .filter(d => d.action !== 'undo' && d.action !== 'keepCustomer') // 👈 nytt
  .map(d => {
    const base: Decision = {
      path: toJsonPath(d.path),
      action: d.action as Decision['action'],
    };
    const v = (d as any)?.value;
    return base.action === 'set' && v !== undefined ? { ...base, value: v } : base;
  });

if (toSend.length === 0) {
  toast({ title: 'Inget att spara', description: 'Välj ändringar först.' });
  return;
}


  setIsSaving(true);
  try {
    // 2) Skicka till backend och vänta (applied/failed/pending)
    const res = await applyAndWait(
      selectedCustomerId,
      toSend,
      /* correlationId */ undefined,
      /* dryRun */ false
    );

    // 3) Ladda om data i vyn (hämtar DB/logg + diffar om)
    await loadCompareData();
    setPendingDecisions([]);

    // 4) Feedback
    if (res.status === 'applied') {
      toast({ title: 'Sparat', description: 'Ändringar tillämpade i Azure.' });
    } else if (res.status === 'failed') {
      toast({ title: 'Misslyckades', description: res.error ?? 'Okänt fel.', variant: 'destructive' });
    } else {
      toast({ title: 'Skickat', description: 'Ändringarna är skickade (pending).' });
    }
  } catch (e: any) {
    toast({
      title: 'Fel vid sparande',
      description: e?.message ?? 'Kunde inte spara ändringarna.',
      variant: 'destructive',
    });
  } finally {
    setIsSaving(false);
  }
};


  // ======================
  // TEMPLATE-PLATT VY
  // ======================

  const humanizeField = (path: string) => {
    const last = path.split('/').filter(Boolean).pop() ?? path;
    return last
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '–';
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nej';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return `Lista med ${value.length} objekt`;
    if (typeof value === 'object') return `Objekt med ${Object.keys(value).length} fält`;
    return String(value);
  };

  const flattenTemplate = (obj: any, prefix = ''): Array<{ path: string; value: any }> => {
    const out: Array<{ path: string; value: any }> = [];
    const isLeaf = (v: any) =>
      v === null ||
      v === undefined ||
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean';

    if (Array.isArray(obj)) {
      out.push({ path: prefix || '/', value: obj });
      obj.forEach((item, idx) => {
        const p = `${prefix}/${idx}`;
        if (isLeaf(item)) {
          out.push({ path: p, value: item });
        } else {
          out.push(...flattenTemplate(item, p));
        }
      });
      return out;
    }

    if (obj && typeof obj === 'object') {
      if (prefix) out.push({ path: prefix, value: obj });
      for (const key of Object.keys(obj)) {
        const p = prefix ? `${prefix}/${key}` : `/${key}`;
        const v = obj[key];
        if (isLeaf(v)) {
          out.push({ path: p, value: v });
        } else {
          out.push(...flattenTemplate(v, p));
        }
      }
      return out;
    }

    out.push({ path: prefix || '/', value: obj });
    return out;
  };

  const templateRows = compareData?.template ? flattenTemplate(compareData.template) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <Sidebar
          selectedCustomerId={selectedCustomerId}
          onCustomerSelect={setSelectedCustomerId}
        />

        <main className="flex-1 p-6">
          {!selectedCustomerId ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <Card className="w-96 text-center">
                <CardHeader>
                  <CardTitle>Välj en kund</CardTitle>
                  <CardDescription>
                    Öppna sidomenyn och välj en kund för att börja jämföra JSON-data
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : isLoading && !compareData ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laddar data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedCustomer && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{selectedCustomer.name}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {selectedCustomer.orgNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedCustomer.contactEmail}
                            </span>
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          title={`Rå diff-count från backend: ${rawDiffCount}`}
                        >
                          {visibleDiffCount} skillnader
                        </Badge>

                        {pendingDecisions.length > 0 && (
                          <Badge variant="outline">
                            {pendingDecisions.filter(d => d.action !== 'undo' && d.action !== 'keepCustomer').length} väntande ändringar
                          </Badge>
                        )}
                        <Button
                          onClick={handleSave}
                          disabled={pendingDecisions.filter(d => d.action !== 'undo' && d.action !== 'keepCustomer').length === 0 || isSaving}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {isSaving ? 'Sparar...' : 'Spara ändringar'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="compare" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Jämför Data
                  </TabsTrigger>

                  <TabsTrigger value="template" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Template
                  </TabsTrigger>

                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Ändringshistorik
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="compare" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={loadCompareData}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                      Uppdatera data
                    </Button>
                  </div>

                  {missingPayload && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle>Ingen sparad payload</CardTitle>
                        <CardDescription>
                          Kunden har ingen sparad payload ännu. Endast mallen visas i tabellen nedan.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}

                  {compareData && (
                    <ComparisonTableView
                      template={compareData.template}
                      customerData={compareData.customerData}
                      diffs={(compareData.diffs ?? []) as DiffItem[]}
                      onDecision={handleDecision}
                      pendingDecisions={pendingDecisions}
                      isLoading={isLoading}
                      // ta emot visad/rå diff-count
                      onVisibleCountChange={(visible, raw) => {
                        setVisibleDiffCount(visible);
                        setRawDiffCount(raw);
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="template" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={loadCompareData}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                      Uppdatera template
                    </Button>
                  </div>

                  {!compareData?.template ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Kunde inte läsa template</CardTitle>
                        <CardDescription>Prova att uppdatera eller välj kund igen.</CardDescription>
                      </CardHeader>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Template (översikt)</CardTitle>
                        <CardDescription>
                          En platt vy av alla fält i templaten.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {templateRows.map(({ path, value }, idx) => (
                            <div
                              key={`${path}-${idx}`}
                              className="flex items-start justify-between gap-4 rounded-lg border bg-card text-card-foreground p-3"
                            >
                              <div className="text-sm font-medium truncate">{humanizeField(path)}</div>
                              <div className="text-sm text-muted-foreground text-right">
                                {formatValue(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  {!selectedCustomerId ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Välj kund</CardTitle>
                        <CardDescription>Ändringshistorik visas när en kund är vald.</CardDescription>
                      </CardHeader>
                    </Card>
                  ) : (
                    <ChangesHistoryPanel customerId={selectedCustomerId} />
                  )}
                </TabsContent>

              </Tabs>
            </div>
          )}
        </main>
      </div>

      {/* Footer för extra scroll-space */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <p>Diff Sync Admin Panel</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
