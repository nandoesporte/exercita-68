import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Crown, Shield, User, ShieldCheck, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

// Tipo para usuários do sistema
type UserWithProfile = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at?: string;
  banned_until?: string;
};

export default function AdminManagement() {
  const queryClient = useQueryClient();
  const { plans } = useSubscriptionPlans();

  // Buscar todos os usuários do sistema
  const { data: usersData, isLoading: isLoadingUsers, error } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) throw new Error(error.message);
      
      // A função agora retorna os dados completos incluindo is_admin
      return (data as any[])?.map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        banned_until: user.banned_until
      })) || [];
    },
  });

  // Toggle status de admin do usuário
  const toggleUserAdminMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string, makeAdmin: boolean }) => {
      const { data, error } = await supabase.rpc('toggle_user_admin_status', {
        target_user_id: userId,
        make_admin: makeAdmin,
      });

      if (error) throw new Error(error.message);
      
      if (!(data as any)?.success) {
        throw new Error((data as any)?.message);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidar múltiplas queries para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-role'] });
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      toast.success((data as any)?.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleToggleAdmin = (userId: string, currentIsAdmin: boolean) => {
    toggleUserAdminMutation.mutate({
      userId,
      makeAdmin: !currentIsAdmin,
    });
  };

  // Ativar assinatura para administrador
  const activateSubscriptionMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Primeiro, buscar o admin_id do usuário
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminError) throw new Error('Erro ao encontrar dados do administrador');
      if (!adminData) throw new Error('Usuário não é um administrador');

      // Buscar o primeiro plano ativo
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (planError) throw new Error('Erro ao buscar planos de assinatura');
      if (!planData) throw new Error('Nenhum plano de assinatura ativo encontrado');

      // Verificar se já existe uma assinatura
      const { data: existingSubscription, error: checkError } = await supabase
        .from('admin_subscriptions')
        .select('id, status')
        .eq('admin_id', adminData.id)
        .maybeSingle();

      if (checkError) {
        throw new Error('Erro ao verificar assinatura existente');
      }

      if (existingSubscription) {
        // Ativar assinatura existente
        const { error: updateError } = await supabase
          .from('admin_subscriptions')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);

        if (updateError) throw new Error('Erro ao atualizar assinatura existente');
      } else {
        // Criar nova assinatura
        const { error: insertError } = await supabase
          .from('admin_subscriptions')
          .insert({
            admin_id: adminData.id,
            plan_id: planData.id,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          });

        if (insertError) throw new Error(`Erro ao criar nova assinatura: ${insertError.message}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Assinatura ativada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao ativar assinatura: ${error.message}`);
    },
  });

  const handleActivateSubscription = (userId: string) => {
    activateSubscriptionMutation.mutate(userId);
  };

  // Colunas da tabela
  const columns = [
    {
      accessorKey: 'name',
      header: 'Usuário',
      cell: ({ row }: { row: { original: UserWithProfile } }) => {
        const user = row.original;
        const displayName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.email;
          
        return (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {user.is_admin ? (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Membro desde',
      hideOnMobile: true,
      cell: ({ row }: { row: { original: UserWithProfile } }) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      )
    },
    {
      accessorKey: 'admin_status',
      header: 'Privilégio',
      cell: ({ row }: { row: { original: UserWithProfile } }) => {
        const user = row.original;
        const isDisabled = Boolean(user.banned_until);
        
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={user.is_admin}
              onCheckedChange={() => handleToggleAdmin(user.id, user.is_admin)}
              disabled={toggleUserAdminMutation.isPending || isDisabled}
            />
            <Badge 
              variant={user.is_admin ? "default" : "outline"}
              className="flex items-center gap-1"
            >
              {user.is_admin ? (
                <>
                  <Shield className="w-3 h-3" />
                  Admin
                </>
              ) : (
                <>
                  <User className="w-3 h-3" />
                  Usuário
                </>
              )}
            </Badge>
          </div>
        );
      }
    },
    {
      accessorKey: 'subscription_actions',
      header: 'Assinatura',
      cell: ({ row }: { row: { original: UserWithProfile } }) => {
        const user = row.original;
        const isDisabled = Boolean(user.banned_until);
        
        // Só mostrar o botão para administradores
        if (!user.is_admin) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-primary text-primary hover:bg-primary hover:text-white rounded-md"
            onClick={() => handleActivateSubscription(user.id)}
            disabled={activateSubscriptionMutation.isPending || isDisabled}
          >
            <CreditCard className="w-3 h-3 mr-1" />
            Ativar Assinatura
          </Button>
        );
      }
    },
  ];

  if (error) {
    return (
      <div className="p-6 border border-destructive/30 rounded-lg bg-destructive/5 text-center">
        <p className="text-destructive mb-4">Erro ao carregar usuários: {(error as Error).message}</p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['all-users'] })}
          variant="outline"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle privilégios administrativos do sistema
          </p>
        </div>
        
        {/* Status Summary */}
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <div>
              <div className="font-bold">{usersData?.filter(u => u.is_admin).length || 0}</div>
              <div className="text-xs text-muted-foreground">Admins</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-bold">{usersData?.filter(u => !u.is_admin).length || 0}</div>
              <div className="text-xs text-muted-foreground">Usuários</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Controle de Acesso Administrativo</CardTitle>
              <CardDescription>
                Gerencie privilégios com segurança e facilidade
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-semibold">Usuário Comum</div>
                <div className="text-muted-foreground text-xs">Acesso limitado às funcionalidades básicas</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold text-primary">Administrador</div>
                <div className="text-muted-foreground text-xs">Acesso completo ao sistema de gestão</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos os Usuários ({usersData?.length || 0})
          </CardTitle>
          <CardDescription>
            Use os toggles para promover usuários a administradores ou remover privilégios administrativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={usersData || []}
            isLoading={isLoadingUsers}
          />
        </CardContent>
      </Card>
    </div>
  );
}