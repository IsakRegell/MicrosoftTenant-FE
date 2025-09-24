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
import type { DiffItem, Decision } from '@/types/diff';
import { CustomerListItem } from '@/types/customer';

// API
import {
  compareApply,
  compareSaved,
  CompareSavedResponse,
  getTemplate,        // används för att alltid visa mallen
} from '@/services/api';
import { listCustomers } from '@/services/customers';

export default function AdminPanel() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem>();

  // Det vi renderar i tabellen (template + customerData + diffs)
  const [compareData, setCompareData] = useState<CompareSavedResponse | null>(null);

  const [pendingDecisions, setPendingDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('compare');

  // Visa liten info-ruta om payload saknas
  const [missingPayload, setMissingPayload] = useState(false);

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

  // Ladda diff + data. Vid fel (oavsett orsak) hämtar vi TEMPLATEN och renderar den.
  const loadCompareData = useCallback(async () => {
    if (!selectedCustomerId) return;

    setIsLoading(true);
    try {
      const data = await compareSaved(selectedCustomerId);
      setCompareData(data);
      setPendingDecisions([]);
      setMissingPayload(false); // payload fanns
    } catch (error: any) {
      // Oavsett fel: försök åtminstone visa mallen
      try {
        const tpl = await getTemplate(selectedCustomerId);
        const templateOnly: CompareSavedResponse = {
          status: 'ok',
          diffs: [],
          template: tpl,
          customerData: {}, // ingen payload
        };
        setCompareData(templateOnly);
        setMissingPayload(true);   // visa lilla infon
      } catch (innerErr) {
        // Kunde inte ens hämta template → rensa och visa fel
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
      return;
    }

    // Rensa först så inget gammalt visas
    setCompareData(null);
    setPendingDecisions([]);
    setMissingPayload(false);

    // Ladda ny data
    loadCustomerData();
    loadCompareData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const handleDecision = (decision: Decision) => {
    setPendingDecisions(prev => {
      const filtered = prev.filter(d => d.path !== decision.path);
      return [...filtered, decision];
    });
  };

  const handleSave = async () => {
    if (!selectedCustomerId || pendingDecisions.length === 0) return;

    setIsSaving(true);
    try {
      await compareApply(selectedCustomerId, pendingDecisions);
      setPendingDecisions([]);
      await loadCompareData(); // uppdatera vy efter apply
      toast({
        title: 'Sparat',
        description: 'Ändringarna har tillämpats och visningen är uppdaterad.',
      });
    } catch (error) {
      toast({
        title: 'Fel vid sparande',
        description: 'Kunde inte spara ändringarna',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ======================
  // TEMPLATE-PLATT VY
  // ======================

  // Gör fältnamn läsbara (camelCase → “Camel case”)
  const humanizeField = (path: string) => {
    const last = path.split('/').filter(Boolean).pop() ?? path;
    return last
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  };

  // Samma värdeformatterare som i jämförelsen
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '–';
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nej';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return `Lista med ${value.length} objekt`;
    if (typeof value === 'object') return `Objekt med ${Object.keys(value).length} fält`;
    return String(value);
  };

  // Platta ut JSON till lista med leaf-värden (“/user/firstName” → “Isak”)
  const flattenTemplate = (obj: any, prefix = ''): Array<{ path: string; value: any }> => {
    const out: Array<{ path: string; value: any }> = [];
    const isLeaf = (v: any) =>
      v === null ||
      v === undefined ||
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean';

    if (Array.isArray(obj)) {
      // För listor: skriv en rad för listan (sammanfattning), och sedan leafs om elementen är objekt
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
      // Skriv en rad för objektet också (sammanfattning)
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

    // Leaf
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
                        {compareData?.diffs && compareData.diffs.length > 0 && (
                          <Badge variant="secondary">
                            {compareData.diffs.length} skillnader
                          </Badge>
                        )}
                        {pendingDecisions.length > 0 && (
                          <Badge variant="outline">
                            {pendingDecisions.length} väntande ändringar
                          </Badge>
                        )}
                        <Button
                          onClick={handleSave}
                          disabled={pendingDecisions.length === 0 || isSaving}
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
                {/* 3 flikar: Jämför / Template / Historik */}
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="compare" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Jämför Data
                  </TabsTrigger>

                  {/* NY FLIK: TEMPLATE */}
                  <TabsTrigger value="template" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Template
                  </TabsTrigger>

                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Ändringshistorik
                  </TabsTrigger>
                </TabsList>

                {/* JÄMFÖR */}
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

                  {/* Info-ruta när payload saknas men mallen visas */}
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
                      template={compareData.template}          // Mallvärde (alltid)
                      customerData={compareData.customerData}  // Tomt objekt om payload saknas
                      diffs={(compareData.diffs ?? []) as DiffItem[]} // Tom array om payload saknas
                      onDecision={handleDecision}
                      pendingDecisions={pendingDecisions}
                      isLoading={isLoading}
                    />
                  )}
                </TabsContent>

                {/* TEMPLATE-PLATT VY */}
                <TabsContent value="template" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={loadCompareData} // räcker, eftersom compareData.template sätts där
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

                {/* HISTORIK (placeholder) */}
                <TabsContent value="history" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={() => { /* TODO: Load history data */ }}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Uppdatera historik
                    </Button>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Ändringshistorik
                      </CardTitle>
                      <CardDescription>
                        Här kommer du att kunna se alla ändringar som har gjorts för denna kund
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                      <div className="text-muted-foreground">
                        Ändringshistorik kommer att implementeras när databasen är ansluten
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
