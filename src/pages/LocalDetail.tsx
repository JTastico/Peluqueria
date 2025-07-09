import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { localesData } from '@/data/locales-data';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Users, Scissors, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, getMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Componentes internos para los selectores ---
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

const LocalDetail = () => {
  const { localId } = useParams();
  const navigate = useNavigate();
  const { userRole, localId: authLocalId } = useAuth();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const local = useMemo(() => localesData.find(l => l.id.toString() === localId), [localId]);

  // Los datos de los gráficos y las métricas ahora se calculan juntos
  const { chartData, metrics } = useMemo(() => {
    // Lógica mejorada para generar datos simulados basados en el rango y fecha
    const generateData = (factor: number, count: number, labelPrefix: string) => {
        const data = Array.from({ length: count }, (_, i) => ({
            // Usamos el ID del local para que cada uno tenga datos diferentes
            [`${labelPrefix}${i + 1}`]: Math.floor(Math.random() * 800 * factor) + 200 * factor * (parseInt(localId) || 1),
        }));
        const flattenedData = data.reduce((acc, curr) => ({...acc, ...curr}), {});

        const trend = Object.entries(flattenedData).map(([key, value]) => ({ name: key, Ingresos: value }));
        const totalIncome = trend.reduce((sum, item) => sum + item.Ingresos, 0);
        const totalServices = Math.floor(totalIncome / (40 * factor + 10));
        const distribucion = [
            { n: 'Servicio A', v: Math.floor(totalServices * 0.6) },
            { n: 'Servicio B', v: Math.floor(totalServices * 0.3) },
            { n: 'Servicio C', v: Math.floor(totalServices * 0.1) }
        ];
        return {
            tendencia: trend,
            distribucion,
            metrics: { income: totalIncome, services: totalServices, clients: Math.floor(totalServices * 0.75) }
        };
    };

    let generatedData;
    switch (timeRange) {
        case 'day': generatedData = generateData(0.1, 8, 'h'); break;
        case 'week': generatedData = generateData(0.5, 7, 'd'); break;
        case 'month': generatedData = generateData(2, 4, 's'); break;
        case 'year': generatedData = generateData(10, 12, 'm'); break;
        default: generatedData = { tendencia: [], distribucion: [], metrics: null };
    }
    return { chartData: generatedData, metrics: generatedData.metrics };
  }, [localId, timeRange, selectedDate]);

  if (userRole === 'local' && authLocalId !== localId) { 
      return <div className="text-center p-4"><h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1></div>; 
  }
  if (!local) { 
      return <div className="text-center p-4"><h1 className="text-2xl font-bold">Local no encontrado</h1></div>; 
  }

  const handleDateSelect = (date: Date, range: TimeRange) => {
    if(!date) return;
    setSelectedDate(date);
    setTimeRange(range);
  };

  const getButtonLabel = (range: TimeRange) => {
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
            <Popover>
                <PopoverTrigger asChild><Button variant={timeRange === 'day' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'day' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'day' ? getButtonLabel('day') : 'Día'}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={(d) => handleDateSelect(d, 'day')} /></PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild><Button variant={timeRange === 'week' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'week' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'week' ? getButtonLabel('week') : 'Semana'}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" showOutsideDays={false} onSelect={(d) => handleDateSelect(d, 'week')} selected={selectedDate} /></PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild><Button variant={timeRange === 'month' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'month' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'month' ? getButtonLabel('month') : 'Mes'}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><MonthPicker onSelect={(d) => handleDateSelect(d, 'month')} /></PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild><Button variant={timeRange === 'year' ? "default" : "ghost"} className={cn("capitalize w-auto flex-1 min-w-[80px]", timeRange === 'year' && "bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700")}><CalendarIcon className="mr-2 h-4 w-4" />{timeRange === 'year' ? getButtonLabel('year') : 'Año'}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><YearPicker onSelect={(d) => handleDateSelect(d, 'year')} /></PopoverContent>
            </Popover>
          </div>
        </div>

        {/* --- TARJETAS DE MÉTRICAS DINÁMICAS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">S/{metrics ? metrics.income.toLocaleString() : '0'}</div><p className="text-xs text-muted-foreground">Total del periodo</p></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clientes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics ? metrics.clients : '0'}</div><p className="text-xs text-muted-foreground">Total del periodo</p></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Servicios</CardTitle><Scissors className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics ? metrics.services : '0'}</div><p className="text-xs text-muted-foreground">Total del periodo</p></CardContent></Card>
          <Card className="border-0 shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">S/{metrics && metrics.clients > 0 ? (metrics.income / metrics.clients).toFixed(2) : '0.00'}</div><p className="text-xs text-muted-foreground">Promedio del periodo</p></CardContent></Card>
        </div>

        {/* --- GRÁFICOS --- */}
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
                  <Pie data={chartData.distribucion} cx="50%" cy="50%" labelLine={false} label={({ n, percent }) => `${n} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="v">
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