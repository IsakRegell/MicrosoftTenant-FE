import { useState, useEffect } from 'react';
import { Check, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CustomerListItem } from '@/types/customer';
import { listCustomers } from '@/services/customers';
import { getActiveCustomers, getInactiveCustomers } from '@/services/customers';

interface CustomerDropdownProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customerId: string) => void;
  onClose: () => void;
  inline?: boolean;
}

export function CustomerDropdown({ selectedCustomerId, onCustomerSelect, onClose, inline = false }: CustomerDropdownProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await listCustomers();
      // 🔥 Filtrera direkt vid laddning → endast aktiva
      setCustomers(data.filter(c => c.isActive === true));
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Behåll sökfiltrering ovanpå de redan aktiva
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.orgNumber?.includes(searchQuery) ||
    customer.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className={cn(
      "bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-6 animate-fade-in",
      inline ? "w-full shadow-medium" : "w-96 shadow-strong z-50"
    )}>
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-foreground">Välj kund</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            ×
          </Button>
        </div>

        <div className="relative">
          <Input
            placeholder="Sök efter företag, org.nr eller e-post..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-4 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {selectedCustomer && (
          <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-xl relative overflow-hidden group animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-primary/80 font-bold uppercase tracking-wider">Vald kund</span>
              </div>
              <div className="text-base font-bold text-primary mb-1">{selectedCustomer.name}</div>
              <div className="text-xs text-primary/70 font-medium">{selectedCustomer.orgNumber}</div>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-80 pr-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Laddar kunder...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <div className="text-sm font-medium">Inga kunder hittades</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers.map((customer, index) => (
                <Button
                  key={customer.id}
                  variant="ghost"
                  onClick={() => onCustomerSelect(customer.id)}
                  className={cn(
                    "w-full justify-start p-4 h-auto rounded-xl transition-all duration-200 group hover:shadow-md animate-fade-in",
                    selectedCustomerId === customer.id 
                      ? "bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border-2 border-primary/30 shadow-md" 
                      : "hover:bg-accent/50 border-2 border-transparent"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
                      selectedCustomerId === customer.id
                        ? "bg-gradient-to-br from-primary to-primary-hover shadow-lg"
                        : "bg-muted group-hover:bg-primary/10"
                    )}>
                      <Building2 className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        selectedCustomerId === customer.id ? "text-white" : "text-primary"
                      )} />
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className={cn(
                        "font-bold text-sm truncate mb-1 transition-colors duration-200",
                        selectedCustomerId === customer.id ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {customer.name}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="truncate font-medium">{customer.orgNumber}</div>
                        <div className="truncate opacity-75">{customer.contactEmail}</div>
                      </div>
                    </div>

                    {selectedCustomerId === customer.id && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
