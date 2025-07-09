
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData = [
  { name: 'Lun', ingresos: 2400, servicios: 24 },
  { name: 'Mar', ingresos: 1398, servicios: 18 },
  { name: 'Mié', ingresos: 9800, servicios: 42 },
  { name: 'Jue', ingresos: 3908, servicios: 28 },
  { name: 'Vie', ingresos: 4800, servicios: 35 },
  { name: 'Sáb', ingresos: 3800, servicios: 31 },
  { name: 'Dom', ingresos: 4300, servicios: 33 },
];

export function RevenueChart() {
  return (
    <Card className="shadow-md border-0 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-stylepro-lavender-500 to-stylepro-gold-500"></div>
          Ingresos Semanales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `S/${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              }}
              formatter={(value, name) => [
                name === 'ingresos' ? `S/${value}` : `${value} servicios`,
                name === 'ingresos' ? 'Ingresos' : 'Servicios'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="ingresos" 
              stroke="url(#gradient1)" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
