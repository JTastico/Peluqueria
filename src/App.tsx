// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/auth/LoginPage";
import { MainAppLayout } from "./components/MainAppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth"; // Importa AuthProvider y useAuth

const queryClient = new QueryClient();

// Componente para proteger las rutas. Verifica si el usuario ha iniciado sesión.
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth(); // Usa el estado de autenticación del hook
  if (!isAuthenticated) {
    // Si no está autenticado, lo redirige a la página de login
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors position="top-right" />
      <BrowserRouter>
        {/* Envuelve toda la aplicación con AuthProvider */}
        <AuthProvider>
          <Routes>
            {/* Ruta Pública: Solo se puede acceder sin iniciar sesión */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas Privadas: Requieren iniciar sesión */}
            <Route 
              path="/*"
              element={
                <ProtectedRoute>
                  <MainAppLayout />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;