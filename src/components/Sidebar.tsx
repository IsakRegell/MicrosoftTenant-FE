import { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CustomerDropdown } from './CustomerDropdown';

interface SidebarProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customerId: string) => void;
}

export function Sidebar({ selectedCustomerId, onCustomerSelect }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const { listCustomers } = await import('@/services/customers');
        const data = await listCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    loadCustomers();
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleCustomerButtonClick = () => {
    // If collapsed and customer is selected, don't open dropdown
    if (isCollapsed && selectedCustomerId) {
      return;
    }
    setIsCustomerDropdownOpen(!isCustomerDropdownOpen);
  };

  return (
    <div className={cn(
      "bg-gradient-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 relative min-h-screen",
      isCollapsed ? "w-14" : "w-64"
    )}>
      {/* Collapse/Expand Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-card border border-border shadow-medium hover:bg-accent z-10"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-3 w-3 text-foreground" />
        ) : (
          <PanelLeftClose className="h-3 w-3 text-foreground" />
        )}
      </Button>

      <div className="p-4 space-y-2">
        {/* Customer Section */}
        <div>
          {/* Show selected customer when collapsed */}
          {isCollapsed && selectedCustomer ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs text-center text-primary font-medium truncate w-full px-1">
                {selectedCustomer.name}
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handleCustomerButtonClick}
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "px-2"
              )}
            >
              <Users className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>Kunder</span>}
            </Button>
          )}

          {/* Inline Customer Dropdown - only when not collapsed */}
          {isCustomerDropdownOpen && !isCollapsed && (
            <div className="mt-2 pl-2">
              <CustomerDropdown
                selectedCustomerId={selectedCustomerId}
                onCustomerSelect={(customerId) => {
                  onCustomerSelect(customerId);
                  setIsCustomerDropdownOpen(false);
                }}
                onClose={() => setIsCustomerDropdownOpen(false)}
                inline
              />
            </div>
          )}

          {/* Floating dropdown when collapsed - only if no customer selected */}
          {isCustomerDropdownOpen && isCollapsed && !selectedCustomerId && (
            <div className="absolute left-full ml-2 top-0 z-20">
              <CustomerDropdown
                selectedCustomerId={selectedCustomerId}
                onCustomerSelect={(customerId) => {
                  onCustomerSelect(customerId);
                  setIsCustomerDropdownOpen(false);
                }}
                onClose={() => setIsCustomerDropdownOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}