import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw,
  Trash2,
  Eye,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast-wrapper';

interface HealthConnection {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  access_token?: string;
  refresh_token?: string;
  access_token_vault_id?: string;
  refresh_token_vault_id?: string;
  token_last_rotated_at?: string;
  token_access_count: number;
  created_at: string;
  updated_at: string;
}

interface HealthTokenManagementProps {
  connections: HealthConnection[];
  onRefresh: () => void;
}

export const HealthTokenManagement = ({ connections, onRefresh }: HealthTokenManagementProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const revokeTokens = async (connectionId: string) => {
    setLoading(connectionId);
    try {
      const { data, error } = await supabase.rpc('revoke_health_tokens', {
        p_connection_id: connectionId
      });

      if (error) throw error;

      toast.success("Os tokens de acesso foram revogados com segurança.");
      
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Falha ao revogar tokens");
    } finally {
      setLoading(null);
    }
  };

  const getSecurityStatus = (connection: HealthConnection) => {
    const hasVaultTokens = connection.access_token_vault_id || connection.refresh_token_vault_id;
    const hasPlaintextTokens = connection.access_token || connection.refresh_token;
    
    if (hasVaultTokens && !hasPlaintextTokens) {
      return { status: 'secure', label: 'Seguro', variant: 'default' as const, icon: Shield };
    } else if (hasPlaintextTokens) {
      return { status: 'vulnerable', label: 'Vulnerável', variant: 'destructive' as const, icon: AlertTriangle };
    } else {
      return { status: 'no-tokens', label: 'Sem Tokens', variant: 'secondary' as const, icon: Key };
    }
  };

  const secureConnections = connections.filter(c => getSecurityStatus(c).status === 'secure');
  const vulnerableConnections = connections.filter(c => getSecurityStatus(c).status === 'vulnerable');

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{secureConnections.length}</p>
                <p className="text-sm text-muted-foreground">Conexões Seguras</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{vulnerableConnections.length}</p>
                <p className="text-sm text-muted-foreground">Vulnerabilidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{connections.length}</p>
                <p className="text-sm text-muted-foreground">Total de Conexões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vulnerability Alert */}
      {vulnerableConnections.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Alerta de Segurança:</strong> {vulnerableConnections.length} conexão(ões) têm tokens não criptografados. 
            Recomendamos revogar e recriar essas conexões imediatamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Health Connections Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciamento de Tokens de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connections.map((connection) => {
              const security = getSecurityStatus(connection);
              const SecurityIcon = security.icon;
              
              return (
                <div key={connection.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={security.variant} className="flex items-center gap-1">
                        <SecurityIcon className="h-3 w-3" />
                        {security.label}
                      </Badge>
                      <span className="font-medium">{connection.provider}</span>
                      <Badge variant="outline">{connection.status}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeTokens(connection.id)}
                        disabled={loading === connection.id}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revogar Tokens
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Acessos: {connection.token_access_count || 0}
                      </span>
                      {connection.token_last_rotated_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Última rotação: {new Date(connection.token_last_rotated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <strong>Token de Acesso:</strong> {' '}
                        {connection.access_token_vault_id ? (
                          <span className="text-green-600">Criptografado no Vault</span>
                        ) : connection.access_token ? (
                          <span className="text-red-600">⚠️ Texto plano</span>
                        ) : (
                          <span className="text-gray-500">Não configurado</span>
                        )}
                      </div>
                      
                      <div>
                        <strong>Refresh Token:</strong> {' '}
                        {connection.refresh_token_vault_id ? (
                          <span className="text-green-600">Criptografado no Vault</span>
                        ) : connection.refresh_token ? (
                          <span className="text-red-600">⚠️ Texto plano</span>
                        ) : (
                          <span className="text-gray-500">Não configurado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {connections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conexão de saúde encontrada.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Melhores Práticas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Tokens são automaticamente criptografados usando o Supabase Vault</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Logs de auditoria registram todos os acessos aos tokens</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Tokens antigos em texto plano são automaticamente migrados</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Controle de acesso rigoroso via Row Level Security (RLS)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};