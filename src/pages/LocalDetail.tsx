// src/pages/LocalDetail.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, Users, Scissors, Receipt, Calendar as CalendarIcon, Trophy, Sparkles, MapPin, Clock } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { MetricCard } from '@/components/MetricCard';
import { AXIS_PROPS, useChartColors, ChartCard, ChartTooltip, GRID_PROPS, compactMoney, money, useReducedMotion } from '@/components/charts/ChartKit';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, getMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { API_URL } from "@/lib/api";
// --- Componentes internos para los selectores de fecha ---
const MonthPicker = ({ onSelect }: { onSelect: (date: Date) => void }) => {
  const months = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1));
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {months.map(month => (
        <Button key={getMonth(month)} variant="ghost" className="capitalize" onClick={() => onSelect(month)}>
          {format(month, 'MMM', { locale: es })}
        </Button>
      ))}
    </div>
  );
};

const YearPicker = ({ onSelect }: { onSelect: (date: Date) => void }) => {
  const years = [2023, 2024, 2025];
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {years.map(year => (
        <Button key={year} variant="ghost" onClick={() => onSelect(setYear(new Date(), year))}>
          {year}
        </Button>
      ))}
    </div>
  );
};
// --- Fin de componentes internos ---

type TimeRange = 'day' | 'week' | 'month' | 'year';

// Definir la interfaz para Local (SIN 'servicios' ni 'trabajadores' directos)
interface Local {
  id: string;
  type: "peluqueria" | "spa" | "barberia";
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  peluqueros: number;
  ingresosMes: number;
  clientesActivos: number;
  imagen: string;
  estado: "Activo" | "Inactivo";
  username: string;
  password: string;
}

// Definir la interfaz para Servicio (para cargar servicios específicos del local)
interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  duracion: string;
  popularidad: number; // Aunque quitamos de Servicios.tsx, si lo usas en LocalDetail
  ingresosMes: number; // para métricas simuladas, se mantiene en LocalDetail.
  clientesMes: number; // Lo mismo.
  descripcion: string;
  local_id: string;
}


