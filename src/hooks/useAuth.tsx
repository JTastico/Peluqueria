// src/hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_URL, clearSession, getToken, tokenExpirado } from '@/lib/api';
import { PREFS_POR_DEFECTO, Preferencias, aplicarPreferencias } from '@/lib/prefs';

export interface LocalAcceso { id: string; nombre: string; type?: string }

export interface SessionUser {
  id: string;
  username: string;
  role: string;
  rol_nombre: string;
  alcance: 'global' | 'local' | 'multi';
  local_id: string | null;
  trabajador_id: string | null;
  permisos: string[];
  locales: LocalAcceso[];
  preferencias: Preferencias;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: SessionUser | null;
  userRole: string | null;       // id del rol (admin, encargado, ...)
  rolNombre: string | null;
  username: string | null;
  localId: string | null;        // local propio (o base)
  trabajadorId: string | null;
  alcance: 'global' | 'local' | 'multi' | null;
  esGlobal: boolean;             // llega a todos los locales
  localesPermitidos: LocalAcceso[]; // locales a los que puede ingresar
  can: (permiso: string) => boolean;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  guardarPreferencias: (p: Preferencias) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Los datos del usuario se guardan para pintar la interfaz sin esperar a la red, pero la autoridad
// es el backend: se revalidan con /auth/me al cargar y cada petición lleva el token.
const leerUsuarioGuardado = (): SessionUser | null => {
  if (tokenExpirado(getToken())) { clearSession(); return null; }
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(() => leerUsuarioGuardado());
  const navigate = useNavigate();

  const aplicarUsuario = (u: SessionUser) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    aplicarPreferencias(u.preferencias);
  };

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/auth/me`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.user) aplicarUsuario(data.user); })
      .catch(() => undefined); // sin red: se mantiene lo guardado; el 401 lo maneja api.ts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (token: string, u: SessionUser) => {
    localStorage.setItem('token', token);
    aplicarUsuario(u);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    aplicarPreferencias(PREFS_POR_DEFECTO); // la letra elegida es de esa cuenta, no del equipo
    toast.info("Has cerrado la sesión.");
    navigate('/login');
  };

  const guardarPreferencias = async (p: Preferencias) => {
    const res = await fetch(`${API_URL}/auth/preferencias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No se pudieron guardar las preferencias.');
    if (user) aplicarUsuario({ ...user, preferencias: data.preferencias });
  };

  const value: AuthContextType = {
    isAuthenticated: !!user,
    user,
    userRole: user?.role ?? null,
    rolNombre: user?.rol_nombre ?? null,
    username: user?.username ?? null,
    localId: user?.local_id ?? null,
    trabajadorId: user?.trabajador_id ?? null,
    alcance: user?.alcance ?? null,
    esGlobal: user?.alcance === 'global',
    localesPermitidos: user?.locales ?? [],
    can: (permiso) => !!user?.permisos.includes(permiso),
    login, logout, guardarPreferencias,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
