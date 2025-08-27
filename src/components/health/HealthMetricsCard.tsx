import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Moon, Zap } from "lucide-react";

interface HealthMetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: 'steps' | 'heart' | 'sleep' | 'calories';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: string;
}

const iconMap = {
  steps: Activity,
  heart: Heart,
  sleep: Moon,
  calories: Zap
};

const colorMap = {
  steps: 'text-blue-600',
  heart: 'text-red-600',
  sleep: 'text-purple-600',
  calories: 'text-orange-600'
};

export function HealthMetricsCard({ 
  title, 
  value, 
  unit, 
  icon, 
  trend, 
  trendValue,
  color 
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
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-1">
          <div className="text-2xl font-bold">
            {formatValue(value)}
          </div>
          {unit && (
            <div className="text-sm text-muted-foreground">
              {unit}
            </div>
          )}
        </div>
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              vs. semana anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}