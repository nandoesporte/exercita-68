import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";
import { HealthData } from "@/hooks/useHealthData";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HealthChartProps {
  data: HealthData[];
  type: 'steps' | 'heart_rate' | 'sleep_hours' | 'calories';
  title: string;
  color?: string;
  chartType?: 'line' | 'bar';
}

const chartConfig = {
  steps: {
    label: "Passos",
    color: "hsl(var(--chart-1))",
  },
  heart_rate: {
    label: "Batimentos",
    color: "hsl(var(--chart-2))",
  },
  sleep_hours: {
    label: "Horas de Sono",
    color: "hsl(var(--chart-3))",
  },
  calories: {
    label: "Calorias",
    color: "hsl(var(--chart-4))",
  },
};

export function HealthChart({ 
  data, 
  type, 
  title, 
  color,
  chartType = 'line'
}: HealthChartProps) {
  const processedData = data
    .filter(item => item[type] !== null && item[type] !== undefined)
    .map(item => ({
      date: format(parseISO(item.date), 'dd/MM', { locale: ptBR }),
      fullDate: item.date,
      value: item[type] as number,
      label: chartConfig[type].label
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    .slice(-30); // Show last 30 days

  const chartColor = color || chartConfig[type].color;

  if (processedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={processedData}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return format(parseISO(payload[0].payload.fullDate), 'dd/MM/yyyy', { locale: ptBR });
                    }
                    return value;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chartColor }}
                />
              </LineChart>
            ) : (
              <BarChart data={processedData}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return format(parseISO(payload[0].payload.fullDate), 'dd/MM/yyyy', { locale: ptBR });
                    }
                    return value;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill={chartColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}