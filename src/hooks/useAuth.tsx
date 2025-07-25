// src/hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Definimos la interfaz para el contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  username: string | null;
  localId: string | null; // Cambiado a string ya que viene de localStorage
  login: (username: string, role: string, localId?: number | null) => void;
  logout: () => void;
}

// Creamos el contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de autenticación que envuelve la aplicación
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('userRole'));
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem('userRole'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));
  const [localId, setLocalId] = useState<string | null>(() => localStorage.getItem('localId'));
  const navigate = useNavigate();

  // Sincroniza el estado de React con localStorage al cargar la app
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedUsername = localStorage.getItem('username');
    const storedLocalId = localStorage.getItem('localId');

    if (storedRole) {
      setIsAuthenticated(true);
      setUserRole(storedRole);
      setUsername(storedUsername);
      setLocalId(storedLocalId);
    }
  }, []);

  // Función para iniciar sesión
  const login = (newUsername: string, newRole: string, receivedLocalId?: number | null) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', newRole);
    localStorage.setItem('username', newUsername);
    if (receivedLocalId !== undefined && receivedLocalId !== null) {
      localStorage.setItem('localId', String(receivedLocalId));
      setLocalId(String(receivedLocalId));
    } else {
      localStorage.removeItem('localId'); // Asegúrate de limpiar si no hay localId
      setLocalId(null);
    }
    setIsAuthenticated(true);
    setUserRole(newRole);
    setUsername(newUsername);
  };

  // Función para cerrar sesión (ya estaba correcta)
  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('localId');
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername(null);
    setLocalId(null);
    toast.info("Has cerrado la sesión.");
    navigate('/login');
  };

  const value = {
    isAuthenticated,
    userRole,
    username,
    localId,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para consumir el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};