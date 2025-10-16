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
    <header className="h-20 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border/50 backdrop-blur-xl flex items-center justify-between px-8 shadow-medium sticky top-0 z-50 transition-all duration-300">
      <div className="flex items-center gap-6">
        <Link 
          to="/" 
          className="group flex items-center gap-3 transition-transform duration-200 hover:scale-105"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">JD</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              JSON Diff Manager
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              Data Management Suite
            </span>
          </div>
        </Link>
        <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs text-primary font-semibold animate-fade-in">
          Development Mode
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="transform transition-transform duration-200 hover:scale-105">
          <DbStatusIcon />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <div className="text-right hidden md:block animate-fade-in">
              <div className="text-sm font-semibold text-foreground">{displayName}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all duration-300" />
              <Avatar className="h-10 w-10 relative ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-hover text-primary-foreground text-sm font-bold">
                  {getInitials(name || email)}
                </AvatarFallback>
              </Avatar>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              title="Logga ut"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button 
            onClick={handleLogin} 
            size="sm"
            className="bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-all duration-200"
          >
            Logga in
          </Button>
        )}
      </div>
    </header>
  );
}
