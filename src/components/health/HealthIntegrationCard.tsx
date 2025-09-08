import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HealthOnboarding } from './HealthOnboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHealthConnections } from '@/hooks/useHealthConnections';
import { Loader2, Smartphone, RefreshCw } from 'lucide-react';

export function HealthIntegrationCard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const {
    loading,
    connectProvider,
    disconnectProvider,
    getConnectionStatus
  } = useHealthConnections();

  const appleStatus = getConnectionStatus('apple_health');
  const healthConnectStatus = getConnectionStatus('health_connect'); 
  const samsungStatus = getConnectionStatus('samsung_health');

  const handleConnect = async (provider: string) => {
    const status = getConnectionStatus(provider);
    
    if (status.isConnected) {
      await disconnectProvider(provider);
    } else {
      await connectProvider(provider);
    }
  };

  const ProviderCard = ({ 
    provider, 
    icon, 
    name, 
    status 
  }: { 
    provider: string;
    icon: string;
    name: string;
    status: ReturnType<typeof getConnectionStatus>;
  }) => {
    const showMobileOnly = provider === 'apple_health' || provider === 'health_connect';
    
    return (
      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h4 className="font-medium">{name}</h4>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-sm">
                {status.isConnected ? 'Conectado' : 
                 status.isPending ? 'Conectando...' :
                 status.hasError ? 'Erro na conexão' :
                 showMobileOnly ? 'Requer app móvel' : 'Disponível'}
              </p>
              {showMobileOnly && (
                <Smartphone className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            {status.lastSync && (
              <p className="text-xs text-muted-foreground/80">
                Última sync: {new Date(status.lastSync).toLocaleString('pt-BR')}
              </p>
            )}
            {status.errorMessage && (
              <p className="text-xs text-destructive">
                {status.errorMessage}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status.isConnected && (
            <Badge className="bg-success/20 text-success border-success/30">
              Conectado
            </Badge>
          )}
          {!status.isEnabled && (
            <Badge className="bg-muted/50 text-muted-foreground border-muted">
              Desabilitado
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConnect(provider)}
            disabled={loading || !status.isEnabled}
            className={cn(
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              status.isConnected && "bg-primary/10 border-primary text-primary",
              !status.isEnabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Conectando...
              </>
            ) : status.isConnected ? (
              'Desconectar'
            ) : (
              'Conectar'
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Check if user needs onboarding
  const hasAnyConnection = appleStatus.isConnected || healthConnectStatus.isConnected || samsungStatus.isConnected;

  if (showOnboarding || !hasAnyConnection) {
    return (
      <HealthOnboarding 
        onComplete={() => setShowOnboarding(false)}
        className="mb-6"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dispositivos Conectados</CardTitle>
            <CardDescription>
              Gerencie suas integrações com dispositivos de saúde
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
          >
            Configurar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProviderCard
          provider="apple_health"
          icon="🍎"
          name="Apple Health"
          status={appleStatus}
        />
        <ProviderCard
          provider="health_connect"
          icon="🏥"
          name="Health Connect (Android)"
          status={healthConnectStatus}
        />
        <ProviderCard
          provider="samsung_health"
          icon="📱"
          name="Samsung Health"
          status={samsungStatus}
        />
      </CardContent>
    </Card>
  );
}