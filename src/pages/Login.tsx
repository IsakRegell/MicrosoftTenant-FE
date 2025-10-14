// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Settings } from "lucide-react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { baseLoginRequest } from "@/auth/msalConfig";

export default function Login() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Navigera vidare EN gång när man blir inloggad (ingen <Navigate/> i render)
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await instance.loginPopup(baseLoginRequest);
    } catch (err) {
      console.error("Login failed:", err);
      alert("Inloggning misslyckades. Se konsolen för detaljer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">JSON Diff Manager</h1>
          <p className="text-white/80">Hantera JSON-skillnader mellan template och kunddata</p>
        </div>

        <Card className="shadow-strong border-0">
          <CardHeader className="text-center">
            <CardTitle>Välj din roll</CardTitle>
            <CardDescription>Logga in med din företagsidentitet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-primary hover:bg-primary-hover transition-all duration-200"
              size="lg"
            >
              <Settings className="h-5 w-5 mr-2" />
              Logga in som Admin
            </Button>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              <UserCheck className="h-5 w-5 mr-2" />
              Logga in som Kund
            </Button>

            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">Loggar in...</div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-white/60 text-sm">
          <div className="bg-white/10 rounded-lg p-3 border border-white/20">
            <div className="font-medium mb-1">Entra ID aktivt</div>
            <div>Popupen öppnas vid klick.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
