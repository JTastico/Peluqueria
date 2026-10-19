import {
  Banknote, FileBarChart, LayoutDashboard, MapPin, Scissors, Settings, ShoppingBag, Users,
} from "lucide-react";
import type { SessionUser } from "@/hooks/useAuth";

export interface ItemNav {
  title: string;
  url: string;
  icon: typeof MapPin;
  /** Basta con tener uno de estos permisos */
  permisos: string[];
  /** Condición extra (p. ej. estar vinculado a un trabajador) */
  extra?: (u: SessionUser) => boolean;
}

export const ITEMS_NAV: ItemNav[] = [
  { title: "Cobrar", url: "/caja", icon: Banknote, permisos: ["ventas.registrar"] },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permisos: ["reportes.global"] },
  { title: "Liquidación", url: "/reportes", icon: FileBarChart, permisos: ["reportes.global"] },
  { title: "Servicios y precios", url: "/servicios", icon: Scissors, permisos: ["servicios.administrar"] },
  { title: "Trabajadores", url: "/trabajadores", icon: Users, permisos: ["trabajadores.ver"] },
  { title: "Locales", url: "/locales", icon: MapPin, permisos: ["locales.ver"] },
  { title: "Inventario", url: "/inventario", icon: ShoppingBag, permisos: ["inventario.administrar"] },
  { title: "Configuraciones", url: "/configuraciones", icon: Settings, permisos: ["configuracion.ver", "usuarios.administrar"] },
];

export const puedeAcceder = (item: ItemNav, user: SessionUser | null) =>
  !!user && item.permisos.some(p => user.permisos.includes(p)) && (!item.extra || item.extra(user));

// Pantalla de inicio: la primera a la que el usuario tiene acceso
export const rutaInicio = (user: SessionUser | null) =>
  ITEMS_NAV.find(i => puedeAcceder(i, user))?.url ?? "/sin-acceso";
