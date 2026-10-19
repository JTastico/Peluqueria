import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDown, ArrowUp, Banknote, CalendarDays, Flame, Receipt, Store, Trophy, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "./MetricCard";
import { ReportFilters, ReportFilterValues, defaultReportFilters, filtersToQuery } from "./ReportFilters";
import { AXIS_PROPS, ChartCard, ChartTooltip, GRID_PROPS, compactMoney, money, useChartColors, useReducedMotion } from "./charts/ChartKit";
import { useAuth } from "@/hooks/useAuth";
import { API_URL, fechaStr, todayStr } from "@/lib/ventas";

interface Punto { total: number; atenciones: number }
interface DashboardData {
  resumen: { ingresos: number; atenciones: number; servicios: number; ganancia_local: number; pago_trabajadores: number; ticket_promedio: number };
  anterior: { ingresos: number; atenciones: number; desde: string; hasta: string };
  por_local: (Punto & { local: string; trabajadores: number; local_neto: number })[];
  por_fecha: (Punto & { fecha: string })[];
  por_hora: (Punto & { hora: string })[];
  por_dia: (Punto & { dia: string })[];
  por_trabajador: { trabajador: string; local: string; total: number; comision: number; servicios: number }[];
  por_servicio: { servicio: string; cantidad: number; total: number }[];
  por_dia_trabajador: { fecha: string; mas: { trabajador: string; total: number }; menos: { trabajador: string; total: number } | null }[];
}

const diasAtras = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return fechaStr(d); };
const lunesDeEstaSemana = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return fechaStr(d); };

const PRESETS = [
  { id: "hoy", label: "Hoy", range: () => ({ desde: todayStr(), hasta: todayStr() }) },
  { id: "ayer", label: "Ayer", range: () => ({ desde: diasAtras(1), hasta: diasAtras(1) }) },
  { id: "semana", label: "Esta semana", range: () => ({ desde: lunesDeEstaSemana(), hasta: todayStr() }) },
  { id: "30d", label: "30 días", range: () => ({ desde: diasAtras(29), hasta: todayStr() }) },
  { id: "mes", label: "Este mes", range: () => ({ desde: fechaStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), hasta: todayStr() }) },
];

// Variación porcentual; null cuando no hay base de comparación
const variacion = (actual: number, previo: number): number | null => (previo === 0 ? (actual === 0 ? 0 : null) : ((actual - previo) / previo) * 100);
const fmtFecha = (s: string) => format(parseISO(s), "d MMM", { locale: es });
const fmtDiaLargo = (s: string) => format(parseISO(s), "EEE d MMM", { locale: es });

