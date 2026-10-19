import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Tema, aplicarTema, temaGuardado } from "@/lib/theme";

interface BrandContextType {
  nombre: string;
  tema: Tema;
  logoUrl: string | null;
  refrescar: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Tema, logo y nombre del negocio: los define el administrador y se aplican a todos (también en el login).
export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [nombre, setNombre] = useState("Koko");
  const [tema, setTema] = useState<Tema>(() => temaGuardado());
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/marca`);
      if (!res.ok) return;
      const d = await res.json();
      setNombre(d.nombre_negocio || "Koko");
      setTema(d.tema);
      aplicarTema(d.tema, true);
      setLogoUrl(d.logo ? `${API_URL}/marca/logo?v=${d.logo.version}` : null);
    } catch {
      /* sin red: se mantiene el último tema guardado */
    }
  }, []);

  useEffect(() => { refrescar(); }, [refrescar]);

  return <BrandContext.Provider value={{ nombre, tema, logoUrl, refrescar }}>{children}</BrandContext.Provider>;
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand debe usarse dentro de un BrandProvider");
  return ctx;
};
