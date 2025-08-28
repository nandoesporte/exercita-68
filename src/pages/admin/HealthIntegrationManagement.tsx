import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Users, Activity, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/admin/PermissionGuard';

interface HealthProviderSettings {
  id: string;
  provider: string;
  is_enabled: boolean;
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  redirect_uri?: string;
  scopes: any;
  additional_config?: any;
  created_at: string;
  updated_at: string;
}

interface HealthConnection {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  user?: any;
}

interface HealthSyncLog {
  id: string;
  user_id: string;
  provider: string;
  sync_type: string;
  status: string;
  records_synced: number;
  error_message?: string;
  sync_started_at: string;
  sync_completed_at?: string;
  user?: any;
}

const providerNames = {
  apple_health: 'Apple Health',
  google_fit: 'Google Fit',
  samsung_health: 'Samsung Health'
};

const providerIcons = {
  apple_health: '🍎',
  google_fit: '📊',
  samsung_health: '📱'
};

export default function HealthIntegrationManagement() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<HealthProviderSettings[]>([]);
  const [connections, setConnections] = useState<HealthConnection[]>([]);
  const [syncLogs, setSyncLogs] = useState<HealthSyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('providers');

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('health_provider_settings')
        .select('*')
        .order('provider');
      
      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar provedores: " + error.message);
    }
  };

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('health_connections')
        .select(`
          *,
          user:profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar conexões: " + error.message);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('health_sync_logs')
        .select(`
          *,
          user:profiles(first_name, last_name)
        `)
        .order('sync_started_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar logs: " + error.message);
    }
  };

  const saveProviderSettings = async (provider: HealthProviderSettings) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('health_provider_settings')
        .upsert({
          ...provider,
          scopes: provider.scopes,
          additional_config: provider.additional_config || {}
        });

      if (error) throw error;

      toast.success(`Configurações do ${providerNames[provider.provider]} foram salvas com sucesso.`);

      await fetchProviders();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchConnections();
    fetchSyncLogs();
  }, []);

  const ProviderCard = ({ provider }: { provider: HealthProviderSettings }) => {
    const [localProvider, setLocalProvider] = useState(provider);
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = async () => {
      await saveProviderSettings(localProvider);
      setIsEditing(false);
    };

    return (
      <Card className="bg-fitness-darkGray border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{providerIcons[provider.provider]}</span>
              <div>
                <CardTitle className="text-white">
                  {providerNames[provider.provider]}
                </CardTitle>
                <CardDescription>
                  Status: {localProvider.is_enabled ? 'Ativado' : 'Desativado'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={localProvider.is_enabled}
                onCheckedChange={(checked) => 
                  setLocalProvider({ ...localProvider, is_enabled: checked })
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isEditing && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`client_id_${provider.provider}`}>Client ID</Label>
                <Input
                  id={`client_id_${provider.provider}`}
                  value={localProvider.client_id || ''}
                  onChange={(e) => 
                    setLocalProvider({ ...localProvider, client_id: e.target.value })
                  }
                  className="bg-fitness-dark border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor={`client_secret_${provider.provider}`}>Client Secret</Label>
                <Input
                  id={`client_secret_${provider.provider}`}
                  type="password"
                  value={localProvider.client_secret || ''}
                  onChange={(e) => 
                    setLocalProvider({ ...localProvider, client_secret: e.target.value })
                  }
                  className="bg-fitness-dark border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor={`api_key_${provider.provider}`}>API Key</Label>
                <Input
                  id={`api_key_${provider.provider}`}
                  value={localProvider.api_key || ''}
                  onChange={(e) => 
                    setLocalProvider({ ...localProvider, api_key: e.target.value })
                  }
                  className="bg-fitness-dark border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor={`redirect_uri_${provider.provider}`}>Redirect URI</Label>
                <Input
                  id={`redirect_uri_${provider.provider}`}
                  value={localProvider.redirect_uri || ''}
                  onChange={(e) => 
                    setLocalProvider({ ...localProvider, redirect_uri: e.target.value })
                  }
                  className="bg-fitness-dark border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor={`scopes_${provider.provider}`}>Scopes (uma por linha)</Label>
              <Textarea
                id={`scopes_${provider.provider}`}
                value={localProvider.scopes.join('\n')}
                onChange={(e) => 
                  setLocalProvider({ 
                    ...localProvider, 
                    scopes: e.target.value.split('\n').filter(s => s.trim())
                  })
                }
                className="bg-fitness-dark border-gray-600 text-white"
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-fitness-orange hover:bg-fitness-orange/80"
              >
                Salvar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setLocalProvider(provider);
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <PermissionGuard permission="manage_users">
      <div className="min-h-screen bg-fitness-dark p-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="text-white hover:bg-fitness-darkGray"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciamento de Integrações de Saúde</h1>
              <p className="text-fitness-orange">Configure e monitore conexões com serviços de saúde</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-fitness-darkGray">
              <TabsTrigger value="providers" className="text-gray-300 data-[state=active]:bg-fitness-orange data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Provedores
              </TabsTrigger>
              <TabsTrigger value="connections" className="text-gray-300 data-[state=active]:bg-fitness-orange data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Conexões dos Usuários
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-gray-300 data-[state=active]:bg-fitness-orange data-[state=active]:text-white">
                <Activity className="h-4 w-4 mr-2" />
                Logs de Sincronização
              </TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              <div className="grid gap-4">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <Card className="bg-fitness-darkGray border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Conexões dos Usuários</CardTitle>
                  <CardDescription>
                    Status das conexões de saúde de todos os usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 bg-fitness-dark rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{providerIcons[connection.provider as keyof typeof providerIcons]}</span>
                          <div>
                            <p className="text-white font-medium">
                              {connection.user?.first_name} {connection.user?.last_name}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {providerNames[connection.provider as keyof typeof providerNames]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${getStatusColor(connection.status)} text-white`}>
                            {getStatusIcon(connection.status)}
                            <span className="ml-1 capitalize">{connection.status}</span>
                          </Badge>
                          {connection.last_sync_at && (
                            <span className="text-gray-400 text-sm">
                              Última sync: {new Date(connection.last_sync_at).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card className="bg-fitness-darkGray border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Logs de Sincronização</CardTitle>
                  <CardDescription>
                    Histórico de sincronizações de dados de saúde
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {syncLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-fitness-dark rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{providerIcons[log.provider as keyof typeof providerIcons]}</span>
                          <div>
                            <p className="text-white font-medium">
                              {log.user?.first_name} {log.user?.last_name}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {providerNames[log.provider as keyof typeof providerNames]} • {log.sync_type}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(log.sync_started_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${getStatusColor(log.status)} text-white`}>
                            {getStatusIcon(log.status)}
                            <span className="ml-1 capitalize">{log.status}</span>
                          </Badge>
                          <span className="text-gray-400 text-sm">
                            {log.records_synced} registros
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGuard>
  );
}