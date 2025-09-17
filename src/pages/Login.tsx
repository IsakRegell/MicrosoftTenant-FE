import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    const redirectTo = user?.role === 'admin' ? '/admin' : '/customer';
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (role: UserRole) => {
    setIsLoading(true);
    
    // TODO: Replace with Entra ID integration
    // Example: await signInWithRedirect(msalInstance, loginRequest);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    login(role);
    setIsLoading(false);
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
            <CardDescription>
              {/* TODO: Entra ID integration placeholder */}
              Logga in med din företagsidentitet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleLogin('admin')}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-primary hover:bg-primary-hover transition-all duration-200"
              size="lg"
            >
              <Settings className="h-5 w-5 mr-2" />
              Logga in som Admin
            </Button>

            <Button
              onClick={() => handleLogin('customer')}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              <UserCheck className="h-5 w-5 mr-2" />
              Logga in som Kund
            </Button>

            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">
                Loggar in...
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-white/60 text-sm">
          {/* TODO: Replace with real Entra ID login flow */}
          <div className="bg-white/10 rounded-lg p-3 border border-white/20">
            <div className="font-medium mb-1">🚧 Utvecklingsläge</div>
            <div>Entra ID-integration kommer implementeras</div>
          </div>
        </div>
      </div>
    </div>
  );
}