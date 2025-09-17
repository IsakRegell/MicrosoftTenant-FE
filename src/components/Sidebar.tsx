import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
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

  return (
    <div className={cn(
      "bg-gradient-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 relative",
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
          <ChevronRight className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-foreground" />
        )}
      </Button>

      <div className="p-4 space-y-2">
        {/* Customer Section */}
        <div>
          <Button
            variant="ghost"
            onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isCollapsed && "px-2"
            )}
          >
            <Users className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Kunder</span>}
          </Button>

          {/* Inline Customer Dropdown */}
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

          {/* Floating dropdown when collapsed */}
          {isCustomerDropdownOpen && isCollapsed && (
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