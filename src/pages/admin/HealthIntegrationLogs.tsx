import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, RefreshCw, Filter, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HealthSyncLog {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  sync_type: string;
  records_synced: number;
  sync_started_at: string;
  sync_completed_at: string | null;
  error_message: string | null;
  device_id: string | null;
  platform: string | null;
  app_version: string | null;
  hmac_valid: boolean | null;
  data_range_start: string | null;
  data_range_end: string | null;
}

export default function HealthIntegrationLogs() {
  const [logs, setLogs] = useState<HealthSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('health_sync_logs')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }
      
      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter);
      }

      if (searchTerm) {
        query = query.or(`user_id.ilike.%${searchTerm}%,device_id.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching health logs:', error);
      toast("Não foi possível carregar os logs de sincronização");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, providerFilter, platformFilter]);

  const handleSearch = () => {
    fetchLogs();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      'success': { variant: 'default', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      'error': { variant: 'default', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      'in_progress': { variant: 'default', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      'timeout': { variant: 'default', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    };

    const config = variants[status] || { variant: 'secondary', className: '' };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status === 'success' ? 'Sucesso' :
         status === 'error' ? 'Erro' :
         status === 'in_progress' ? 'Em Progresso' :
         status === 'timeout' ? 'Timeout' : status}
      </Badge>
    );
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'health_connect': '🏥',
      'apple_health': '🍎',
      'samsung_health': '📱',
      'google_fit': '🔵',
    };
    return icons[provider] || '📊';
  };

  const exportLogs = () => {
    const csv = [
      ['Data/Hora', 'Usuário', 'Provedor', 'Status', 'Registros', 'Plataforma', 'Dispositivo', 'Erro'].join(','),
      ...logs.map(log => [
        format(new Date(log.sync_started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        log.user_id,
        log.provider,
        log.status,
        log.records_synced || 0,
        log.platform || '',
        log.device_id || '',
        log.error_message || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `health_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs de Sincronização de Saúde</h1>
          <p className="text-gray-400">Monitore a sincronização de dados de saúde dos usuários</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-fitness-darkGray border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar usuário, dispositivo ou erro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-fitness-dark border-gray-600 text-white"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-fitness-dark border-gray-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="bg-fitness-dark border-gray-600 text-white">
                <SelectValue placeholder="Provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Provedores</SelectItem>
                <SelectItem value="health_connect">Health Connect</SelectItem>
                <SelectItem value="apple_health">Apple Health</SelectItem>
                <SelectItem value="samsung_health">Samsung Health</SelectItem>
                <SelectItem value="google_fit">Google Fit</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="bg-fitness-dark border-gray-600 text-white">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Plataformas</SelectItem>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-fitness-darkGray border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Logs de Sincronização</CardTitle>
          <CardDescription className="text-gray-400">
            {logs.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-fitness-orange" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Data/Hora</TableHead>
                    <TableHead className="text-gray-300">Usuário</TableHead>
                    <TableHead className="text-gray-300">Provedor</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Registros</TableHead>
                    <TableHead className="text-gray-300">Plataforma</TableHead>
                    <TableHead className="text-gray-300">Dispositivo</TableHead>
                    <TableHead className="text-gray-300">Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-gray-700">
                      <TableCell className="text-gray-300">
                        {format(new Date(log.sync_started_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <span className="font-mono text-sm">
                          {log.user_id.slice(-8)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getProviderIcon(log.provider)}</span>
                          {log.provider}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.records_synced || 0}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.platform || '-'}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {log.device_id ? log.device_id.slice(-8) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {log.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}