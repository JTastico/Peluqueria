
import { MetricCard } from "./MetricCard";
import { RevenueChart } from "./RevenueChart";
import { StylistRanking } from "./StylistRanking";
import { 
  LayoutDashboard,
  MapPin,
  Users,
  ShoppingBag,
  FileBarChart,
  Settings,
  FileText
} from "lucide-react";

export function Dashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard Koko
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus peluquerías de forma inteligente y profesional
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ingresos Hoy"
          value="S/4,285"
          subtitle="Día activo"
          icon={<FileBarChart className="h-6 w-6" />}
          trend={{ value: 12.5, isPositive: true }}
          gradient="from-stylepro-lavender-500 to-stylepro-lavender-600"
        />
        
        <MetricCard
          title="Local Top"
          value="Sucursal Centro"
          subtitle="Mayor facturación"
          icon={<MapPin className="h-6 w-6" />}
          trend={{ value: 8.2, isPositive: true }}
          gradient="from-stylepro-blue-500 to-stylepro-blue-600"
        />
        
        <MetricCard
          title="Servicios Hoy"
          value="47"
          subtitle="En progreso: 8"
          icon={<ShoppingBag className="h-6 w-6" />}
          trend={{ value: 15.3, isPositive: true }}
          gradient="from-stylepro-gold-500 to-stylepro-gold-600"
        />
        
        <MetricCard
          title="Clientes Activos"
          value="1,284"
          subtitle="Registrados este mes"
          icon={<Users className="h-6 w-6" />}
          trend={{ value: 23.1, isPositive: true }}
          gradient="from-green-500 to-green-600"
        />
      </div>

      {/* Gráficos y Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <StylistRanking />
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Productos Populares"
          value="Shampoo Premium"
          subtitle="Más utilizado"
          icon={<ShoppingBag className="h-6 w-6" />}
          gradient="from-purple-500 to-purple-600"
        />
        
        <MetricCard
          title="Inventario Crítico"
          value="3 productos"
          subtitle="Requieren reposición"
          icon={<FileText className="h-6 w-6" />}
          gradient="from-red-500 to-red-600"
        />
        
        <MetricCard
          title="Satisfaction Score"
          value="4.8/5.0"
          subtitle="Promedio general"
          icon={<Settings className="h-6 w-6" />}
          gradient="from-stylepro-lavender-500 to-stylepro-gold-500"
        />
      </div>
    </div>
  );
}
