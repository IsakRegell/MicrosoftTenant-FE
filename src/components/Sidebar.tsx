import { useState, useEffect, useMemo } from "react";
import { PanelLeftClose, PanelLeftOpen, Users, Building2, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CustomerListItem } from "@/types/customer";
import { getActiveCustomers, getInactiveCustomers } from "@/services/customers";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customerId: string) => void;
}

function norm(s: string) {
  return s
    .toLocaleLowerCase("sv")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, ""); 
}


export function Sidebar({ selectedCustomerId, onCustomerSelect }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // separata listor
  const [activeCustomers, setActiveCustomers] = useState<CustomerListItem[]>([]);
  const [inactiveCustomers, setInactiveCustomers] = useState<CustomerListItem[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);

  // customerId -> objectId (för korrekt DELETE)
  const [idToObjectId, setIdToObjectId] = useState<Record<string, string>>({});

  // confirm-dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CustomerListItem | null>(null);

  // SÖKNING
  const [search, setSearch] = useState("");

  // Hämta aktiva direkt
  useEffect(() => {
    (async () => {
      try {
        const activesRaw = await getActiveCustomers();
        const map: Record<string, string> = {};
        const actives = activesRaw.map((c) => {
          map[c.customerId ?? ""] = c.objectId;
          return {
            id: c.customerId!,
            customerId: c.customerId!,
            name: c.name,
            orgNumber: c.orgNumber,
            contactEmail: c.contactEmail,
            isActive: true,
          } as CustomerListItem;
        });
        setActiveCustomers(actives);
        setIdToObjectId((prev) => ({ ...prev, ...map }));
      } catch (e) {
        console.error("Failed to load active customers:", e);
      }
    })();
  }, []);

  // Hämta inaktiva när togglen slås på
  useEffect(() => {
    if (!showInactive || loadingInactive || inactiveCustomers.length > 0) return;
    setLoadingInactive(true);
    (async () => {
      try {
        const inactivesRaw = await getInactiveCustomers();
        const map: Record<string, string> = {};
        const inactives = inactivesRaw.map((c) => {
          map[c.customerId ?? ""] = c.objectId;
          return {
            id: c.customerId!,
            customerId: c.customerId!,
            name: c.name,
            orgNumber: c.orgNumber,
            contactEmail: c.contactEmail,
            isActive: false,
          } as CustomerListItem;
        });
        setInactiveCustomers(inactives);
        setIdToObjectId((prev) => ({ ...prev, ...map }));
      } catch (e) {
        console.error("Failed to load inactive customers:", e);
      } finally {
        setLoadingInactive(false);
      }
    })();
  }, [showInactive, loadingInactive, inactiveCustomers.length]);

  const allCustomers = [...activeCustomers, ...inactiveCustomers];
  const selectedCustomer = allCustomers.find((c) => c.id === selectedCustomerId);

  // ——— RADERA: UI-modal istället för window.prompt ———
  const askDelete = (customer: CustomerListItem) => {
    setToDelete(customer);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!toDelete) return;
    try {
      const { deleteCustomer } = await import("@/services/customers");
      const objectId = idToObjectId[toDelete.id] ?? toDelete.id; // customerId -> objectId
      await deleteCustomer(objectId);

      setActiveCustomers(prev => prev.filter(c => c.id !== toDelete.id));
      setInactiveCustomers(prev => prev.filter(c => c.id !== toDelete.id));
      if (selectedCustomerId === toDelete.id) onCustomerSelect("");
    } catch (err) {
      console.error(err);
      alert("Misslyckades att ta bort kund.");
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const filteredActive = useMemo(() => {
    if (!search) return activeCustomers;
    const n = norm(search);
    return activeCustomers.filter(c => norm(c.name).startsWith(n));
  }, [activeCustomers, search]);

  const filteredInactive = useMemo(() => {
    if (!search) return inactiveCustomers;
    const n = norm(search);
    return inactiveCustomers.filter(c => norm(c.name).startsWith(n));
  } , [inactiveCustomers, search]);


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
        {isCollapsed ? <PanelLeftOpen className="h-3 w-3 text-foreground" /> : <PanelLeftClose className="h-3 w-3 text-foreground" />}
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
        <div className="p-3">
          <label htmlFor="customer-search" className="sr-only">Sök kund</label>
          <Input
            id="customer-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök kund…"
          />
        </div>


        {/* Filter */}
        {!isCollapsed && (
          <label className="flex items-center gap-2 px-1 select-none">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
            <Filter className="h-4 w-4 opacity-70" />
            <span className="text-sm">Visa även inaktiva</span>
          </label>
        )}

        {/* Lista */}
        {!isCollapsed && (
          <div className="space-y-4 mt-1">
            {/* Aktiva */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Aktiva</div>
              <div className="space-y-1">
                {filteredActive.map((c) => (
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
                      onClick={() => askDelete(c)}
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
                  {loadingInactive ? (
                    <div className="text-xs text-muted-foreground">Laddar inaktiva…</div>
                  ) : (
                    <>
                      {showInactive && filteredInactive.map((c) => (
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
                            onClick={() => askDelete(c)}
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        </div>
                      ))}
                      {inactiveCustomers.length === 0 && (
                        <div className="text-xs text-muted-foreground">Inga inaktiva kunder.</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bekräftelse-modal */}
      <ConfirmDeleteDialog
        open={confirmOpen}
        customerName={toDelete?.name ?? ""}
        onConfirm={performDelete}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
      />
    </div>
  );
}
