
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'sonner';

// Interface for table data
interface TableData {
  table_name: string;
  has_rls: boolean;
  row_count: bigint;
}

// Component for showing tables without RLS
const RLSChecker = () => {
  const queryClient = useQueryClient();

  // Fetch tables without RLS
  const { data: tables, isLoading, error } = useQuery({
    queryKey: ['tables-rls-status'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_tables_without_rls');
        
        if (error) {
          throw error;
        }
        
        return (data as unknown) as TableData[];
      } catch (error: any) {
        console.error('Error fetching tables without RLS:', error);
        throw error;
      }
    }
  });

  // Mutation to enable RLS
  const enableRLSMutation = useMutation({
    mutationFn: async (tableName: string) => {
      try {
        const { data, error } = await supabase.rpc('admin_enable_rls', {
          p_table_name: tableName
        });
        
        if (error) {
          throw error;
        }
        
        return data;
      } catch (error: any) {
        console.error('Error enabling RLS:', error);
        throw error;
      }
    },
    onSuccess: (_, tableName) => {
      toast.success(`RLS habilitado com sucesso na tabela ${tableName}`);
      queryClient.invalidateQueries({ queryKey: ['tables-rls-status'] });
    },
    onError: (error) => {
      toast.error(`Erro ao habilitar RLS: ${error.message}`);
    }
  });

  // Handle enabling RLS
  const handleEnableRLS = (tableName: string) => {
    enableRLSMutation.mutate(tableName);
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <ShieldAlert className="h-12 w-12 text-red-500 mb-2" />
              <h2 className="text-xl font-bold text-red-700">Erro ao verificar RLS</h2>
              <p className="text-sm text-red-600">{(error as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verificador de Row Level Security (RLS)</h1>
          <p className="text-muted-foreground">
            Verifique e ative a segurança em nível de linha nas tabelas do banco de dados.
          </p>
        </div>
        <Shield className="h-8 w-8 text-fitness-green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status das Tabelas</CardTitle>
          <CardDescription>
            Verifique quais tabelas têm RLS habilitado e quais precisam ser configuradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Tabela</th>
                  <th scope="col" className="px-6 py-3">Registros</th>
                  <th scope="col" className="px-6 py-3">Status RLS</th>
                  <th scope="col" className="px-6 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {tables && tables.length > 0 ? (
                  tables.map((table) => (
                    <tr key={table.table_name} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4 font-medium">{table.table_name}</td>
                      <td className="px-6 py-4">{String(table.row_count)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {table.has_rls ? (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Ativo</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-600">Inativo</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {!table.has_rls && (
                          <Button 
                            size="sm" 
                            onClick={() => handleEnableRLS(table.table_name)}
                            disabled={enableRLSMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Shield className="h-4 w-4" />
                            Habilitar RLS
                          </Button>
                        )}
                        {table.has_rls && (
                          <span className="text-green-600 text-sm">Protegido</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      Nenhuma tabela encontrada ou todas já estão protegidas com RLS.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que é Row Level Security?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Row Level Security (RLS) é um recurso de segurança do PostgreSQL que permite controlar quais linhas podem ser acessadas por quais usuários.
            Isso é crucial para garantir que os usuários só possam visualizar ou modificar dados aos quais têm permissão explícita.
          </p>
          <p>
            Quando habilitado, o RLS restringe o acesso aos dados com base em políticas definidas, que podem ser configuradas para diferentes níveis de acesso.
          </p>
          <p className="font-semibold">
            Recomendamos habilitar o RLS em todas as tabelas que contêm dados sensíveis ou específicos do usuário.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RLSChecker;
