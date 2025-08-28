import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Watch, RefreshCw, Unplug, Heart, Activity, Loader2 } from "lucide-react";
import { useHealthIntegration } from "@/hooks/useHealthIntegration";
import { useHealthData } from "@/hooks/useHealthData";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  
  const [isConnecting, setIsConnecting] = useState({
    appleHealth: false,
    googleFit: false,
    samsungHealth: false
  });

  const [isConnected, setIsConnected] = useState({
    appleHealth: isAppleHealthKitConnected,
    googleFit: isGoogleFitConnected,
    samsungHealth: false
  });

  const handleConnect = async (service: 'appleHealth' | 'googleFit' | 'samsungHealth') => {
    setIsConnecting(prev => ({ ...prev, [service]: true }));
    
    try {
      // Simular conexão
      setTimeout(() => {
        setIsConnected(prev => ({ ...prev, [service]: !prev[service] }));
        setIsConnecting(prev => ({ ...prev, [service]: false }));
      }, 2000);
    } catch (error) {
      setIsConnecting(prev => ({ ...prev, [service]: false }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto rounded-xl bg-fitness-darkGray shadow-lg border-none overflow-hidden">
      <CardHeader className="text-center pb-4 bg-fitness-dark">
        <CardTitle className="text-xl font-bold text-white mb-2">
          Conectar Dispositivos
        </CardTitle>
        <p className="text-base text-gray-300">
          Sincronize seus dados de saúde
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Apple Health */}
        <div className="flex items-center justify-between p-4 bg-fitness-dark rounded-xl hover:bg-fitness-dark/80 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Apple Health</h3>
              <p className="text-sm text-gray-300">
                {isConnected.appleHealth ? 'Conectado' : 'Não conectado'}
              </p>
            </div>
          </div>
          <Button
            variant={isConnected.appleHealth ? "outline" : "default"}
            size="sm"
            onClick={() => handleConnect('appleHealth')}
            disabled={isConnecting.appleHealth}
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-lg transition-all",
              isConnected.appleHealth 
                ? "border-gray-600 text-gray-300 hover:bg-fitness-darkGray" 
                : "bg-fitness-orange text-white hover:bg-fitness-orange/90 shadow-sm"
            )}
          >
            {isConnecting.appleHealth ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              isConnected.appleHealth ? 'Desconectar' : 'Conectar'
            )}
          </Button>
        </div>

        {/* Google Fit */}
        <div className="flex items-center justify-between p-4 bg-fitness-dark rounded-xl hover:bg-fitness-dark/80 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Google Fit</h3>
              <p className="text-sm text-gray-300">
                {isConnected.googleFit ? 'Conectado' : 'Não conectado'}
              </p>
            </div>
          </div>
          <Button
            variant={isConnected.googleFit ? "outline" : "default"}
            size="sm"
            onClick={() => handleConnect('googleFit')}
            disabled={isConnecting.googleFit}
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-lg transition-all",
              isConnected.googleFit 
                ? "border-gray-600 text-gray-300 hover:bg-fitness-darkGray" 
                : "bg-fitness-orange text-white hover:bg-fitness-orange/90 shadow-sm"
            )}
          >
            {isConnecting.googleFit ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              isConnected.googleFit ? 'Desconectar' : 'Conectar'
            )}
          </Button>
        </div>

        {/* Samsung Health */}
        <div className="flex items-center justify-between p-4 bg-fitness-dark rounded-xl hover:bg-fitness-dark/80 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Samsung Health</h3>
              <p className="text-sm text-gray-300">
                {isConnected.samsungHealth ? 'Conectado' : 'Não conectado'}
              </p>
            </div>
          </div>
          <Button
            variant={isConnected.samsungHealth ? "outline" : "default"}
            size="sm"
            onClick={() => handleConnect('samsungHealth')}
            disabled={isConnecting.samsungHealth}
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-lg transition-all",
              isConnected.samsungHealth 
                ? "border-gray-600 text-gray-300 hover:bg-fitness-darkGray" 
                : "bg-fitness-orange text-white hover:bg-fitness-orange/90 shadow-sm"
            )}
          >
            {isConnecting.samsungHealth ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              isConnected.samsungHealth ? 'Desconectar' : 'Conectar'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
