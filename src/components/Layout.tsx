import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar'; // Asumo que tienes este componente
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// El Layout recibe los componentes hijos (las páginas)
export const Layout = ({ children }: { children: ReactNode }) => {
  const { userRole, logout } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-6 sticky top-0 z-10">
          <div className="flex-1">
            <h1 className="text-sm font-medium text-muted-foreground">
              Acceso como: <span className="font-semibold text-foreground capitalize">{userRole}</span>
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};