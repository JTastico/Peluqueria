// Preferencias de letra de cada usuario (tipo y tamaño). Son individuales: se guardan en su cuenta.

export type FuenteId = "predeterminada" | "clasica" | "redondeada" | "legible" | "monoespaciada";
export type TamanoId = "pequeno" | "normal" | "grande" | "extra";
export interface Preferencias { fuente: FuenteId; tamano: TamanoId }

export const FUENTES: { id: FuenteId; nombre: string; detalle: string; pila: string }[] = [
  { id: "predeterminada", nombre: "Predeterminada", detalle: "Moderna y neutra", pila: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "clasica", nombre: "Clásica", detalle: "Con serifa, estilo editorial", pila: 'Georgia, "Times New Roman", serif' },
  { id: "redondeada", nombre: "Redondeada", detalle: "Amable y suave", pila: 'ui-rounded, "SF Pro Rounded", "Nunito", "Trebuchet MS", sans-serif' },
  { id: "legible", nombre: "Alta legibilidad", detalle: "Letras anchas y bien separadas", pila: 'Verdana, Tahoma, "DejaVu Sans", sans-serif' },
  { id: "monoespaciada", nombre: "Monoespaciada", detalle: "Todas las letras del mismo ancho", pila: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
];

export const TAMANOS: { id: TamanoId; nombre: string; px: number }[] = [
  { id: "pequeno", nombre: "Pequeño", px: 14 },
  { id: "normal", nombre: "Normal", px: 16 },
  { id: "grande", nombre: "Grande", px: 18 },
  { id: "extra", nombre: "Muy grande", px: 20 },
];

export const PREFS_POR_DEFECTO: Preferencias = { fuente: "predeterminada", tamano: "normal" };
const CACHE_KEY = "prefs";

export function aplicarPreferencias(p: Preferencias) {
  const f = FUENTES.find(x => x.id === p.fuente) ?? FUENTES[0];
  const t = TAMANOS.find(x => x.id === p.tamano) ?? TAMANOS[1];
  document.documentElement.style.setProperty("--font-app", f.pila);
  // Toda la interfaz usa rem, así que cambiar la base escala el sistema completo
  document.documentElement.style.fontSize = `${t.px}px`;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
}

export function preferenciasGuardadas(): Preferencias {
  try {
    const p = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (p && FUENTES.some(f => f.id === p.fuente) && TAMANOS.some(t => t.id === p.tamano)) return p;
  } catch { /* ignorar */ }
  return PREFS_POR_DEFECTO;
}
