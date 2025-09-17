import { useState, useEffect } from 'react';
import { Check, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CustomerListItem } from '@/types/customer';
import { listCustomers } from '@/services/customers';

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
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.orgNumber?.includes(searchQuery) ||
    customer.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className={cn(
      "bg-sidebar-background/95 backdrop-blur-sm border border-sidebar-border rounded-lg p-4",
      inline ? "w-full shadow-soft" : "w-80 shadow-strong z-50"
    )}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-sidebar-foreground">Välj kund</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-foreground">×</Button>
        </div>

        <Input
          placeholder="Sök kund..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60"
        />

        {selectedCustomer && (
          <div className="p-3 bg-sidebar-accent border border-sidebar-border rounded-lg">
            <div className="text-xs text-sidebar-foreground/60 mb-1">Vald kund</div>
            <div className="text-sm font-medium text-sidebar-foreground">{selectedCustomer.name}</div>
            <div className="text-xs text-sidebar-foreground/60">{selectedCustomer.orgNumber}</div>
          </div>
        )}

        <ScrollArea className="max-h-64">
          {loading ? (
            <div className="text-center py-4 text-sidebar-foreground/60 text-sm">Laddar...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-4 text-sidebar-foreground/60 text-sm">Inga kunder hittades</div>
          ) : (
            <div className="space-y-1">
              {filteredCustomers.map((customer) => (
                  <Button
                  key={customer.id}
                  variant="ghost"
                  onClick={() => onCustomerSelect(customer.id)}
                  className={cn(
                    "w-full justify-start p-3 h-auto text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-foreground min-h-[60px]",
                    selectedCustomerId === customer.id && "bg-sidebar-primary/20 text-sidebar-primary"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-8 w-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-sidebar-foreground/60" />
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm truncate">{customer.name}</div>
                      <div className="text-xs text-sidebar-foreground/70 space-y-0.5">
                        <div className="truncate">{customer.orgNumber}</div>
                        <div className="truncate">{customer.contactEmail}</div>
                      </div>
                    </div>

                    {selectedCustomerId === customer.id && (
                      <Check className="h-4 w-4 text-sidebar-primary" />
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