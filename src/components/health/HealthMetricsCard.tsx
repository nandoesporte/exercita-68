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
  const iconColor = color || colorMap[icon];

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={cn("relative overflow-hidden rounded-xl shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-800">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-1">
          <div className={`text-2xl font-bold ${icon === 'steps' || icon === 'sleep' ? 'text-orange-600' : 'text-gray-700'}`}>
            {formatValue(value)}
          </div>
          {unit && (
            <div className="text-sm text-gray-600">
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
                trend === 'up' && "bg-green-100 text-green-700 hover:bg-green-100",
                trend === 'down' && "bg-red-100 text-red-700 hover:bg-red-100",
                trend === 'stable' && "bg-gray-100 text-gray-700 hover:bg-gray-100"
              )}
            >
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </Badge>
            <span className="text-xs text-gray-500 ml-2">
              vs. período anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}