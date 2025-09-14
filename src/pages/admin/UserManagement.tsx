
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, UserPlus, UserCheck, UserX, Crown, Mail, Lock, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from "@/components/ui/skeleton";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { useProfilesRealtime } from '@/hooks/useRealtime';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/auth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useUsersByAdmin } from '@/hooks/useUsersByAdmin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define o schema para validação do formulário exatamente como na página de login
const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
});

const editUserSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
});

type FormValues = z.infer<typeof formSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

const UserManagement = () => {
  // Habilitar atualizações em tempo real para profiles
  useProfilesRealtime();
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { isSuperAdmin } = useAdminRole();
  
  // Fetch admins for filtering (only for super admin)
  const { data: adminsData } = useQuery({
    queryKey: ['admins-list'],
    queryFn: async () => {
      if (!isSuperAdmin) return [];
      
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, email')
        .eq('is_active', true);
      
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  const [selectedAdminFilter, setSelectedAdminFilter] = useState<string>('all');

  // Use the useUsersByAdmin hook for profiles and fetch auth data separately
  const { userProfiles, getUsersByAdmin, isLoading: isLoadingUsers } = useUsersByAdmin();

  // Fetch actual user status from auth.users table
  const { data: usersAuthData, isLoading: isLoadingAuthData } = useQuery({
    queryKey: ['users-auth-status', userProfiles?.map(u => u.id)],
    queryFn: async () => {
      if (!userProfiles?.length) return [];
      
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      
      return (data as any[]) || [];
    },
    enabled: !!userProfiles?.length,
  });
  
  // Get users for the selected admin (or current admin's users) with real auth status
  const usersData = React.useMemo(() => {
    if (!userProfiles || !usersAuthData) return [];
    
    const profilesData = isSuperAdmin && selectedAdminFilter && selectedAdminFilter !== 'all' 
      ? getUsersByAdmin(selectedAdminFilter)
      : userProfiles;
    
    return profilesData.map(profile => {
      const authData = (usersAuthData as any[]).find((u: any) => u.id === profile.id);
      return {
        user_id: profile.id,
        email: profile.email,
        raw_user_meta_data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
        },
        created_at: profile.created_at,
        banned_until: authData?.banned_until || null,
      };
    });
  }, [userProfiles, usersAuthData, getUsersByAdmin, selectedAdminFilter, isSuperAdmin]);

  const error = null; // Remove error handling since useUsersByAdmin handles it

  // Toggle user active status
  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, newActiveStatus }: { userId: string, newActiveStatus: boolean }) => {
      const { data, error } = await supabase.rpc('toggle_user_active_status', {
        target_user_id: userId,
      });
      
      if (error) throw new Error(error.message);
      return { userId, newActiveStatus: data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      queryClient.invalidateQueries({ queryKey: ['users-auth-status'] });
      toast.success(
        data.newActiveStatus 
          ? 'Usuário ativado com sucesso!' 
          : 'Usuário desativado com sucesso!'
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status do usuário: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('admin_delete_user', {
        user_id: userId,
      });
      
      if (error) throw new Error(error.message);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string, data: EditUserFormValues }) => {
      const updateData: any = {};
      
      // Só incluir campos que foram preenchidos
      if (data.firstName) updateData.p_first_name = data.firstName;
      if (data.lastName) updateData.p_last_name = data.lastName;
      if (data.email) updateData.p_email = data.email;

      const { data: result, error } = await supabase.rpc('admin_update_user', {
        target_user_id: userId,
        ...updateData,
      });

      if (error) throw new Error(error.message);
      
      const resultObj = result as any;
      if (!resultObj?.success) {
        throw new Error(resultObj?.message || 'Erro ao atualizar usuário');
      }

      return resultObj;
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      queryClient.invalidateQueries({ queryKey: ['users-auth-status'] });
      setIsEditUserOpen(false);
      setUserToEdit(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleToggleUserActive = (userId: string, currentStatus: boolean) => {
    toggleUserActiveMutation.mutate({
      userId,
      newActiveStatus: !currentStatus,
    });
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Get current admin ID from admins table (not profiles)
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      let adminId = null;
      if (isSuperAdmin) {
        // Super admin can assign to specific admin if filter is selected
        adminId = selectedAdminFilter !== 'all' ? selectedAdminFilter : null;
      } else {
        // Regular admin: get their admin ID from the admins table
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', currentUser.user.id)
          .single();
        
        if (adminData) {
          adminId = adminData.id;
        } else {
          throw new Error('Admin ID não encontrado');
        }
      }

      // Include admin_id in metadata
      const metadata = {
        first_name: values.firstName,
        last_name: values.lastName,
        created_by_admin_id: adminId
      };
      
      // Use admin_create_user RPC function instead of signUp to create authenticated user
      const { data, error } = await supabase.rpc('admin_create_user', {
        user_email: values.email,
        user_password: values.password,
        user_metadata: metadata
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('Usuário criado com sucesso! A conta já está ativa e pode fazer login imediatamente.');
      
      // Invalidate multiple queries to update all admin data
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      queryClient.invalidateQueries({ queryKey: ['current-admin-id'] });
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workout-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['users-auth-status'] });
      
      // Fecha o modal e reseta o formulário
      setIsCreateUserOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro durante cadastro:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const onEditSubmit = async (values: EditUserFormValues) => {
    if (!userToEdit) return;
    
    updateUserMutation.mutate({
      userId: userToEdit.user_id,
      data: values
    });
  };

  const handleEditUser = (user: any) => {
    setUserToEdit(user);
    editForm.setValue('firstName', user.raw_user_meta_data?.first_name || '');
    editForm.setValue('lastName', user.raw_user_meta_data?.last_name || '');
    editForm.setValue('email', user.email || '');
    setIsEditUserOpen(true);
  };
  
  const isMobile = useIsMobile();

  // Define columns for the user table with responsive considerations
  const columns = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: { row: { original: any } }) => {
        const email = row.original.email || '';
        return <span className="font-medium">{email}</span>;
      }
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      hideOnMobile: true,
      cell: ({ row }: { row: { original: any } }) => {
        const userData = row.original.raw_user_meta_data || {};
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        return fullName || 'N/A';
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Cadastro',
      hideOnMobile: true,
      cell: ({ row }: { row: { original: any } }) => {
        return row.original.created_at
          ? formatDistanceToNow(new Date(row.original.created_at), {
              addSuffix: true,
              locale: ptBR,
            })
          : 'N/A';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: any } }) => {
        const bannedUntil = row.original.banned_until;
        const isActive = !bannedUntil || new Date(bannedUntil) < new Date();
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={() => handleToggleUserActive(row.original.user_id, isActive)}
              disabled={toggleUserActiveMutation.isPending}
              className="data-[state=checked]:bg-success data-[state=unchecked]:bg-destructive"
            />
            <span className={`text-sm font-medium ${isActive ? 'text-success' : 'text-destructive'}`}>
              {isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: { original: any } }) => {
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => handleEditUser(row.original)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-destructive text-white bg-destructive hover:bg-destructive/90 hover:border-destructive rounded-md"
              onClick={() => {
                setSelectedUser(row.original);
                setIsDeleteDialogOpen(true);
              }}
            >
              Excluir
            </Button>
          </div>
        );
      },
    },
  ];


  if (error) {
    return (
      <div className="p-4 md:p-8 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 mb-4 text-sm md:text-base">Erro ao carregar usuários: {(error as Error).message}</p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['users-by-admin'] })}
          variant="outline"
          size={isMobile ? "sm" : "default"}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permission="manage_users">
      <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">Gerenciamento de Usuários</h1>
          {isSuperAdmin && (
            <p className="text-sm text-muted-foreground mt-1">
              Como Super Admin, você pode gerenciar todos os usuários do sistema
            </p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto md:justify-end">
          {isSuperAdmin && adminsData && adminsData.length > 0 && (
            <Select value={selectedAdminFilter} onValueChange={setSelectedAdminFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {adminsData.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button 
                size={isMobile ? "sm" : "default"}
                className={`${isMobile ? "ml-0 w-auto px-3" : "w-auto"} whitespace-nowrap`}
              >
                <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                Novo Aluno
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar novo aluno</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" type="email" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateUserOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="email@exemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <strong>Alteração de senha:</strong> Por questões de segurança, a alteração de senha deve ser feita através do processo de redefinição de senha do sistema.
                </p>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditUserOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Super Admin Info Card */}
      {isSuperAdmin && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                Privilégios de Super Admin
              </CardTitle>
            </div>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Você possui acesso total ao sistema, incluindo criação de novos admins e gerenciamento de todos os usuários.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* User Table */}
      <Card>
        <CardHeader className={isMobile ? "px-3 py-2" : ""}>
          <CardTitle className={isMobile ? "text-base" : ""}>Usuários</CardTitle>
          <CardDescription className={isMobile ? "text-xs" : ""}>
            Gerencie os usuários do sistema, ative, desative ou exclua conforme necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "px-2 py-1" : ""}>
          <DataTable
            columns={columns}
            data={usersData || []}
            isLoading={isLoadingUsers || isLoadingAuthData}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja excluir o usuário{" "}
            <span className="font-bold">{selectedUser?.email}</span>?
          </p>
          <p className="text-red-600 text-sm">
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.user_id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;
