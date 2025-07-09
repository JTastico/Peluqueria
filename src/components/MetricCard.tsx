
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = "from-stylepro-lavender-500 to-stylepro-blue-500"
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in border-0 shadow-md">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-r ${gradient} p-4`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                {icon}
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white">
          {subtitle && (
            <p className="text-muted-foreground text-sm mb-2">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center gap-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground text-sm">vs mes anterior</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
