// src/pages/CustomerView.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { ComparisonTableView } from '@/components/ComparisonTableView';
import { CompareResponse, Decision, UiDecision } from '@/types/diff';
import { compareCheck, compareApply, toJsonPath } from '@/services/api';

export default function CustomerView() {
  const [compareData, setCompareData] = useState<CompareResponse>();
  const [pendingDecisions, setPendingDecisions] = useState<UiDecision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // TODO: Koppla kund-id till inloggad användare (claims/grupp) senare.
  const customerId = "customer-data";

  useEffect(() => {
    loadCompareData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCompareData = async () => {
    setIsLoading(true);
    try {
      const data = await compareCheck(customerId);
      setCompareData(data);
      setPendingDecisions([]);
    } catch (error) {
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda jämförelsedata",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = (decision: UiDecision) => {
    setPendingDecisions(prev => {
      const filtered = prev.filter(d => d.path !== decision.path);
      // 'undo' = rensa val, lägg inte till något
      if (decision.action === 'undo') return filtered;
      return [...filtered, decision];
    });
  };

  const handleApplyAllTemplate = () => {
    if (!compareData) return;

    const allTemplateDecisions: UiDecision[] = compareData.diffs.map(diff => ({
      path: diff.path,                 // slash-format i UI
      action: "applyTemplate" as const
    }));

    setPendingDecisions(allTemplateDecisions);

    toast({
      title: "Alla mallvärden valda",
      description: `${allTemplateDecisions.length} ändringar kommer att tillämpas`,
    });
  };

  const handleSave = async () => {
    // Bygg beslut för API: ta bort 'undo' och 'keepCustomer' + konvertera path
    const toSend: Decision[] = pendingDecisions
      .filter(d => d.action !== 'undo' && d.action !== 'keepCustomer')
      .map(d => {
        const base: Decision = {
          path: toJsonPath(d.path),                   // "/a/b/0" -> "$.a.b[0]"
          action: d.action as Decision['action'],     // 'applyTemplate' | 'set' | 'remove'
        };
        const v = (d as any)?.value;
        return base.action === 'set' && v !== undefined ? { ...base, value: v } : base;
      });

    if (toSend.length === 0) return;

    setIsSaving(true);
    try {
      const updatedData = await compareApply(customerId, toSend);
      setCompareData(updatedData);
      setPendingDecisions([]);

      toast({
        title: "Sparat",
        description: `${toSend.length} ändringar har tillämpats`,
      });
    } catch (error) {
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara ändringarna",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Räknare för verkliga ändringar (ignorera undo/keepCustomer)
  const realPendingCount = pendingDecisions.filter(d => d.action !== 'undo' && d.action !== 'keepCustomer').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar din data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Headerkort */}
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Din JSON-konfiguration</CardTitle>
                  <CardDescription>
                    Granska skillnader mellan template och din konfiguration
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  {compareData && (
                    <Badge variant="secondary" className="gap-1">
                      {compareData.diffs.length} skillnader
                    </Badge>
                  )}
                  {realPendingCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      {realPendingCount} väntande ändringar
                    </Badge>
                  )}

                  <Button
                    variant="outline"
                    onClick={loadCompareData}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Uppdatera
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={realPendingCount === 0 || isSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Sparar...' : 'Spara ändringar'}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Diff-sammanfattning */}
          {compareData && compareData.diffs.length > 0 && (
            <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <CardTitle className="text-lg">Sammanfattning av skillnader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {compareData.diffs.map((diff, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="gap-1"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          diff.type === 'typeMismatch' ? 'bg-diff-type-mismatch' :
                          diff.type === 'valueMismatch' ? 'bg-diff-value-mismatch' :
                          diff.type === 'missing' ? 'bg-diff-missing' :
                          diff.type === 'unexpected' ? 'bg-diff-unexpected' :
                          'bg-diff-length-mismatch'
                        }`}
                      />
                      {diff.path} ({diff.type})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabellvy */}
          {compareData && (
            <ComparisonTableView
              template={compareData.template}
              customerData={compareData.customerData}
              diffs={compareData.diffs}
              onDecision={handleDecision}
              pendingDecisions={pendingDecisions}
              onApplyAllTemplate={handleApplyAllTemplate}
            />
          )}
        </div>
      </main>
    </div>
  );
}
