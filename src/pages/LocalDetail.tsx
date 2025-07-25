// src/pages/LocalDetail.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Users, Scissors, TrendingUp, Calendar as CalendarIcon, Trophy, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, getMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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

const COLORS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#10B981'];

// Definir la interfaz para Local (SIN 'servicios' ni 'trabajadores' directos)
interface Local {
  id: number;
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
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  duracion: string;
  popularidad: number; // Aunque quitamos de Servicios.tsx, si lo usas en LocalDetail
  ingresosMes: number; // para métricas simuladas, se mantiene en LocalDetail.
  clientesMes: number; // Lo mismo.
  descripcion: string;
  local_id: number;
}


const LocalDetail = () => {
  const { localId } = useParams<{ localId: string }>();
  const navigate = useNavigate();
  const { userRole, localId: authLocalId } = useAuth();
  
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
        const resLocal = await fetch(`http://localhost:3001/api/locales/${localId}`);
        if (!resLocal.ok) {
          if (resLocal.status === 404) throw new Error("Local no encontrado.");
          throw new Error(`Error al cargar los detalles del local: ${resLocal.statusText}`);
        }
        const dataLocal: Local = await resLocal.json();

        // Lógica de autorización
        if (userRole === 'encargado' && dataLocal.id !== parseInt(authLocalId || '0')) {
          setError("No tienes permiso para ver este local.");
          setLocal(null);
          toast.error("Acceso denegado", { description: "No tienes permiso para ver los detalles de este local." });
          if (authLocalId) { navigate(`/locales/${authLocalId}`); } else { navigate('/locales'); }
          return;
        }
        setLocal(dataLocal);

        // 2. Fetch de los servicios específicos de este local
        const resServicios = await fetch(`http://localhost:3001/api/servicios?local_id=${localId}`);
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
  }, [localId, userRole, authLocalId, navigate]);


  // Usamos useMemo para generar datos simulados basados en el local y sus servicios
  const { chartData, metrics } = useMemo(() => {
    if (!local || loading || serviciosLocal.length === 0) { // Ahora depende de serviciosLocal
        return {
            chartData: { tendencia: [], distribucion: [] },
            metrics: { income: 0, services: 0, clients: 0, topWorkerName: 'Cargando...', topWorkerServices: 0, topServiceName: 'Cargando...', topServiceCount: 0 }
        };
    }

    const generateData = (factor: number, count: number, labelPrefix: string) => {
        const currentLocalServices = serviciosLocal.map(s => s.nombre);

        const trend = Array.from({ length: count }, (_, i) => ({
            name: `${labelPrefix}${i + 1}`,
            Ingresos: Math.floor(Math.random() * 800 * factor) + 200 * factor * (parseInt(localId || '1') || 1), // Usar localId en parseInt
        }));

        const totalIncome = trend.reduce((sum, item) => sum + item.Ingresos, 0);
        const totalServices = Math.floor(totalIncome / (40 * factor + 10));
        
        const serviceDistribution = currentLocalServices.map(s => ({
            name: s,
            value: Math.floor(Math.random() * totalServices / currentLocalServices.length) + 1
        }));
        const topService = [...serviceDistribution].sort((a,b) => b.value - a.value)[0] || { name: 'N/A', value: 0};
        const topWorker = { name: 'Trabajador Genérico', value: Math.floor(totalServices * 0.3) };


        return {
            tendencia: trend,
            distribucion: serviceDistribution.map(({ name, value }) => ({ n: name, v: value })),
            metrics: {
                income: totalIncome,
                services: totalServices,
                clients: Math.floor(totalServices * 0.75),
                topWorkerName: topWorker.name,
                topWorkerServices: topWorker.value,
                topServiceName: topService.name,
                topServiceCount: topService.value,
            }
        };
    };

    let generatedData;
    switch (timeRange) {
        case 'day': generatedData = generateData(0.1, 8, 'h'); break;
        case 'week': generatedData = generateData(0.5, 7, 'd'); break;
        case 'month': generatedData = generateData(2, 4, 's'); break;
        case 'year': generatedData = generateData(10, 12, 'm'); break;
        default: generatedData = { tendencia: [], distribucion: [], metrics: { income: 0, services: 0, clients: 0, topWorkerName: 'N/A', topWorkerServices: 0, topServiceName: 'N/A', topServiceCount: 0 } };
    }
    return { chartData: generatedData, metrics: generatedData.metrics };
  }, [local, loading, serviciosLocal, timeRange, selectedDate, localId]);

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/locales')}><ArrowLeft className="h-4 w-4" /></Button>
              <div>
                  <h1 className="text-3xl font-bold text-foreground">{local.nombre}</h1>
                  <p className="text-muted-foreground">Dashboard de rendimiento del local.</p>
              </div>
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg flex-wrap justify-center">
            <Popover><PopoverTrigger asChild><Button variant={timeRange === 'day' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'day' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'day' ? getButtonLabel('day') : 'Día'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={(d) => handleDateSelect(d, 'day')} /></PopoverContent></Popover>
            <Popover><PopoverTrigger asChild><Button variant={timeRange === 'week' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'week' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'week' ? getButtonLabel('week') : 'Semana'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" showOutsideDays={false} onSelect={(d) => handleDateSelect(d, 'week')} selected={selectedDate} /></PopoverContent></Popover>
            <Popover><PopoverTrigger asChild><Button variant={timeRange === 'month' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'month' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'month' ? getButtonLabel('month') : 'Mes'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><MonthPicker onSelect={(d) => handleDateSelect(d, 'month')} /></PopoverContent></Popover>
            <Popover><PopoverTrigger asChild><Button variant={timeRange === 'year' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'year' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'year' ? getButtonLabel('year') : 'Año'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><YearPicker onSelect={(d) => handleDateSelect(d, 'year')} /></PopoverContent></Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">S/{metrics.income.toLocaleString()}</div><p className="text-xs text-muted-foreground">Total del periodo</p></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clientes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.clients}</div><p className="text-xs text-muted-foreground">Total del periodo</p></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Servicios</CardTitle><Scissors className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.services}</div><p className="text-xs text-muted-foreground">Total del periodo</p></CardContent></Card>
          
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Trabajador del Periodo</CardTitle><Trophy className="h-4 w-4 text-muted-foreground text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.topWorkerName}</div><p className="text-xs text-muted-foreground">{`${metrics.topWorkerServices} servicios`}</p></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Servicio Más Solicitado</CardTitle><Sparkles className="h-4 w-4 text-muted-foreground text-sky-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.topServiceName}</div><p className="text-xs text-muted-foreground">{`${metrics.topServiceCount} veces`}</p></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground text-emerald-500" /></CardHeader><CardContent><div className="text-2xl font-bold">S/{metrics.clients > 0 ? (metrics.income / metrics.clients).toFixed(2) : '0.00'}</div><p className="text-xs text-muted-foreground">Promedio del periodo</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3 border-0 shadow-md">
            <CardHeader><CardTitle>Tendencia de Ingresos</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.tendencia} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `S/${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Ingresos" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader><CardTitle>Distribución de Servicios</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartData.distribucion} cx="50%" cy="50%" labelLine={false} label={({ n, v }) => `${n} (${v})`} outerRadius={80} fill="#8884d8" dataKey="v">
                    {chartData.distribucion.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]}/>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LocalDetail;
