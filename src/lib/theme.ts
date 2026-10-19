// Tema de color del sistema. El administrador elige un color primario y uno secundario;
// de ellos se generan las escalas (50–900) y las variables CSS que usa toda la interfaz.

export interface Tema { primario: string; secundario: string; preset: string }

export const PRESETS: (Tema & { nombre: string })[] = [
  { preset: "lavanda", nombre: "Lavanda", primario: "#7e47eb", secundario: "#f59e0b" },
  { preset: "oceano", nombre: "Océano", primario: "#0f766e", secundario: "#f59e0b" },
  { preset: "zafiro", nombre: "Zafiro", primario: "#1d4ed8", secundario: "#06b6d4" },
  { preset: "rosa", nombre: "Rosa", primario: "#be185d", secundario: "#8b5cf6" },
  { preset: "esmeralda", nombre: "Esmeralda", primario: "#047857", secundario: "#eab308" },
  { preset: "carmesi", nombre: "Carmesí", primario: "#b91c1c", secundario: "#0ea5e9" },
  { preset: "ambar", nombre: "Ámbar", primario: "#b45309", secundario: "#7c3aed" },
  { preset: "grafito", nombre: "Grafito", primario: "#374151", secundario: "#f59e0b" },
];

export const TEMA_POR_DEFECTO: Tema = { primario: "#7e47eb", secundario: "#f59e0b", preset: "lavanda" };

const CACHE_KEY = "tema";

export const hexValido = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [Math.round((h * 60 + 360) % 360), s * 100, l * 100];
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const css = (h: number, s: number, l: number) => `${Math.round(h)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`;

// Escala 50–900 a partir del color elegido (que actúa como 600)
export function construirEscala(hex: string): Record<number, string> {
  const [h, s, l] = hexToHsl(hex);
  const pasos: Record<number, number> = {
    50: Math.min(98, l + 50), 100: Math.min(95, l + 44), 200: Math.min(90, l + 36), 300: Math.min(82, l + 26),
    400: Math.min(72, l + 15), 500: Math.min(65, l + 7), 600: l, 700: l - 8, 800: l - 15, 900: l - 22,
  };
  const escala: Record<number, string> = {};
  for (const [k, v] of Object.entries(pasos)) {
    const luz = clamp(v, 8, 98);
    // Los tonos muy claros pierden saturación para que se lean como "tinte" y no como color
    const sat = Number(k) <= 200 ? s * 0.9 : s;
    escala[Number(k)] = css(h, sat, luz);
  }
  return escala;
}

// `recordar`: guarda el tema en la caché local (solo para lo confirmado, no para vistas previas)
export function aplicarTema(tema: Tema, recordar = false) {
  const raiz = document.documentElement.style;
  const brand = construirEscala(tema.primario);
  const sec = construirEscala(tema.secundario);
  for (const k of Object.keys(brand)) {
    raiz.setProperty(`--brand-${k}`, brand[Number(k)]);
    raiz.setProperty(`--sec-${k}`, sec[Number(k)]);
  }
  const [h, s, l] = hexToHsl(tema.primario);
  const sat = Math.min(s, 85);
  raiz.setProperty("--primary", css(h, s, l));
  raiz.setProperty("--ring", css(h, s, l));
  // Neutros teñidos con el matiz del color primario
  raiz.setProperty("--background", css(h, 100, 98));
  raiz.setProperty("--foreground", css(h, 15, 15));
  raiz.setProperty("--card-foreground", css(h, 15, 15));
  raiz.setProperty("--popover-foreground", css(h, 15, 15));
  raiz.setProperty("--secondary", css(h, 30, 96));
  raiz.setProperty("--secondary-foreground", css(h, 15, 25));
  raiz.setProperty("--muted", css(h, 30, 96));
  raiz.setProperty("--muted-foreground", css(h, 10, 40));
  raiz.setProperty("--accent", css(h, 100, 95));
  raiz.setProperty("--accent-foreground", css(h, 15, 25));
  raiz.setProperty("--border", css(h, 30, 90));
  raiz.setProperty("--input", css(h, 30, 90));
  // Barra lateral oscura con el mismo matiz
  raiz.setProperty("--sidebar-background", css(h, 40, 8));
  raiz.setProperty("--sidebar-foreground", css(h, 20, 85));
  raiz.setProperty("--sidebar-primary", css(h, sat, Math.max(l, 45)));
  raiz.setProperty("--sidebar-accent", css(h, 30, 15));
  raiz.setProperty("--sidebar-accent-foreground", css(h, 20, 85));
  raiz.setProperty("--sidebar-border", css(h, 20, 20));
  raiz.setProperty("--sidebar-ring", css(h, sat, Math.max(l, 45)));
  if (recordar) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(tema)); } catch { /* sin almacenamiento */ }
  }
}

export function temaGuardado(): Tema {
  try {
    const t = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (t && hexValido(t.primario) && hexValido(t.secundario)) return t;
  } catch { /* ignorar */ }
  return TEMA_POR_DEFECTO;
}

// Contraste contra blanco (mismo cálculo que el backend; el primario lleva texto blanco encima)
export function contrasteConBlanco(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}
