import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import Locales from "@/pages/Locales";
import Trabajadores from "@/pages/Trabajadores";
import Caja from "@/pages/Caja";
import Servicios from "@/pages/Servicios";
import Inventario from "@/pages/Inventario";
import Reportes from "@/pages/Reportes";
import Configuraciones from "@/pages/Configuraciones";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { AppearanceDialog } from "@/components/AppearanceDialog";
import { ITEMS_NAV, puedeAcceder, rutaInicio } from "@/lib/navegacion";
import LocalDetail from "@/pages/LocalDetail"; // IMPORTAMOS LA NUEVA PÁGINA

// Envuelve una pantalla: si el usuario no tiene el permiso, lo manda a su inicio
const Protegida = ({ url, children }: { url: string; children: JSX.Element }) => {
  const { user } = useAuth();
  const item = ITEMS_NAV.find(i => i.url === url);
  if (item && !puedeAcceder(item, user)) return <Navigate to={rutaInicio(user)} replace />;
  return children;
};

export const MainAppLayout = () => {
  const { user, username, rolNombre, logout } = useAuth();
  const inicio = rutaInicio(user);
  const userInitials = username ? username.substring(0, 2).toUpperCase() : '??';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
        <AppSidebar />
        
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-border/50">
            <SidebarTrigger className="hover:bg-stylepro-lavender-100 hover:text-stylepro-lavender-700 transition-colors" />
            
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground capitalize">{username}</p>
                <p className="text-xs text-muted-foreground">{rolNombre}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-stylepro-lavender-500 to-stylepro-gold-500 rounded-full flex items-center justify-center" aria-hidden>
                <span className="text-white font-semibold text-sm">{userInitials}</span>
              </div>
              <AppearanceDialog />
              <ChangePasswordDialog />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to={inicio} replace />} />
              <Route path="/dashboard" element={<Protegida url="/dashboard"><Dashboard /></Protegida>} />
              <Route path="/caja" element={<Protegida url="/caja"><Caja /></Protegida>} />
              <Route path="/locales" element={<Protegida url="/locales"><Locales /></Protegida>} />
              <Route path="/locales/:localId" element={<Protegida url="/locales"><LocalDetail /></Protegida>} />
              <Route path="/trabajadores" element={<Protegida url="/trabajadores"><Trabajadores /></Protegida>} />
              <Route path="/servicios" element={<Protegida url="/servicios"><Servicios /></Protegida>} />
              <Route path="/inventario" element={<Protegida url="/inventario"><Inventario /></Protegida>} />
              <Route path="/reportes" element={<Protegida url="/reportes"><Reportes /></Protegida>} />
              <Route path="/configuraciones" element={<Protegida url="/configuraciones"><Configuraciones /></Protegida>} />
              <Route path="/sin-acceso" element={<SinAcceso />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Cuenta sin ninguna pantalla asignada (rol sin permisos)
const SinAcceso = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
    <div className="max-w-sm space-y-2">
      <h1 className="text-2xl font-bold">Tu cuenta aún no tiene accesos</h1>
      <p className="text-muted-foreground">Pide al administrador que revise el rol y los permisos de tu usuario.</p>
    </div>
  </div>
);
