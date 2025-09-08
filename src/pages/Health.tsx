import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthMetricsCard } from "@/components/health/HealthMetricsCard";
import { HealthChart } from "@/components/health/HealthChart";
import { HealthIntegrationCard } from "@/components/health/HealthIntegrationCard";
import { useHealthData } from "@/hooks/useHealthData";
import { useHealthSync } from "@/hooks/useHealthSync";
import { CompanionAppButton } from "@/components/health/CompanionAppButton";
import { ArrowLeft, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Health() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  const { syncing, lastSyncDate, syncHealthData } = useHealthSync();
  
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
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-secondary"
            >
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
        <div className="mb-6">
          {/* Back button and title section */}
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="shrink-0 hover:bg-secondary p-2 h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight">Estatísticas de Saúde</h1>
                  <p className="text-sm sm:text-base text-primary mt-1">Acompanhe seus dados de saúde e bem-estar</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {lastSyncDate && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Última sync: {lastSyncDate.toLocaleString('pt-BR')}
                    </p>
                  )}
                  <Button
                    onClick={syncHealthData}
                    disabled={syncing}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                    {syncing ? 'Sync...' : 'Sincronizar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filters section */}
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <Tabs value={dateRange} onValueChange={(value) => setDateRange(value as any)} className="w-full max-w-sm">
              <TabsList className="grid w-full grid-cols-3 bg-secondary rounded-lg p-1 h-10">
                <TabsTrigger 
                  value="week" 
                  className="text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                >
                  Semana
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  className="text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                >
                  Mês
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                >
                  Todos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Companion App Button */}
        <CompanionAppButton />
        
        {/* Integration Card */}
        <HealthIntegrationCard />

        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24 bg-muted" />
                  <Skeleton className="h-4 w-4 bg-muted" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-20 bg-muted" />
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
                className="rounded-xl"
              />
              <HealthMetricsCard
                title="Frequência Cardíaca"  
                value={metrics.avgHeartRate}
                unit="bpm"
                icon="heart"
                trend={metrics.trends.heartRate.trend}
                trendValue={`${metrics.trends.heartRate.value}%`}
                className="rounded-xl"
              />
              <HealthMetricsCard
                title="Sono"
                value={metrics.avgSleep}
                unit="horas"
                icon="sleep"
                trend={metrics.trends.sleep.trend}
                trendValue={`${metrics.trends.sleep.value}%`}
                className="rounded-xl"
              />
              <HealthMetricsCard
                title="Calorias"
                value={Math.round(metrics.totalCalories)}
                unit="kcal"
                icon="calories"
                trend={metrics.trends.calories.trend}
                trendValue={`${metrics.trends.calories.value}%`}
                className="rounded-xl"
              />
            </>
          )}
        </div>

        {/* Charts */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-xl shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-muted" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="steps" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-secondary rounded-lg p-1">
              <TabsTrigger value="steps" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Passos</TabsTrigger>
              <TabsTrigger value="heart" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Batimentos</TabsTrigger>
              <TabsTrigger value="sleep" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Sono</TabsTrigger>
              <TabsTrigger value="calories" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Calorias</TabsTrigger>
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
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resumo do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold text-primary">{metrics.totalSteps.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total de Passos</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold">{metrics.avgHeartRate}</p>
                  <p className="text-sm text-muted-foreground">BPM Médio</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold text-primary">{metrics.avgSleep}h</p>
                  <p className="text-sm text-muted-foreground">Sono Médio</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold">{Math.round(metrics.totalCalories).toLocaleString()}</p>
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