import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Shield, 
  Dumbbell, 
  CalendarCheck, 
  TrendingUp, 
  Activity,
  Crown,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SuperAdminDashboard = () => {
  const isMobile = useIsMobile();

  // Buscar estatísticas gerais
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      // Admins ativos
      const { count: adminsCount } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total de usuários
      const { data: usersData } = await supabase.rpc('debug_get_all_users');
      
      // Total de treinos
      const { count: workoutsCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true });

      // Total de agendamentos
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      return {
        admins: adminsCount || 0,
        users: (usersData as any[])?.length || 0,
        workouts: workoutsCount || 0,
        appointments: appointmentsCount || 0,
      };
    },
  });

  // Buscar usuários por admin
  const { data: usersByAdmin, isLoading: usersByAdminLoading } = useQuery({
    queryKey: ['users-by-admin'],
    queryFn: async () => {
      // Buscar admins ativos
      const { data: admins } = await supabase
        .from('admins')
        .select('id, name, email')
        .eq('is_active', true);

      if (!admins) return [];

      // Para cada admin, buscar quantos usuários tem
      const results = await Promise.all(
        admins.map(async (admin) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('admin_id', admin.id);

          return {
            ...admin,
            usersCount: count || 0,
          };
        })
      );

      return results;
    },
  });

  // Buscar atividade recente
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Últimos treinos criados
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('title, created_at, admin_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Últimos agendamentos
      const { data: recentAppointments } = await supabase
        .from('appointments')
        .select('title, appointment_date, admin_id')
        .order('appointment_date', { ascending: false })
        .limit(5);

      return {
        workouts: recentWorkouts || [],
        appointments: recentAppointments || [],
      };
    },
  });

  const stats = [
    {
      title: 'Admins Ativos',
      value: statsLoading ? '...' : statsData?.admins.toString(),
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+2 este mês'
    },
    {
      title: 'Total de Usuários',
      value: statsLoading ? '...' : statsData?.users.toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+15% este mês'
    },
    {
      title: 'Total de Treinos',
      value: statsLoading ? '...' : statsData?.workouts.toString(),
      icon: Dumbbell,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+8 esta semana'
    },
    {
      title: 'Agendamentos',
      value: statsLoading ? '...' : statsData?.appointments.toString(),
      icon: CalendarCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '+5 hoje'
    },
  ];

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            <h1 className="text-2xl font-bold">Dashboard Super Admin</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Visão geral de todo o sistema e administradores
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size={isMobile ? "sm" : "default"}>
            <Link to="/admin/admins">
              <Shield className="h-4 w-4 mr-2" />
              Gerenciar Admins
            </Link>
          </Button>
          <Button asChild variant="outline" size={isMobile ? "sm" : "default"}>
            <Link to="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Ver Usuários
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-green-600 font-medium">{stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usuários por Admin */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usuários por Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersByAdminLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {usersByAdmin?.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{admin.usersCount} usuários</Badge>
                    </div>
                  </div>
                ))}
                
                {(!usersByAdmin || usersByAdmin.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum admin encontrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Treinos Recentes</h4>
                  <div className="space-y-2">
                    {recentActivity?.workouts.slice(0, 3).map((workout, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium">{workout.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(workout.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Agendamentos</h4>
                  <div className="space-y-2">
                    {recentActivity?.appointments.slice(0, 3).map((appointment, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium">{appointment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/admin/admins">
                <Shield className="h-6 w-6 mb-2" />
                Gerenciar Admins
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/admin/users">
                <Users className="h-6 w-6 mb-2" />
                Ver Usuários
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/admin/rls-checker">
                <Shield className="h-6 w-6 mb-2" />
                RLS Checker
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/admin">
                <BarChart3 className="h-6 w-6 mb-2" />
                Dashboard Geral
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;