export function Dashboard() {
  const reduced = useReducedMotion();
  const colors = useChartColors();
  const { localesPermitidos: locales } = useAuth();
  const [filters, setFilters] = useState<ReportFilterValues>(() => ({ ...defaultReportFilters(), ...PRESETS[2].range() }));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (filters.desde && filters.hasta && filters.desde > filters.hasta) return;
    if (filters.hora_desde && filters.hora_hasta && filters.hora_desde > filters.hora_hasta) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/reportes/dashboard?${filtersToQuery(filters)}`)
      .then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.message || "Error al cargar el dashboard"); return b; })
      .then(d => !cancelled && setData(d))
      .catch(e => !cancelled && toast.error(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters]);

  const presetActivo = PRESETS.find(p => { const r = p.range(); return r.desde === filters.desde && r.hasta === filters.hasta; })?.id;
  const aplicarPreset = (id: string) => { const p = PRESETS.find(x => x.id === id); if (p) setFilters(f => ({ ...f, ...p.range() })); };

  const r = data?.resumen;
  const sinDatos = !data || data.resumen.atenciones === 0;
  const primeraCarga = loading && !data;

  const insights = useMemo(() => {
    if (!data || data.resumen.atenciones === 0) return null;
    const hora = data.por_hora.reduce((a, b) => (b.total > a.total ? b : a), data.por_hora[0]);
    const mas = data.por_trabajador[0];
    const menos = data.por_trabajador.length > 1 ? data.por_trabajador[data.por_trabajador.length - 1] : null;
    return { hora, mas, menos };
  }, [data]);

  const horaPico = insights?.hora.hora;
  const maxTrabajador = Math.max(1, ...(data?.por_trabajador.map(t => t.total) ?? [1]));
  const maxServicio = Math.max(1, ...(data?.por_servicio.map(s => s.total) ?? [1]));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {filters.desde === filters.hasta ? fmtFecha(filters.desde) : `${fmtFecha(filters.desde)} – ${fmtFecha(filters.hasta)}`}
            <span aria-hidden>·</span>
            {filters.local_id === "todos" ? "Todos los locales" : locales.find(l => l.id === filters.local_id)?.nombre}
          </p>
        </div>
        <div role="group" aria-label="Rango rápido" className="inline-flex max-w-full flex-wrap rounded-xl border bg-white p-1 shadow-sm">
          {PRESETS.map(p => (
            <button key={p.id} type="button" aria-pressed={presetActivo === p.id} onClick={() => aplicarPreset(p.id)}
              className={`min-h-[40px] cursor-pointer rounded-lg px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                presetActivo === p.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border border-border/60 shadow-sm">
        <CardContent className="pt-6"><ReportFilters value={filters} onChange={setFilters} locales={locales} /></CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-busy={loading}>
        <MetricCard title="Ingresos" value={money(r?.ingresos ?? 0)} subtitle="Total cobrado" tone="violet" icon={<Banknote className="h-5 w-5" />}
          loading={primeraCarga} trend={data ? { value: variacion(data.resumen.ingresos, data.anterior.ingresos) } : undefined} />
        <MetricCard title="Para el local" value={money(r?.ganancia_local ?? 0)} subtitle="Lo que queda después de pagar a los trabajadores" tone="green" icon={<Store className="h-5 w-5" />} loading={primeraCarga} />
        <MetricCard title="Para los trabajadores" value={money(r?.pago_trabajadores ?? 0)} subtitle="Su parte de lo cobrado" tone="gold" icon={<Users className="h-5 w-5" />} loading={primeraCarga} />
        <MetricCard title="Atenciones" value={r?.atenciones ?? 0} subtitle={r ? `${r.servicios} servicios · promedio ${money(r.ticket_promedio)}` : undefined} tone="blue" icon={<Receipt className="h-5 w-5" />}
          loading={primeraCarga} trend={data ? { value: variacion(data.resumen.atenciones, data.anterior.atenciones) } : undefined} />
      </div>

      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Flame, label: "Hora pico", value: insights.hora.hora, detalle: `${money(insights.hora.total)} · ${insights.hora.atenciones} ${insights.hora.atenciones === 1 ? "atención" : "atenciones"}` },
            { icon: ArrowUp, label: "Vendió más", value: insights.mas.trabajador, detalle: `${money(insights.mas.total)} · ${insights.mas.local}` },
            insights.menos
              ? { icon: ArrowDown, label: "Vendió menos", value: insights.menos.trabajador, detalle: `${money(insights.menos.total)} · ${insights.menos.local}` }
              : { icon: Trophy, label: "Servicio estrella", value: data!.por_servicio[0]?.servicio ?? "—", detalle: `${data!.por_servicio[0]?.cantidad ?? 0} ${data!.por_servicio[0]?.cantidad === 1 ? "vez" : "veces"}` },
          ].map(i => (
            <div key={i.label} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-4 shadow-sm">
              <span className="rounded-xl bg-stylepro-lavender-100 p-2.5 text-stylepro-lavender-700" aria-hidden><i.icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{i.label}</p>
                <p className="truncate text-lg font-semibold text-foreground">{i.value}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">{i.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" aria-busy={loading}>
        <ChartCard className="lg:col-span-2" title="Ingresos por fecha" description="Evolución diaria de lo cobrado" loading={primeraCarga} empty={sinDatos}
          summary={`${data?.por_fecha.length ?? 0} días con cobros, total ${money(r?.ingresos ?? 0)}.`}>
          <AreaChart data={data?.por_fecha} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="fecha" {...AXIS_PROPS} tickFormatter={(d: string) => fmtFecha(d)} minTickGap={24} />
            <YAxis {...AXIS_PROPS} tickFormatter={compactMoney} width={64} />
            <Tooltip content={<ChartTooltip />} labelFormatter={(d: string) => fmtFecha(d)} />
            <Area type="monotone" dataKey="total" name="Ingresos" stroke={colors.primary} strokeWidth={2.5} fill="url(#gIngresos)" isAnimationActive={!reduced} />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Ganancia por local" description="Qué se queda el local y qué va a los trabajadores" loading={primeraCarga} empty={sinDatos}
          summary={(data?.por_local ?? []).map(l => `${l.local}: ${money(l.total)} (local ${money(l.local_neto)}, trabajadores ${money(l.trabajadores)})`).join("; ")}>
          <BarChart data={data?.por_local} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="local" {...AXIS_PROPS} tick={{ ...AXIS_PROPS.tick, fontSize: 11 }} />
            <YAxis {...AXIS_PROPS} tickFormatter={compactMoney} width={64} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(250 30% 96%)" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="local_neto" name="Para el local" stackId="a" fill={colors.teal} isAnimationActive={!reduced} />
            <Bar dataKey="trabajadores" name="Para trabajadores" stackId="a" fill={colors.gold} radius={[6, 6, 0, 0]} isAnimationActive={!reduced} />
          </BarChart>
        </ChartCard>

        <ChartCard className="lg:col-span-2" title="Ingresos por hora del día" description="La hora pico aparece resaltada" loading={primeraCarga} empty={sinDatos}
          summary={horaPico ? `Hora pico: ${horaPico}.` : ""}>
          <BarChart data={data?.por_hora} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="hora" {...AXIS_PROPS} interval={2} tick={{ ...AXIS_PROPS.tick, fontSize: 10 }} />
            <YAxis {...AXIS_PROPS} tickFormatter={compactMoney} width={64} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(250 30% 96%)" }} />
            <Bar dataKey="total" name="Ingresos" radius={[6, 6, 0, 0]} isAnimationActive={!reduced}>
              {data?.por_hora.map(h => <Cell key={h.hora} fill={h.hora === horaPico ? colors.gold : colors.teal} />)}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Por día de la semana" description="Lunes a domingo" loading={primeraCarga} empty={sinDatos}
          summary={(data?.por_dia ?? []).map(d => `${d.dia}: ${money(d.total)}`).join("; ")}>
          <BarChart data={data?.por_dia} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="dia" {...AXIS_PROPS} tickFormatter={(d: string) => d.substring(0, 3)} />
            <YAxis {...AXIS_PROPS} tickFormatter={compactMoney} width={64} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(250 30% 96%)" }} />
            <Bar dataKey="total" name="Ingresos" fill={colors.blue} radius={[6, 6, 0, 0]} isAnimationActive={!reduced} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranking de trabajadores */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold"><Trophy className="h-4 w-4 text-stylepro-gold-600" aria-hidden /> Ranking de trabajadores</CardTitle>
          </CardHeader>
          <CardContent>
            {primeraCarga ? <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              : !data || data.por_trabajador.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay cobros en este rango.</p>
              : (
                <ol className="space-y-3">
                  {data.por_trabajador.map((t, i) => (
                    <li key={`${t.trabajador}-${t.local}`} className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${i === 0 ? "bg-stylepro-gold-100 text-stylepro-gold-800" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{t.trabajador} <span className="font-normal text-muted-foreground">· {t.local}</span></p>
                          <p className="shrink-0 text-sm font-semibold tabular-nums">{money(t.total)}</p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <div className="h-full rounded-full bg-stylepro-lavender-500 transition-[width] duration-500" style={{ width: `${(t.total / maxTrabajador) * 100}%` }} />
                          </div>
                          <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">{t.servicios} serv. · su parte {money(t.comision)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
          </CardContent>
        </Card>

        {/* Servicios más vendidos */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Servicios más vendidos</CardTitle></CardHeader>
          <CardContent>
            {primeraCarga ? <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              : !data || data.por_servicio.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay cobros en este rango.</p>
              : (
                <ol className="space-y-3">
                  {data.por_servicio.map((s, i) => (
                    <li key={s.servicio}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{i + 1}. {s.servicio}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{money(s.total)} <span className="font-normal text-muted-foreground">· {s.cantidad}</span></span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full bg-stylepro-gold-500 transition-[width] duration-500" style={{ width: `${(s.total / maxServicio) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Quién hizo más y menos cada día */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Quién hizo más y menos cada día</CardTitle></CardHeader>
        <CardContent>
          {!data || data.por_dia_trabajador.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay cobros en este rango.</p> : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Día</TableHead><TableHead>Vendió más</TableHead><TableHead>Vendió menos</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {data.por_dia_trabajador.map(d => (
                  <TableRow key={d.fecha}>
                    <TableCell className="font-medium capitalize">{fmtDiaLargo(d.fecha)}</TableCell>
                    <TableCell><span className="font-medium">{d.mas.trabajador}</span> <span className="text-muted-foreground tabular-nums">· {money(d.mas.total)}</span></TableCell>
                    <TableCell>{d.menos ? <><span className="font-medium">{d.menos.trabajador}</span> <span className="text-muted-foreground tabular-nums">· {money(d.menos.total)}</span></> : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
