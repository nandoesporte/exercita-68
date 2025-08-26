import React, { useState } from 'react';
import { BarChart3, Users, Dumbbell, CalendarCheck, ArrowUp, ArrowDown, Loader2, UserPlus, Gift, ImageIcon, CalendarIcon, Home, Crown, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/auth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';
import { useUsersByAdmin } from '@/hooks/useUsersByAdmin';
import { SubscriptionStatusCard } from '@/components/admin/SubscriptionStatusCard';

// Define form schema for user creation exatamente como na página de login
const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { signUp } = useAuth(); // Importando a função signUp do hook useAuth
  const { isSuperAdmin } = useAdminRole();
  const { adminId, isAdmin } = useAdminPermissionsContext();
  const { adminUsers, userProfiles, getUsersByAdmin, isLoading: usersLoading } = useUsersByAdmin();

  // Fetch statistics including real appointment data
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats', adminId],
    queryFn: async () => {
      if (isSuperAdmin) {
        // Super admin sees all data
        const { data: usersData, error: usersError } = await supabase.rpc('get_all_users');
        if (usersError) console.error("Error fetching users:", usersError);
        
        const { count: workoutsCount, error: workoutsError } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true });
        if (workoutsError) console.error("Error fetching workouts:", workoutsError);
        
        const { count: appointmentsCount, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });
        if (appointmentsError) console.error("Error fetching appointments:", appointmentsError);
        
        return {
          users: (usersData as any[])?.length || 0,
          workouts: workoutsCount || 0,
          appointments: appointmentsCount || 0
        };
      } else if (isAdmin && adminId) {
        // Regular admin sees only their data
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('admin_id', adminId);
        if (usersError) console.error("Error fetching users:", usersError);
        
        const { count: workoutsCount, error: workoutsError } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('admin_id', adminId);
        if (workoutsError) console.error("Error fetching workouts:", workoutsError);
        
        const { count: appointmentsCount, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('admin_id', adminId);
        if (appointmentsError) console.error("Error fetching appointments:", appointmentsError);
        
        return {
          users: usersCount || 0,
          workouts: workoutsCount || 0,
          appointments: appointmentsCount || 0
        };
      }
      
      return { users: 0, workouts: 0, appointments: 0 };
    },
    enabled: !!adminId,
  });

  // Fetch appointments for display
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['admin-dashboard-appointments', adminId],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .limit(3);

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        query = query.eq('admin_id', adminId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!adminId,
  });

  // Process user data for display based on admin permissions
  const recentUsers = React.useMemo(() => {
    if (!userProfiles) return [];
    
    // Get users for this admin (or all users if super admin)
    const relevantUsers = isSuperAdmin ? userProfiles : getUsersByAdmin(adminId);
    
    return relevantUsers.slice(0, 5).map(profile => ({
      id: profile.id,
      email: profile.email || '',
      user: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Novo Usuário',
      time: profile.created_at,
      isActive: true, // Default to active since we don't have banned_until in profiles
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${profile.first_name || profile.email || 'User'}`,
    }));
  }, [userProfiles, adminId, isSuperAdmin, getUsersByAdmin]);

  // Toggle user active status
  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string, isActive: boolean }) => {
      const { error } = await supabase.rpc('toggle_user_active_status', {
        user_id: userId,
      });
      
      if (error) throw new Error(error.message);
      return { userId, isActive };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      toast.success(
        data.isActive 
          ? 'Usuário ativado com sucesso!' 
          : 'Usuário desativado com sucesso!'
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status do usuário: ${error.message}`);
    },
  });

  // Create user mutation - Using admin_create_user RPC function instead of auth.admin API
  const createUserMutation = useMutation({
    mutationFn: async (userData: FormValues) => {
      console.log("Creating user from dashboard with:", userData.email);
      // Using the admin_create_user RPC function which runs with elevated privileges
      const { data, error } = await supabase.rpc('admin_create_user', {
        user_data: {
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
        }
      });
      
      if (error) {
        console.error("Error creating user:", error);
        throw new Error(error.message);
      }
      
      console.log("User created successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      setIsCreateUserOpen(false);
      toast.success('Usuário criado com sucesso!');
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
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

  const handleToggleUserActive = (userId: string, currentStatus: boolean) => {
    toggleUserActiveMutation.mutate({
      userId,
      isActive: !currentStatus,
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

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Get current admin ID to associate user with admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      // Get current admin ID from profiles
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('admin_id')
        .eq('id', currentUser.user.id)
        .single();

      let adminId = null;
      if (!isSuperAdmin && currentProfile?.admin_id) {
        // Regular admin assigns to their own admin_id
        adminId = currentProfile.admin_id;
      }

      // Include admin_id in metadata
      const metadata = {
        first_name: values.firstName,
        last_name: values.lastName,
        created_by_admin_id: adminId
      };
      
      await signUp(values.email, values.password, metadata);
      toast.success('Conta criada com sucesso!');
      
      // Atualiza a lista de usuários
      queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
      
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

  // Create stats array based on real data
  const stats = [
    { 
      title: 'Usuários', 
      value: statsLoading ? '...' : statsData?.users.toString(), 
      change: '+12%',  
      trend: 'up', 
      icon: Users,
      isLoading: statsLoading
    },
    { 
      title: 'Treinos', 
      value: statsLoading ? '...' : statsData?.workouts.toString(), 
      change: '+5%', 
      trend: 'up', 
      icon: Dumbbell,
      isLoading: statsLoading
    },
    { 
      title: 'Consultas', 
      value: statsLoading ? '...' : statsData?.appointments.toString(), 
      change: '+18%', 
      trend: 'up', 
      icon: CalendarCheck,
      isLoading: statsLoading
    }
  ];

  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex items-center justify-between mb-2">
        <div></div>
        <div className="flex items-center space-x-2">
          {isSuperAdmin && (
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"} 
              asChild
            >
              <Link to="/admin/super-dashboard">
                <Crown className="h-4 w-4 mr-2" />
                {!isMobile && "Super Admin"}
              </Link>
            </Button>
          )}
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"} 
            asChild
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              {!isMobile && "Início"}
            </Link>
          </Button>
          <Button 
            onClick={() => setIsCreateUserOpen(true)} 
            size={isMobile ? "sm" : "default"}
            className={isMobile ? "ml-0" : ""}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
      </div>
      
      {/* Stats Cards - Responsive Grid (without revenue) */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const getNavigationPath = (title: string) => {
            switch (title) {
              case 'Usuários': return '/admin/users';
              case 'Treinos': return '/admin/workouts';
              case 'Consultas': return '/admin/appointments';
              default: return '#';
            }
          };

          const StatCard = () => (
            <div className="bg-card rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-secondary">
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <h3 className="text-lg font-bold mt-0.5">
                  {stat.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    stat.value
                  )}
                </h3>
              </div>
              <div className="flex items-center mt-1">
                {stat.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );

          return (
            <Link key={stat.title} to={getNavigationPath(stat.title)}>
              <StatCard />
            </Link>
          );
        })}
      </div>
      
      {/* Subscription Status Card - Only for non-Super Admins */}
      {!isSuperAdmin && (
        <div className="mb-4">
          <SubscriptionStatusCard />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent User Activity with User Management - Improved Mobile Layout */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Usuários Recentes</h2>
          </div>
          
          {usersLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-fitness-green mr-2" />
              <span className="text-sm">Carregando usuários...</span>
            </div>
          ) : recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors space-y-2 sm:space-y-0">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                      <img
                        src={user.avatar}
                        alt={user.user || user.email}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{user.user || 'Novo Usuário'}</h3>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-11 sm:ml-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleUserActive(user.id, user.isActive)}
                        className="h-5 w-9"
                      />
                      <span className={`text-xs ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 rounded-md"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
          
          <Link to="/admin/users" className="block w-full text-center text-fitness-green hover:underline py-2 mt-2 text-sm">
            Ver Todos os Usuários
          </Link>
        </div>
        
        {/* Quick Actions and Recent Appointments - Mobile Optimized */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-base font-semibold mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2">
            <Link 
              to="/admin/workouts/create" 
              className="flex items-center justify-center gap-2 bg-fitness-green text-white p-2 rounded-lg hover:bg-fitness-darkGreen transition-colors text-center text-sm"
            >
              <Dumbbell className="h-4 w-4" />
              <span>Novo Treino</span>
            </Link>
            <Link to="/admin/appointments"
              className="flex items-center justify-center gap-2 bg-secondary text-foreground p-2 rounded-lg hover:bg-muted transition-colors text-center text-sm"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Agendamentos</span>
            </Link>
            <Link to="/admin/products/create"
              className="flex items-center justify-center gap-2 bg-secondary text-foreground p-2 rounded-lg hover:bg-muted transition-colors text-center text-sm"
            >
              <Gift className="h-4 w-4" />
              <span>Novo Produto</span>
            </Link>
            <Link to="/admin/photos"
              className="flex items-center justify-center gap-2 bg-secondary text-foreground p-2 rounded-lg hover:bg-muted transition-colors text-center text-sm"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Fotos</span>
            </Link>
          </div>
          
          {/* Recent Appointments */}
          <div className="mt-4">
            <h2 className="text-base font-semibold mb-2">Consultas Recentes</h2>
            <div className="space-y-2">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-fitness-green mr-2" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : appointmentsData && appointmentsData.length > 0 ? (
                appointmentsData.map((appointment: any) => (
                  <div key={appointment.id} className="p-2 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">{appointment.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(appointment.appointment_date), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-2">
                  Nenhuma consulta encontrada
                </div>
              )}
              
              <Link to="/admin/appointments" className="block w-full text-center text-fitness-green hover:underline py-2 mt-2 text-sm">
                Gerenciar Consultas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog para cadastro de novo aluno */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
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
                      <Input 
                        placeholder="email@exemplo.com" 
                        type="email"
                        autoComplete="email"
                        {...field} 
                      />
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
                      <Input 
                        type="password"
                        placeholder="******" 
                        autoComplete="new-password"
                        {...field}
                      />
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
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
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
  );
};

export default Dashboard;
