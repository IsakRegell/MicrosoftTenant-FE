import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-soft">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          JSON Diff Manager
        </h1>
        <div className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground">
          Mock/Dev
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-foreground">{user?.name}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {user?.name ? getInitials(user.name) : '?'}
          </AvatarFallback>
        </Avatar>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={logout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}