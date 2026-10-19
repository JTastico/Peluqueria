import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportFilters, ReportFilterValues, defaultReportFilters, filtersToQuery } from "@/components/ReportFilters";
import { AXIS_PROPS, ChartCard, ChartTooltip, GRID_PROPS, compactMoney, useChartColors, useReducedMotion } from "@/components/charts/ChartKit";
import { useAuth } from "@/hooks/useAuth";
import { API_URL, fechaStr, formatMoney, todayStr } from "@/lib/ventas";

interface Fila {
  trabajador_id: string; trabajador: string; local_id: string; local_nombre: string; asignacion: string;
  total: number; comision: number; parte_local: number; servicios: number;
}

const lunesDe = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const suma = (d: Date, dias: number) => { const x = new Date(d); x.setDate(x.getDate() + dias); return x; };

const PRESETS = [
  { id: "semana", label: "Esta semana", range: () => ({ desde: fechaStr(lunesDe(new Date())), hasta: todayStr() }) },
  { id: "semana-pasada", label: "Semana pasada", range: () => { const l = suma(lunesDe(new Date()), -7); return { desde: fechaStr(l), hasta: fechaStr(suma(l, 6)) }; } },
  { id: "quincena", label: "Últimos 15 días", range: () => ({ desde: fechaStr(suma(new Date(), -14)), hasta: todayStr() }) },
  { id: "mes", label: "Este mes", range: () => { const n = new Date(); return { desde: fechaStr(new Date(n.getFullYear(), n.getMonth(), 1)), hasta: todayStr() }; } },
  { id: "mes-pasado", label: "Mes pasado", range: () => { const n = new Date(); return { desde: fechaStr(new Date(n.getFullYear(), n.getMonth() - 1, 1)), hasta: fechaStr(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
];

// Liquidación: lo que vendió cada trabajador, lo que le toca a él y lo que le toca al local.
const Reportes = () => {
  const colors = useChartColors();
  const reduced = useReducedMotion();
  const { localesPermitidos: locales } = useAuth();
  const [filters, setFilters] = useState<ReportFilterValues>(() => ({ ...defaultReportFilters(), ...PRESETS[0].range() }));
  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (filters.desde && filters.hasta && filters.desde > filters.hasta) return;
    let cancelled = false;
    setLoading(true);
    const q = filtersToQuery({ ...filters, hora_desde: "", hora_hasta: "" });
    fetch(`${API_URL}/reportes/trabajadores?${q}`)
      .then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.message || "Error al cargar la liquidación"); return b as Fila[]; })
      .then(d => !cancelled && setFilas(d))
      .catch(e => !cancelled && toast.error(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters]);

  const presetActivo = PRESETS.find(p => { const r = p.range(); return r.desde === filters.desde && r.hasta === filters.hasta; })?.id;

  const grupos = useMemo(() => {
    const map = new Map<string, { nombre: string; filas: Fila[] }>();
    for (const f of filas) {
      if (!map.has(f.local_id)) map.set(f.local_id, { nombre: f.local_nombre, filas: [] });
      map.get(f.local_id)!.filas.push(f);
    }
    return [...map.values()];
  }, [filas]);

  const totalAPagar = filas.reduce((a, f) => a + f.comision, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Liquidación</h1>
        <p className="text-muted-foreground">Cuánto vendió cada trabajador y cuánto le toca, según el porcentaje de cada servicio.</p>
      </div>

      <div role="group" aria-label="Rango rápido" className="inline-flex max-w-full flex-wrap rounded-xl border bg-white p-1 shadow-sm">
        {PRESETS.map(p => (
          <button key={p.id} type="button" aria-pressed={presetActivo === p.id} onClick={() => setFilters(f => ({ ...f, ...p.range() }))}
            className={`min-h-[40px] cursor-pointer rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              presetActivo === p.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <Card className="border border-border/60 shadow-sm">
        <CardContent className="pt-6"><ReportFilters value={filters} onChange={setFilters} locales={locales} conHoras={false} /></CardContent>
      </Card>

      {!loading && grupos.length > 0 && (
        <p className="text-sm text-muted-foreground">Total a pagar a trabajadores en el rango: <strong className="text-foreground tabular-nums">{formatMoney(totalAPagar)}</strong></p>
      )}
      {!loading && grupos.length === 0 && <p className="text-muted-foreground">No hay trabajadores para mostrar.</p>}

      <div className={`space-y-6 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        {grupos.map(g => {
          const tot = g.filas.reduce((a, f) => ({ total: a.total + f.total, comision: a.comision + f.comision, local: a.local + f.parte_local, serv: a.serv + f.servicios }), { total: 0, comision: 0, local: 0, serv: 0 });
          return (
            <Card key={g.nombre} className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-lg">{g.nombre}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trabajador</TableHead>
                      <TableHead className="text-right">Servicios</TableHead>
                      <TableHead className="text-right">Vendió</TableHead>
                      <TableHead className="text-right">Le toca</TableHead>
                      <TableHead className="text-right">Local</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.filas.map(f => (
                      <TableRow key={`${f.trabajador_id}-${f.local_id}`}>
                        <TableCell className="font-medium">
                          {f.trabajador}
                          {f.asignacion === "pausado" && <Badge variant="outline" className="ml-2 font-normal">En pausa</Badge>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{f.servicios}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(f.total)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-primary">{formatMoney(f.comision)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(f.parte_local)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total del local</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{tot.serv}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatMoney(tot.total)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatMoney(tot.comision)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatMoney(tot.local)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>

                <ChartCard title="Reparto por trabajador" height={Math.max(180, g.filas.length * 52)} empty={tot.total === 0}
                  summary={g.filas.map(f => `${f.trabajador}: le toca ${formatMoney(f.comision)} de ${formatMoney(f.total)}`).join("; ")}>
                  <BarChart data={g.filas} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
                    <XAxis type="number" {...AXIS_PROPS} tickFormatter={compactMoney} />
                    <YAxis type="category" dataKey="trabajador" {...AXIS_PROPS} width={110} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(250 30% 96%)" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="comision" name="Le toca al trabajador" stackId="a" fill={colors.gold} isAnimationActive={!reduced} />
                    <Bar dataKey="parte_local" name="Para el local" stackId="a" fill={colors.teal} radius={[0, 6, 6, 0]} isAnimationActive={!reduced} />
                  </BarChart>
                </ChartCard>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Reportes;
