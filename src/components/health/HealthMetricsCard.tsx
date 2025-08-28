import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Moon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthMetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: 'steps' | 'heart' | 'sleep' | 'calories';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: string;
  className?: string;
}

const iconMap = {
  steps: Activity,
  heart: Heart,
  sleep: Moon,
  calories: Zap
};

const colorMap = {
  steps: 'text-orange-600',
  heart: 'text-orange-600',
  sleep: 'text-gray-700',
  calories: 'text-gray-700'
};

export function HealthMetricsCard({ 
  title, 
  value, 
  unit, 
  icon, 
  trend, 
  trendValue,
  color,
  className 
}: HealthMetricsCardProps) {
  const Icon = iconMap[icon];

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={cn("relative overflow-hidden rounded-xl shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-fitness-orange" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-1">
          <div className="text-2xl font-bold text-white">
            {formatValue(value)}
          </div>
          {unit && (
            <div className="text-sm text-gray-300">
              {unit}
            </div>
          )}
        </div>
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
              className={cn(
                "text-xs",
                trend === 'up' && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
                trend === 'down' && "bg-red-500/20 text-red-400 hover:bg-red-500/20",
                trend === 'stable' && "bg-gray-500/20 text-gray-400 hover:bg-gray-500/20"
              )}
            >
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </Badge>
            <span className="text-xs text-gray-400 ml-2">
              vs. período anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}