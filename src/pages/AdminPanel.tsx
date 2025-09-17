import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, Building2, Mail, Hash, History, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ComparisonTableView } from '@/components/ComparisonTableView';
import { CompareResponse, Decision } from '@/types/diff';
import { CustomerListItem } from '@/types/customer';
import { compareCheck, compareApply } from '@/services/api';
import { listCustomers } from '@/services/customers';

export default function AdminPanel() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem>();
  const [compareData, setCompareData] = useState<CompareResponse>();
  const [pendingDecisions, setPendingDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('compare');
  const { toast } = useToast();

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerData();
      loadCompareData();
    }
  }, [selectedCustomerId]);

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

  const loadCompareData = async () => {
    if (!selectedCustomerId) return;
    
    setIsLoading(true);
    try {
      const data = await compareCheck(selectedCustomerId);
      setCompareData(data);
      setPendingDecisions([]); // Reset pending decisions
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

  const handleDecision = (decision: Decision) => {
    setPendingDecisions(prev => {
      // Remove any existing decision for this path, then add the new one
      const filtered = prev.filter(d => d.path !== decision.path);
      return [...filtered, decision];
    });
  };

  const handleSave = async () => {
    if (!selectedCustomerId || pendingDecisions.length === 0) return;
    
    setIsSaving(true);
    try {
      const updatedData = await compareApply(selectedCustomerId, pendingDecisions);
      setCompareData(updatedData);
      setPendingDecisions([]);
      
      toast({
        title: "Sparat",
        description: `${pendingDecisions.length} ändringar har tillämpats`,
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
          ) : isLoading ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laddar jämförelsedata...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Info Header */}
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
                        {compareData && (
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

              {/* Tabs for different views */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="compare" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Jämför Data
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
                      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      Uppdatera data
                    </Button>
                  </div>
                  {/* Comparison Table View */}
                  {compareData && (
                    <ComparisonTableView
                      template={compareData.template}
                      customerData={compareData.customerData}
                      diffs={compareData.diffs}
                      onDecision={handleDecision}
                      pendingDecisions={pendingDecisions}
                      isLoading={isLoading}
                    />
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={() => {/* TODO: Load history data */}}
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