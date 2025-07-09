import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import Locales from "@/pages/Locales";
import Peluqueros from "@/pages/Peluqueros";
import Clientes from "@/pages/Clientes";
import Servicios from "@/pages/Servicios";
import Inventario from "@/pages/Inventario";
import Reportes from "@/pages/Reportes";
import Configuraciones from "@/pages/Configuraciones";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export const MainAppLayout = () => {
  const { userRole, username, logout } = useAuth(); // Usamos 'username' en lugar de 'userRole' para el display
  
  const userInitials = username ? username.substring(0, 2).toUpperCase() : '??';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-border/50">
            <SidebarTrigger className="hover:bg-stylepro-lavender-100 hover:text-stylepro-lavender-700 transition-colors" />
            
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground capitalize">{username}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-stylepro-lavender-500 to-stylepro-gold-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{userInitials}</span>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={logout}>
                  <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/locales" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/locales" element={<Locales />} />
              <Route path="/peluqueros" element={<Peluqueros />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuraciones" element={<Configuraciones />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};