const LocalDetail = () => {
  const { localId } = useParams<{ localId: string }>();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const colors = useChartColors();
  
  const [local, setLocal] = useState<Local | null>(null);
  const [serviciosLocal, setServiciosLocal] = useState<Servicio[]>([]); // Estado para servicios del local
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchLocalAndServicesDetail = async () => {
      if (!localId) {
        setError("ID de local no proporcionado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch de los detalles del local
        const resLocal = await fetch(`${API_URL}/locales/${localId}`);
        if (!resLocal.ok) {
          if (resLocal.status === 404) throw new Error("Local no encontrado.");
          if (resLocal.status === 403) throw new Error("No tienes acceso a este local.");
          throw new Error(`Error al cargar los detalles del local: ${resLocal.statusText}`);
        }
        const dataLocal: Local = await resLocal.json();

        setLocal(dataLocal);

        // 2. Fetch de los servicios específicos de este local
        const resServicios = await fetch(`${API_URL}/servicios?local_id=${localId}`);
        if (!resServicios.ok) throw new Error(`Error al cargar servicios del local: ${resServicios.statusText}`);
        const dataServicios: Servicio[] = await resServicios.json();
        setServiciosLocal(dataServicios);


      } catch (err: any) {
        console.error("Error fetching local and services details:", err);
        setError(err.message || "Error al cargar los detalles del local y sus servicios.");
        toast.error("Error de carga", { description: err.message || "No se pudieron obtener los datos del local y sus servicios." });
      } finally {
        setLoading(false);
      }
    };

    fetchLocalAndServicesDetail();
  }, [localId, navigate]);


  // Datos reales del periodo, calculados en el backend desde los tickets cobrados
  const [chartData, setChartData] = useState<{ tendencia: { name: string; Ingresos: number }[]; distribucion: { n: string; v: number }[] }>({ tendencia: [], distribucion: [] });
  const [metrics, setMetrics] = useState({ income: 0, services: 0, clients: 0, localShare: 0, workersShare: 0, topWorkerName: 'Sin datos', topWorkerServices: 0, topServiceName: 'Sin datos', topServiceCount: 0 });

  useEffect(() => {
    if (!localId) return;
    let cancelled = false;
    const fecha = format(selectedDate, 'yyyy-MM-dd');
    fetch(`${API_URL}/reportes/local/${localId}?periodo=${timeRange}&fecha=${fecha}`)
      .then(async r => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.message || 'Error al cargar el detalle del local');
        return body;
      })
      .then(d => {
        if (cancelled) return;
        setChartData({ tendencia: d.tendencia, distribucion: d.distribucion });
        setMetrics(d.metrics);
      })
      .catch(e => !cancelled && toast.error(e.message));
    return () => { cancelled = true; };
  }, [localId, timeRange, selectedDate]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="lg:col-span-3 border-0 shadow-md">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
          </Card>
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!local) {
    return <div className="p-6 text-muted-foreground">Local no disponible o acceso denegado.</div>;
  }

  const handleDateSelect = (date: Date | undefined, range: TimeRange) => {
    if (!date) return;
    setSelectedDate(date);
    setTimeRange(range);
  };

  const getButtonLabel = (range: TimeRange) => {
    if (!selectedDate) return 'Seleccionar';
    switch (range) {
        case 'day': return format(selectedDate, 'PPP', { locale: es });
        case 'week': {
            const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
        }
        case 'month': return format(selectedDate, 'MMMM yyyy', { locale: es });
        case 'year': return format(selectedDate, 'yyyy');
        default: return 'Seleccionar';
    }
  };


  const PERIODOS: { id: TimeRange; label: string }[] = [
    { id: 'day', label: 'Día' }, { id: 'week', label: 'Semana' }, { id: 'month', label: 'Mes' }, { id: 'year', label: 'Año' },
  ];
  const picker = (id: TimeRange) => {
    switch (id) {
      case 'day': return <Calendar mode="single" selected={selectedDate} onSelect={(d) => handleDateSelect(d, 'day')} />;
      case 'week': return <Calendar mode="single" showOutsideDays={false} selected={selectedDate} onSelect={(d) => handleDateSelect(d, 'week')} />;
      case 'month': return <MonthPicker onSelect={(d) => handleDateSelect(d, 'month')} />;
      default: return <YearPicker onSelect={(d) => handleDateSelect(d, 'year')} />;
    }
  };
  const ticketPromedio = metrics.clients > 0 ? metrics.income / metrics.clients : 0;
  const maxServicio = Math.max(1, ...chartData.distribucion.map(d => d.v));
  const sinDatos = metrics.services === 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Encabezado del local */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/locales')} aria-label="Volver a locales" className="mt-1 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{local.nombre}</h1>
              <Badge variant={local.estado === 'Activo' ? 'default' : 'secondary'} className="capitalize">{local.estado}</Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {local.direccion && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{local.direccion}</span>}
              {local.horario && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{local.horario}</span>}
            </p>
          </div>
        </div>

        <div role="group" aria-label="Periodo" className="inline-flex flex-wrap gap-1 rounded-xl border bg-white p-1 shadow-sm">
          {PERIODOS.map(p => (
            <Popover key={p.id}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-pressed={timeRange === p.id}
                  className={cn(
                    "inline-flex min-h-[36px] items-center gap-2 rounded-lg px-3.5 text-sm font-medium capitalize transition-colors duration-150 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    timeRange === p.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" aria-hidden />
                  {timeRange === p.id ? getButtonLabel(p.id) : p.label}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">{picker(p.id)}</PopoverContent>
            </Popover>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard title="Ingresos" value={money(metrics.income)} subtitle="Total del periodo" tone="violet" icon={<Banknote className="h-5 w-5" />} />
        <MetricCard title="Para el local" value={money(metrics.localShare)} subtitle="Después de pagar a los trabajadores" tone="green" icon={<Users className="h-5 w-5" />} />
        <MetricCard title="Atenciones" value={metrics.clients} subtitle={`${metrics.services} servicios realizados`} tone="blue" icon={<Scissors className="h-5 w-5" />} />
        <MetricCard title="Ticket promedio" value={money(ticketPromedio)} subtitle="Ingreso por atención" tone="gold" icon={<Receipt className="h-5 w-5" />} />
        <MetricCard title="Trabajador del periodo" value={metrics.topWorkerName} subtitle={`${metrics.topWorkerServices} servicios`} tone="gold" icon={<Trophy className="h-5 w-5" />} />
        <MetricCard title="Servicio más solicitado" value={metrics.topServiceName} subtitle={`${metrics.topServiceCount} veces`} tone="blue" icon={<Sparkles className="h-5 w-5" />} />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChartCard className="lg:col-span-3" title="Tendencia de ingresos" description="Lo cobrado a lo largo del periodo"
          empty={sinDatos} summary={`Total del periodo ${money(metrics.income)} en ${metrics.services} servicios.`}>
          <AreaChart data={chartData.tendencia} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gLocal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="name" {...AXIS_PROPS} minTickGap={20} />
            <YAxis {...AXIS_PROPS} tickFormatter={compactMoney} width={64} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="Ingresos" name="Ingresos" stroke={colors.primary} strokeWidth={2.5}
              fill="url(#gLocal)" isAnimationActive={!reduced} />
          </AreaChart>
        </ChartCard>

        <Card className="lg:col-span-2 border border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Servicios más pedidos</CardTitle>
            <p className="text-sm text-muted-foreground">Cantidad de veces en el periodo</p>
          </CardHeader>
          <CardContent>
            {chartData.distribucion.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aún no hay servicios cobrados en este periodo.</p>
            ) : (
              <ol className="space-y-4">
                {chartData.distribucion.map((d, i) => (
                  <li key={d.n}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-foreground">{i + 1}. {d.n}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{d.v}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-stylepro-lavender-500 transition-[width] duration-500"
                        style={{ width: `${(d.v / maxServicio) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocalDetail;
