// src/components/Header.tsx
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import DbStatusIcon from "@/components/DbStatusIcon";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { baseLoginRequest } from "@/auth/msalConfig";

export function Header() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // Hämta namn/e-post från MSAL-kontot (ID-token)
  const name = accounts[0]?.name ?? "";
  const email = accounts[0]?.username ?? ""; // brukar vara e-post
  const displayName = name || email || "Inloggad";

  const getInitials = (n: string) =>
    n ? n.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase() : "?";

  const handleLogout = () => instance.logoutRedirect();
  const handleLogin = async () => {
    await instance.loginPopup(baseLoginRequest);
    // valfritt: navigera vidare efter login om header syns på publika sidor
    // navigate("/admin", { replace: true });
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-soft">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-semibold text-foreground">
          JSON Diff Manager
        </Link>
        <div className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground">
          Mock/Dev
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <DbStatusIcon />
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-foreground">{displayName}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>

            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(name || email)}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
              title="Logga ut"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button onClick={handleLogin} size="sm">
            Logga in
          </Button>
        )}
      </div>
    </header>
  );
}
