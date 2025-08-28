import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface HealthConnection {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  last_sync_at?: string;
  sync_frequency_minutes: number;
  is_active: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthProviderSettings {
  id: string;
  provider: string;
  is_enabled: boolean;
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  redirect_uri?: string;
  scopes: any;
  additional_config?: any;
}

export function useHealthConnections() {
  const [connections, setConnections] = useState<HealthConnection[]>([]);
  const [providerSettings, setProviderSettings] = useState<HealthProviderSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('health_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data as HealthConnection[] || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching health connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('health_provider_settings')
        .select('*');

      if (error) throw error;
      setProviderSettings(data as HealthProviderSettings[] || []);
    } catch (err: any) {
      console.error('Error fetching provider settings:', err);
    }
  };

  const connectProvider = async (provider: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const providerSetting = providerSettings.find(p => p.provider === provider);
      if (!providerSetting?.is_enabled) {
        throw new Error('Este provedor não está habilitado.');
      }

      const { data: connection, error: connectionError } = await supabase
        .from('health_connections')
        .upsert({
          user_id: user.id,
          provider,
          status: 'pending',
          sync_frequency_minutes: 60,
          is_active: true
        }, { onConflict: 'user_id,provider' })
        .select()
        .single();

      if (connectionError) throw connectionError;

      const { data, error } = await supabase.functions.invoke('health-oauth', {
        body: { provider, connection_id: connection.id, action: 'initiate' }
      });

      if (error) throw error;
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        throw new Error('Não foi possível obter URL de autenticação');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro na conexão",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectProvider = async (provider: string) => {
    try {
      setLoading(true);
      await supabase.from('health_connections').update({
        status: 'disconnected', access_token: null, refresh_token: null,
        token_expires_at: null, is_active: false, error_message: null
      }).eq('provider', provider);

      await fetchConnections();
      toast({
        title: "Desconectado",
        description: `${provider} desconectado com sucesso.`
      });
    } catch (err: any) {
      toast({
        title: "Erro ao desconectar",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = (provider: string) => {
    const connection = connections.find(c => c.provider === provider);
    const providerSetting = providerSettings.find(p => p.provider === provider);
    
    return {
      connection,
      isEnabled: providerSetting?.is_enabled || false,
      isConnected: connection?.status === 'connected',
      isPending: connection?.status === 'pending',
      hasError: connection?.status === 'error',
      lastSync: connection?.last_sync_at,
      errorMessage: connection?.error_message
    };
  };

  useEffect(() => {
    fetchConnections();
    fetchProviderSettings();
  }, []);

  return {
    connections,
    providerSettings,
    loading,
    error,
    connectProvider,
    disconnectProvider,
    getConnectionStatus,
    refetch: fetchConnections
  };
}