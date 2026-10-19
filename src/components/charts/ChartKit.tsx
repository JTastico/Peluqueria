import { ReactNode, useEffect, useState } from "react";
import { ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrand } from "@/hooks/useBrand";

// Paleta de las gráficas: primario y secundario siguen el tema elegido por el administrador;
// teal y azul son colores de apoyo fijos para distinguir series.
export function useChartColors() {
  const { tema } = useBrand();
  return { primary: tema.primario, gold: tema.secundario, teal: "#0d9488", blue: "#2563eb" };
}

export const AXIS_PROPS = {
  tick: { fill: "hsl(250 10% 40%)", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID_PROPS = { strokeDasharray: "3 3", stroke: "hsl(250 30% 90%)", vertical: false } as const;

// "S/ 1.2k" para ejes y etiquetas compactas
export const compactMoney = (n: number) =>
  n >= 1000 ? `S/ ${(n / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })}k` : `S/ ${Math.round(n)}`;

export const money = (n: number) =>
  `S/ ${(Number(n) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Respeta "reducir movimiento" del sistema: las gráficas no se animan
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

interface TooltipEntry { name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }

// Tooltip propio de recharts: etiqueta + valores en soles
export function ChartTooltip({ active, payload, label, valueFormatter = money }: {
  active?: boolean; payload?: TooltipEntry[]; label?: string | number; valueFormatter?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-sm" role="status">
      {label !== undefined && <p className="font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-foreground tabular-nums">{valueFormatter(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  /** Texto que describe la gráfica para lectores de pantalla */
  summary: string;
  empty?: boolean;
  loading?: boolean;
  height?: number;
  className?: string;
  children: ReactNode;
}

export function ChartCard({ title, description, summary, empty, loading, height = 280, className = "", children }: ChartCardProps) {
  return (
    <Card className={`border border-border/60 shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full rounded-lg" style={{ height }} />
        ) : empty ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground" style={{ height }}>
            <span className="rounded-full bg-muted p-3"><BarChart3 className="h-5 w-5" aria-hidden /></span>
            <p className="text-sm">Aún no hay cobros en este rango.</p>
          </div>
        ) : (
          <div role="img" aria-label={`${title}. ${summary}`} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
