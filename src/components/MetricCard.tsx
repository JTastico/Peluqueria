import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type MetricTone = "violet" | "blue" | "gold" | "green";

const TONES: Record<MetricTone, { chip: string; bar: string }> = {
  violet: { chip: "bg-stylepro-lavender-100 text-stylepro-lavender-700", bar: "bg-stylepro-lavender-500" },
  blue: { chip: "bg-stylepro-blue-100 text-stylepro-blue-700", bar: "bg-stylepro-blue-500" },
  gold: { chip: "bg-stylepro-gold-100 text-stylepro-gold-800", bar: "bg-stylepro-gold-500" },
  green: { chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  tone?: MetricTone;
  /** Variación porcentual contra el periodo anterior; null = sin base de comparación */
  trend?: { value: number | null; label?: string };
  loading?: boolean;
}

export function MetricCard({ title, value, subtitle, icon, tone = "violet", trend, loading }: MetricCardProps) {
  const t = TONES[tone];

  let trendNode: ReactNode = null;
  if (trend) {
    const v = trend.value;
    const label = trend.label ?? "vs periodo anterior";
    if (v === null) {
      trendNode = <span className="text-xs text-muted-foreground">Sin datos del periodo anterior</span>;
    } else if (v === 0) {
      trendNode = (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Minus className="h-3.5 w-3.5" aria-hidden /> Sin cambios {label}
        </span>
      );
    } else {
      const up = v > 0;
      trendNode = (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-700" : "text-red-700"}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
          {up ? "+" : ""}{v.toLocaleString("es-PE", { maximumFractionDigits: 1 })}%
          <span className="font-normal text-muted-foreground">{label}</span>
        </span>
      );
    }
  }

  return (
    <Card className="relative overflow-hidden border border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md motion-safe:animate-fade-in">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className={`rounded-xl p-2 ${t.chip}`} aria-hidden>{icon}</span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-28" />
        ) : (
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
        )}
        <div className="mt-2 min-h-[1.25rem] space-y-0.5">
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {!loading && trendNode}
        </div>
      </CardContent>
    </Card>
  );
}
