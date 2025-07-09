
import { useState } from "react";
import { Calendar, Filter, Download, TrendingUp, DollarSign, Users, Scissors } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const ventasData = [
  { mes: 'Ene', ventas: 45000, clientes: 234 },
  { mes: 'Feb', ventas: 52000, clientes: 267 },
  { mes: 'Mar', ventas: 48000, clientes: 245 },
  { mes: 'Abr', ventas: 61000, clientes: 298 },
  { mes: 'May', ventas: 55000, clientes: 276 },
  { mes: 'Jun', ventas: 67000, clientes: 312 }
];

const peluquerosData = [
  { nombre: 'María G.', ingresos: 32000, clientes: 145 },
  { nombre: 'Carlos M.', ingresos: 28000, clientes: 132 },
  { nombre: 'Ana R.', ingresos: 25000, clientes: 118 },
  { nombre: 'Roberto S.', ingresos: 22000, clientes: 98 },
  { nombre: 'Laura J.', ingresos: 30000, clientes: 128 }
];

const serviciosData = [
  { name: 'Corte Clásico', value: 35, color: '#8B5CF6' },
  { name: 'Coloración', value: 25, color: '#06B6D4' },
  { name: 'Mechas', value: 20, color: '#F59E0B' },
  { name: 'Peinados', value: 12, color: '#10B981' },
  { name: 'Otros', value: 8, color: '#EF4444' }
];

const localesData = [
  { local: 'Centro', ingresos: 85000, clientes: 234, crecimiento: 12 },
  { local: 'Norte', ingresos: 92000, clientes: 267, crecimiento: 8 },
  { local: 'Sur', ingresos: 67000, clientes: 178, crecimiento: 15 }
];

const Reportes = () => {
  const [selectedLocal, setSelectedLocal] = useState("todos");
  const [selectedPeluquero, setSelectedPeluquero] = useState("todos");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Analiza el rendimiento de tu negocio con datos detallados</p>
        </div>

        {/* Filtros */}
        <Card className="mb-8 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rango de Fechas</label>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Últimos 6 meses
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Local</label>
                <Select value={selectedLocal} onValueChange={setSelectedLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los locales</SelectItem>
                    <SelectItem value="centro">StylePro Centro</SelectItem>
                    <SelectItem value="norte">StylePro Norte</SelectItem>
                    <SelectItem value="sur">StylePro Sur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Peluquero</label>
                <Select value={selectedPeluquero} onValueChange={setSelectedPeluquero}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar peluquero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los peluqueros</SelectItem>
                    <SelectItem value="maria">María González</SelectItem>
                    <SelectItem value="carlos">Carlos Mendoza</SelectItem>
                    <SelectItem value="ana">Ana Rodríguez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-stylepro-gold-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-stylepro-gold-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-stylepro-gold-600">S/244,000</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% vs mes anterior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-stylepro-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-stylepro-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
                  <p className="text-2xl font-bold text-stylepro-blue-600">679</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +8% vs mes anterior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-stylepro-lavender-100 rounded-lg">
                  <Scissors className="h-6 w-6 text-stylepro-lavender-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Servicios Realizados</p>
                  <p className="text-2xl font-bold text-stylepro-lavender-600">892</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +15% vs mes anterior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-green-600">S/359</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +5% vs mes anterior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Tendencia de Ventas e Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ventasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ventas" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Distribución de Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviciosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviciosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Rendimiento por Peluquero</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peluquerosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ingresos" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Comparativo por Local</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localesData.map((local, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-stylepro-lavender-50/50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">StylePro {local.local}</h3>
                      <p className="text-sm text-muted-foreground">{local.clientes} clientes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-stylepro-gold-600">S/{local.ingresos.toLocaleString()}</p>
                      <p className="text-sm text-green-600">+{local.crecimiento}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
