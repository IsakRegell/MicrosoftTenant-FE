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
}

export function CustomerDropdown({ selectedCustomerId, onCustomerSelect, onClose }: CustomerDropdownProps) {
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
    <div className="w-80 bg-card border border-border rounded-lg shadow-strong p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Välj kund</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">×</Button>
        </div>

        <Input
          placeholder="Sök kund..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />

        {selectedCustomer && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Vald kund</div>
            <div className="text-sm font-medium text-foreground">{selectedCustomer.name}</div>
            <div className="text-xs text-muted-foreground">{selectedCustomer.orgNumber}</div>
          </div>
        )}

        <ScrollArea className="max-h-64">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Laddar...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Inga kunder hittades</div>
          ) : (
            <div className="space-y-1">
              {filteredCustomers.map((customer) => (
                <Button
                  key={customer.id}
                  variant="ghost"
                  onClick={() => onCustomerSelect(customer.id)}
                  className={cn(
                    "w-full justify-start p-3 h-auto",
                    selectedCustomerId === customer.id && "bg-primary/10 text-primary"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.orgNumber} • {customer.contactEmail}
                      </div>
                    </div>

                    {selectedCustomerId === customer.id && (
                      <Check className="h-4 w-4 text-primary" />
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