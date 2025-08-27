import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Watch, RefreshCw, Unplug } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Watch className="h-5 w-5" />
          Integração com Serviços de Saúde
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {/* Google Fit */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Google Fit</h4>
                <p className="text-sm text-muted-foreground">
                  Sincronize dados do Android
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleFitConnected ? (
                <Badge variant="default">Conectado</Badge>
              ) : (
                <Badge variant="secondary">Desconectado</Badge>
              )}
              <Button
                size="sm"
                variant={isGoogleFitConnected ? "outline" : "default"}
                onClick={connectGoogleFit}
                disabled={loading}
              >
                {isGoogleFitConnected ? "Reconectar" : "Conectar"}
              </Button>
            </div>
          </div>

          {/* Apple HealthKit */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Watch className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium">Apple HealthKit</h4>
                <p className="text-sm text-muted-foreground">
                  Sincronize dados do iOS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAppleHealthKitConnected ? (
                <Badge variant="default">Conectado</Badge>
              ) : (
                <Badge variant="secondary">Desconectado</Badge>
              )}
              <Button
                size="sm"
                variant={isAppleHealthKitConnected ? "outline" : "default"}
                onClick={connectAppleHealthKit}
                disabled={loading}
              >
                {isAppleHealthKitConnected ? "Reconectar" : "Conectar"}
              </Button>
            </div>
          </div>
        </div>

        {isConnected && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSync}
              disabled={syncLoading || loading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
              Sincronizar Dados
            </Button>
            <Button
              variant="outline"
              onClick={disconnect}
              disabled={loading}
            >
              <Unplug className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          </div>
        )}

        {!isConnected && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Conecte-se com um serviço de saúde para começar a sincronizar seus dados
          </div>
        )}
      </CardContent>
    </Card>
  );
}