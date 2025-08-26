import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

interface AdminWithPermissions {
  id: string;
  name: string;
  email: string;
  permissions: UserPermission[];
}

export function useAdminPermissions() {
  const queryClient = useQueryClient();

  // Fetch all admins with their permissions
  const { data: adminsWithPermissions, isLoading } = useQuery({
    queryKey: ['admins-with-permissions'],
    queryFn: async () => {
      const { data: admins, error: adminsError } = await supabase
        .from('admins')
        .select('id, name, email, user_id')
        .eq('status', 'active');

      if (adminsError) throw adminsError;

      const { data: permissions, error: permissionsError } = await supabase
        .from('admin_permissions')
        .select('admin_id, permission');

      if (permissionsError) throw permissionsError;

      return admins.map(admin => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        permissions: permissions
          .filter(p => p.admin_id === admin.id)
          .map(p => p.permission)
      })) as AdminWithPermissions[];
    },
  });

  // Grant permission to admin
  const grantPermissionMutation = useMutation({
    mutationFn: async ({ adminId, permission }: { adminId: string; permission: UserPermission }) => {
      const { error } = await supabase
        .from('admin_permissions')
        .insert({
          admin_id: adminId,
          permission: permission,
          granted_by: (await supabase.auth.getUser()).data.user?.id || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins-with-permissions'] });
      toast.success('Permissão concedida com sucesso ao administrador.');
    },
    onError: (error) => {
      console.error('Erro ao conceder permissão:', error);
      toast.error('Erro ao conceder permissão.');
    }
  });

  // Revoke permission from admin
  const revokePermissionMutation = useMutation({
    mutationFn: async ({ adminId, permission }: { adminId: string; permission: UserPermission }) => {
      const { error } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('admin_id', adminId)
        .eq('permission', permission);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins-with-permissions'] });
      toast.success('Permissão revogada com sucesso do administrador.');
    },
    onError: (error) => {
      console.error('Erro ao revogar permissão:', error);
      toast.error('Erro ao revogar permissão.');
    }
  });

  const togglePermission = (adminId: string, permission: UserPermission, hasPermission: boolean) => {
    if (hasPermission) {
      revokePermissionMutation.mutate({ adminId, permission });
    } else {
      grantPermissionMutation.mutate({ adminId, permission });
    }
  };

  return {
    adminsWithPermissions,
    isLoading,
    togglePermission,
    isUpdating: grantPermissionMutation.isPending || revokePermissionMutation.isPending
  };
}

// Available permissions with descriptions
export const AVAILABLE_PERMISSIONS: Record<UserPermission, { label: string; description: string; category: string }> = {
  manage_workouts: {
    label: 'Gerenciar Treinos',
    description: 'Criar, editar e excluir treinos',
    category: 'Treinos'
  },
  manage_exercises: {
    label: 'Gerenciar Exercícios',
    description: 'Criar, editar e excluir exercícios',
    category: 'Treinos'
  },
  manage_categories: {
    label: 'Gerenciar Categorias',
    description: 'Criar, editar e excluir categorias de treinos',
    category: 'Treinos'
  },
  manage_products: {
    label: 'Gerenciar Produtos',
    description: 'Criar, editar e excluir produtos',
    category: 'Loja'
  },
  manage_payments: {
    label: 'Gerenciar Pagamentos',
    description: 'Configurar métodos de pagamento e processar transações',
    category: 'Pagamentos'
  },
  manage_store: {
    label: 'Gerenciar Loja',
    description: 'Configurações gerais da loja',
    category: 'Loja'
  },
  manage_appointments: {
    label: 'Gerenciar Agendamentos',
    description: 'Visualizar e gerenciar agendamentos',
    category: 'Agendamentos'
  },
  manage_schedule: {
    label: 'Gerenciar Horários',
    description: 'Configurar horários disponíveis',
    category: 'Agendamentos'
  },
  manage_payment_methods: {
    label: 'Métodos de Pagamento',
    description: 'Configurar PIX e outros métodos',
    category: 'Pagamentos'
  },
  manage_gym_photos: {
    label: 'Fotos da Academia',
    description: 'Gerenciar fotos enviadas pelos usuários',
    category: 'Academia'
  },
  manage_users: {
    label: 'Gerenciar Usuários',
    description: 'Visualizar e gerenciar usuários',
    category: 'Usuários'
  },
  view_analytics: {
    label: 'Ver Analytics',
    description: 'Acessar relatórios e estatísticas',
    category: 'Relatórios'
  }
};