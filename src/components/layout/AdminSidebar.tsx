
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAdminPermissionsContext } from "@/hooks/useAdminPermissionsContext";
import {
  LineChart,
  Dumbbell,
  ListVideo,
  ShoppingBag,
  Calendar,
  CalendarRange,
  CreditCard,
  Users,
  ShieldCheck,
  Camera,
  List,
  Crown,
  Shield,
  Lock,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminSidebarProps {
  onNavItemClick?: () => void;
}

const AdminSidebar = ({ onNavItemClick }: AdminSidebarProps = {}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isSuperAdmin, isAdmin } = useAdminRole();
  const { hasPermission, isLoading: permissionsLoading } = useAdminPermissionsContext();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onNavItemClick) {
      onNavItemClick();
    }
  };

  const items = [
    {
      title: isSuperAdmin ? 'Dashboard Geral' : 'Dashboard',
      icon: <LineChart className="h-4 w-4" />,
      to: '/admin'
    },
    // Only show super admin dashboard for Super Admins
    ...(isSuperAdmin ? [{
      title: 'Super Admin',
      icon: <Crown className="h-4 w-4" />,
      to: '/admin/super-dashboard'
    }] : []),
    // Only show admin management for Super Admins
    ...(isSuperAdmin ? [{
      title: 'Gerenciar Admins',
      icon: <Shield className="h-4 w-4" />,
      to: '/admin/admins'
    }] : []),
    // Only show if user has workouts permission
    ...(hasPermission('manage_workouts') ? [{
      title: 'Gerenciamento de Treinos',
      icon: <Dumbbell className="h-4 w-4" />,
      to: '/admin/workouts'
    }] : []),
    // Only show if user has exercises permission
    ...(hasPermission('manage_exercises') ? [{
      title: 'Biblioteca de Exercícios',
      icon: <ListVideo className="h-4 w-4" />,
      to: '/admin/exercises'
    }] : []),
    // Only show if user has categories permission
    ...(hasPermission('manage_categories') ? [{
      title: 'Categorias de Exercícios',
      icon: <Dumbbell className="h-4 w-4" />,
      to: '/admin/exercises/categories'
    }] : []),
    // Only show if user has store permission
    ...(hasPermission('manage_store') || hasPermission('manage_products') ? [{
      title: 'Produtos',
      icon: <ShoppingBag className="h-4 w-4" />,
      to: '/admin/products'
    }] : []),
    // Only show if user has categories permission
    ...(hasPermission('manage_categories') ? [{
      title: 'Categorias',
      icon: <List className="h-4 w-4" />,
      to: '/admin/categories'
    }] : []),
    // Only show if user has gym photos permission
    ...(hasPermission('manage_gym_photos') ? [{
      title: 'Fotos da Academia',
      icon: <Camera className="h-4 w-4" />,
      to: '/admin/photos'
    }] : []),
    // Only show if user has schedule permission
    ...(hasPermission('manage_schedule') ? [{
      title: 'Personal',
      icon: <Calendar className="h-4 w-4" />,
      to: '/admin/schedule'
    }] : []),
    // Only show if user has appointments permission
    ...(hasPermission('manage_appointments') ? [{
      title: 'Agendamentos',
      icon: <CalendarRange className="h-4 w-4" />,
      to: '/admin/appointments'
    }] : []),
    // Only show if user has payment methods permission
    ...(hasPermission('manage_payment_methods') ? [{
      title: 'Métodos de Pagamento',
      icon: <CreditCard className="h-4 w-4" />,
      to: '/admin/payment-methods'
    }] : []),
    // Only show user management for Super Admins
    ...(isSuperAdmin ? [{
      title: 'Gerenciamento de Usuários',
      icon: <Users className="h-4 w-4" />,
      to: '/admin/users'
    }] : []),
    // Only show RLS Checker for Super Admins
    ...(isSuperAdmin ? [{
      title: 'RLS Checker',
      icon: <ShieldCheck className="h-4 w-4" />,
      to: '/admin/rls-checker'
    }] : []),
    // Show subscription management for all admins
    {
      title: 'Assinaturas',
      icon: <Wallet className="h-4 w-4" />,
      to: '/admin/subscriptions'
    },
    // Show admin permissions for all admins
    {
      title: 'Permissões e Isolamento',
      icon: <Lock className="h-4 w-4" />,
      to: '/admin/permissions'
    }
  ];

  return (
    <div
      className={`flex flex-col h-full bg-gray-50 border-r border-r-gray-200 dark:bg-gray-900 dark:border-r-gray-700 ${
        isExpanded ? "w-64" : "w-20"
      } transition-width duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          {isSuperAdmin && <Crown className="h-6 w-6 text-yellow-500" />}
          <span
            className={`text-xl font-bold transition-opacity duration-300 ${
              isExpanded ? "opacity-100" : "opacity-0"
            }`}
          >
            Painel Admin
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-1 py-2">
          {permissionsLoading ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
              <span className="text-xs text-muted-foreground">Carregando permissões...</span>
            </div>
          ) : (
            items.map((item) => {
              const hasAccess = item.to === '/admin' || item.to === '/admin/permissions' || 
                              item.to === '/admin/subscriptions' ||
                              item.to === '/admin/super-dashboard' || item.to === '/admin/admins' || 
                              item.to === '/admin/users' || item.to === '/admin/rls-checker' || 
                              isSuperAdmin;
              
              console.log('Menu item permission check:', { 
                title: item.title, 
                to: item.to, 
                hasAccess, 
                isSuperAdmin,
                permissionsLoading 
              });

              return (
                <Button
                  key={item.title}
                  variant="ghost"
                  className={`flex items-center w-full justify-start py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    isExpanded ? "h-auto min-h-[44px]" : "justify-center h-12 w-12 mx-auto"
                  }`}
                  onClick={() => handleNavigation(item.to)}
                >
                  <span className={`flex items-center w-full ${isExpanded ? "gap-3" : "justify-center"}`}>
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                    {isExpanded && (
                      <span className="flex-1 text-left leading-tight transition-opacity duration-300 opacity-100 overflow-hidden">
                        {item.title}
                      </span>
                    )}
                  </span>
                </Button>
              );
            })
          )}
        </nav>
      </ScrollArea>
      <div className="p-3 sm:p-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 w-full justify-start py-4 px-4 min-h-[60px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-base font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span
                  className={`font-semibold transition-opacity duration-300 truncate text-base ${
                    isExpanded ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {user?.email}
                </span>
                {isSuperAdmin && (
                  <Badge variant="secondary" className={`text-sm ${isExpanded ? "opacity-100" : "opacity-0"}`}>
                    Super Admin
                  </Badge>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/account")}>
              Informações da Conta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AdminSidebar;
