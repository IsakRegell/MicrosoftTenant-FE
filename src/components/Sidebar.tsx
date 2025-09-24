import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, Users, Building2, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CustomerListItem } from "@/types/customer";

interface SidebarProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customerId: string) => void;
}

export function Sidebar({ selectedCustomerId, onCustomerSelect }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // ✅ Hämta listItems (har fältet `id` som AdminPanel/Sidebar använder)
        const { listCustomers } = await import("@/services/customers");
        const data = await listCustomers();
        setCustomers(data);
      } catch (e) {
        console.error("Failed to load customers:", e);
      }
    };
    load();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const activeCustomers = customers.filter((c) => c.isActive !== false);
  const inactiveCustomers = customers.filter((c) => c.isActive === false);

  const handleDelete = async (customer: CustomerListItem) => {
    const input = prompt(
      `Är du säker på att du vill radera ${customer.name}? Skriv "ja-tabort!" för att bekräfta.`
    );
    if (input !== "ja-tabort!") return;

    try {
      const { deleteCustomer } = await import("@/services/customers");
      // ✅ I din service är listItem.id = objectId → funkar för DELETE
      await deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      if (selectedCustomerId === customer.id) onCustomerSelect("");
      alert(`Kund ${customer.name} borttagen.`);
    } catch (err) {
      console.error(err);
      alert("Misslyckades att ta bort kund.");
    }
  };

  return (
    <div
      className={cn(
        "bg-gradient-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 relative min-h-screen",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Collapse/Expand */}
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

      <div className="p-4 space-y-3">
        {/* Header */}
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
          <div className={cn("w-full flex items-center", isCollapsed && "justify-center")}>
            <Users className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span className="font-medium">Kunder</span>}
          </div>
        )}

        {/* Filter (bara när ej kollapsad) */}
        {!isCollapsed && (
          <label className="flex items-center gap-2 px-1 select-none">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
            <Filter className="h-4 w-4 opacity-70" />
            <span className="text-sm">Visa även inaktiva</span>
          </label>
        )}

        {/* Lista (endast när ej kollapsad) */}
        {!isCollapsed && (
          <div className="space-y-4 mt-1">
            {/* Aktiva */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Aktiva</div>
              <div className="space-y-1">
                {activeCustomers.map((c) => (
                  <div key={c.id} className="flex items-center gap-1">
                    <Button
                      // ✅ vald kund = secondary, annars ghost med mörk hover (inte vit)
                      variant={c.id === selectedCustomerId ? "secondary" : "ghost"}
                      onClick={() => onCustomerSelect(c.id)}
                      className={cn(
                        "flex-1 justify-start",
                        c.id !== selectedCustomerId &&
                          "hover:bg-black/25 hover:text-inherit hover:ring-1 hover:ring-gray-600/40 hover:ring-inset"
                      )}
                    >
                      {c.name}
                    </Button>

                    {/* liten röd soptunna (1/4 storlek) */}
                    <Button
                      aria-label={`Ta bort ${c.name}`}
                      variant="destructive"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => handleDelete(c)}
                    >
                      <Trash2 className="h-2 w-2" />
                    </Button>
                  </div>
                ))}
                {activeCustomers.length === 0 && (
                  <div className="text-xs text-muted-foreground">Inga aktiva kunder.</div>
                )}
              </div>
            </div>

            {/* Inaktiva */}
            {showInactive && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Inaktiva</div>
                <div className="space-y-1">
                  {inactiveCustomers.map((c) => (
                    <div key={c.id} className="flex items-center gap-1">
                      <Button
                        variant={c.id === selectedCustomerId ? "secondary" : "ghost"}
                        onClick={() => onCustomerSelect(c.id)}
                        className={cn(
                          "flex-1 justify-start",
                          c.id !== selectedCustomerId &&
                            "hover:bg-black/25 hover:text-inherit hover:ring-1 hover:ring-gray-600/40 hover:ring-inset"
                        )}
                      >
                        {c.name}
                      </Button>
                      <Button
                        aria-label={`Ta bort ${c.name}`}
                        variant="destructive"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                  {inactiveCustomers.length === 0 && (
                    <div className="text-xs text-muted-foreground">Inga inaktiva kunder.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
