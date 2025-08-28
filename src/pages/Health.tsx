import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthMetricsCard } from "@/components/health/HealthMetricsCard";
import { HealthChart } from "@/components/health/HealthChart";
import { HealthIntegrationCard } from "@/components/health/HealthIntegrationCard";
import { useHealthData } from "@/hooks/useHealthData";
import { ArrowLeft, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Health() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  
  // Calculate date range
  const today = new Date();
  let startDate: string | undefined;
  let endDate: string | undefined;

  switch (dateRange) {
    case 'week':
      startDate = format(startOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd');
      endDate = format(endOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd');
      break;
    case 'month':
      startDate = format(startOfMonth(today), 'yyyy-MM-dd');
      endDate = format(endOfMonth(today), 'yyyy-MM-dd');
      break;
    default:
      startDate = undefined;
      endDate = undefined;
  }

  const { data, loading, error } = useHealthData(startDate, endDate);

  // Calculate metrics
  const calculateMetrics = () => {
    if (!data || data.length === 0) {
      return {
        totalSteps: 0,
        avgHeartRate: 0,
        avgSleep: 0,
        totalCalories: 0,
        trends: {
          steps: { value: 0, trend: 'stable' as const },
          heartRate: { value: 0, trend: 'stable' as const },
          sleep: { value: 0, trend: 'stable' as const },
          calories: { value: 0, trend: 'stable' as const }
        }
      };
    }

    const totalSteps = data.reduce((sum, item) => sum + (item.steps || 0), 0);
    const heartRateData = data.filter(item => item.heart_rate);
    const avgHeartRate = heartRateData.length > 0 
      ? Math.round(heartRateData.reduce((sum, item) => sum + (item.heart_rate || 0), 0) / heartRateData.length)
      : 0;
    
    const sleepData = data.filter(item => item.sleep_hours);
    const avgSleep = sleepData.length > 0
      ? Math.round((sleepData.reduce((sum, item) => sum + (item.sleep_hours || 0), 0) / sleepData.length) * 10) / 10
      : 0;
    
    const totalCalories = data.reduce((sum, item) => sum + (item.calories || 0), 0);

    // Calculate trends (simplified - comparing with previous period)
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);

    const calculateTrend = (first: any[], second: any[], field: string): { value: number; trend: 'up' | 'down' | 'stable' } => {
      const firstAvg = first.reduce((sum, item) => sum + (item[field] || 0), 0) / Math.max(first.length, 1);
      const secondAvg = second.reduce((sum, item) => sum + (item[field] || 0), 0) / Math.max(second.length, 1);
      const change = ((secondAvg - firstAvg) / Math.max(firstAvg, 1)) * 100;
      
      return {
        value: Math.abs(Math.round(change)),
        trend: (change > 5 ? 'up' : change < -5 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };
    };

    return {
      totalSteps,
      avgHeartRate,
      avgSleep,
      totalCalories,
      trends: {
        steps: calculateTrend(firstHalf, secondHalf, 'steps'),
        heartRate: calculateTrend(firstHalf, secondHalf, 'heart_rate'),
        sleep: calculateTrend(firstHalf, secondHalf, 'sleep_hours'),
        calories: calculateTrend(firstHalf, secondHalf, 'calories')
      }
    };
  };

  const metrics = calculateMetrics();

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Saúde</h1>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-2">Erro ao carregar dados</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button variant="ghost" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">Estatísticas de Saúde</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Acompanhe seus dados de saúde e bem-estar</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <Tabs value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
              <TabsList className="w-full overflow-x-auto sm:overflow-visible max-w-[220px] sm:max-w-none">
                <TabsTrigger value="week" className="whitespace-nowrap">Semana</TabsTrigger>
                <TabsTrigger value="month" className="whitespace-nowrap">Mês</TabsTrigger>
                <TabsTrigger value="all" className="whitespace-nowrap">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Integration Card */}
        <HealthIntegrationCard />

        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <HealthMetricsCard
                title="Passos"
                value={metrics.totalSteps}
                icon="steps"
                trend={metrics.trends.steps.trend}
                trendValue={`${metrics.trends.steps.value}%`}
              />
              <HealthMetricsCard
                title="Frequência Cardíaca"  
                value={metrics.avgHeartRate}
                unit="bpm"
                icon="heart"
                trend={metrics.trends.heartRate.trend}
                trendValue={`${metrics.trends.heartRate.value}%`}
              />
              <HealthMetricsCard
                title="Sono"
                value={metrics.avgSleep}
                unit="horas"
                icon="sleep"
                trend={metrics.trends.sleep.trend}
                trendValue={`${metrics.trends.sleep.value}%`}
              />
              <HealthMetricsCard
                title="Calorias"
                value={Math.round(metrics.totalCalories)}
                unit="kcal"
                icon="calories"
                trend={metrics.trends.calories.trend}
                trendValue={`${metrics.trends.calories.value}%`}
              />
            </>
          )}
        </div>

        {/* Charts */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="steps" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="steps">Passos</TabsTrigger>
              <TabsTrigger value="heart">Batimentos</TabsTrigger>
              <TabsTrigger value="sleep">Sono</TabsTrigger>
              <TabsTrigger value="calories">Calorias</TabsTrigger>
            </TabsList>
            
            <TabsContent value="steps" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-1">
                <HealthChart
                  data={data}
                  type="steps"
                  title="Passos Diários"
                  chartType="bar"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="heart" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-1">
                <HealthChart
                  data={data}
                  type="heart_rate"
                  title="Frequência Cardíaca"
                  chartType="line"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="sleep" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-1">
                <HealthChart
                  data={data}
                  type="sleep_hours"
                  title="Horas de Sono"
                  chartType="bar"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="calories" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-1">
                <HealthChart
                  data={data}
                  type="calories"
                  title="Calorias Queimadas"
                  chartType="line"
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Summary */}
        {!loading && data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{metrics.totalSteps.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total de Passos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{metrics.avgHeartRate}</p>
                  <p className="text-sm text-muted-foreground">BPM Médio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{metrics.avgSleep}h</p>
                  <p className="text-sm text-muted-foreground">Sono Médio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{Math.round(metrics.totalCalories).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total de Calorias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}