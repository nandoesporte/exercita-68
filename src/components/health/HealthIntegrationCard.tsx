import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Watch, RefreshCw, Unplug, Heart, Activity } from "lucide-react";
import { useHealthIntegration } from "@/hooks/useHealthIntegration";
import { useHealthData } from "@/hooks/useHealthData";

export function HealthIntegrationCard() {
  const {
    isGoogleFitConnected,
    isAppleHealthKitConnected,
    loading,
    connectGoogleFit,
    connectAppleHealthKit,
    fetchGoogleFitData,
    fetchAppleHealthKitData,
    disconnect
  } = useHealthIntegration();

  const { syncHealthData, loading: syncLoading } = useHealthData();

  const handleSync = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      let healthData: any[] = [];

      if (isGoogleFitConnected) {
        const googleData = await fetchGoogleFitData(startDate, endDate);
        healthData = healthData.concat(googleData);
      }

      if (isAppleHealthKitConnected) {
        const appleData = await fetchAppleHealthKitData(startDate, endDate);
        healthData = healthData.concat(appleData);
      }

      if (healthData.length > 0) {
        await syncHealthData(healthData);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const isConnected = isGoogleFitConnected || isAppleHealthKitConnected;

  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-4">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Heart className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-center">Conectar Dispositivos</h1>
        <p className="text-sm text-muted-foreground text-center max-w-sm mx-auto">
          Sincronize seus dados de saúde e acompanhe seu progresso
        </p>
      </div>

      {/* Google Fit Card */}
      <Card className="rounded-xl shadow-sm border-0 shadow-black/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-50 rounded-2xl">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">Google Fit</h3>
              <p className="text-sm text-muted-foreground">
                Conecte com seu dispositivo Android para sincronizar passos, frequência cardíaca e calorias
              </p>
            </div>

            <div className="flex justify-center mb-4">
              {isGoogleFitConnected ? (
                <Badge className="bg-green-50 text-green-700 hover:bg-green-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-50 text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Desconectado
                </Badge>
              )}
            </div>

            <Button
              className="w-full rounded-xl font-medium"
              variant={isGoogleFitConnected ? "outline" : "default"}
              onClick={connectGoogleFit}
              disabled={loading}
              size="lg"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {isGoogleFitConnected ? "Reconectar" : "Conectar Google Fit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Apple HealthKit Card */}
      <Card className="rounded-xl shadow-sm border-0 shadow-black/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <Watch className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">Apple HealthKit</h3>
              <p className="text-sm text-muted-foreground">
                Conecte com seu iPhone ou Apple Watch para acessar dados completos de saúde
              </p>
            </div>

            <div className="flex justify-center mb-4">
              {isAppleHealthKitConnected ? (
                <Badge className="bg-green-50 text-green-700 hover:bg-green-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-50 text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Desconectado
                </Badge>
              )}
            </div>

            <Button
              className="w-full rounded-xl font-medium"
              variant={isAppleHealthKitConnected ? "outline" : "default"}
              onClick={connectAppleHealthKit}
              disabled={loading}
              size="lg"
            >
              <Watch className="h-4 w-4 mr-2" />
              {isAppleHealthKitConnected ? "Reconectar" : "Conectar Apple Health"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isConnected && (
        <div className="space-y-3 pt-2">
          <Button
            onClick={handleSync}
            disabled={syncLoading || loading}
            className="w-full rounded-xl font-medium bg-primary hover:bg-primary/90"
            size="lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Sincronizando...' : 'Sincronizar Dados'}
          </Button>
          
          <Button
            variant="outline"
            onClick={disconnect}
            disabled={loading}
            className="w-full rounded-xl font-medium border-2"
            size="lg"
          >
            <Unplug className="h-4 w-4 mr-2" />
            Desconectar Todos
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isConnected && (
        <Card className="rounded-xl border-dashed border-2 border-gray-200">
          <CardContent className="p-6 text-center space-y-3">
            <div className="flex justify-center">
              <Activity className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium text-gray-900">Nenhum dispositivo conectado</h3>
              <p className="text-sm text-muted-foreground">
                Conecte um dispositivo acima para começar a sincronizar seus dados de saúde
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}