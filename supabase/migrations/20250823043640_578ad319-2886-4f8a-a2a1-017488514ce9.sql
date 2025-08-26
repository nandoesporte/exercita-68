-- Criar enum para tipos de papel
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'user');

-- Criar enum para permissões específicas
CREATE TYPE public.admin_permission AS ENUM (
    'manage_workouts',
    'manage_exercises', 
    'manage_categories',
    'manage_products',
    'manage_store',
    'manage_appointments',
    'manage_schedule',
    'manage_payment_methods',
    'manage_gym_photos',
    'manage_users',
    'view_analytics'
);

-- Tabela de administradores
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id), -- Super admin que criou
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(user_id)
);

-- Tabela de permissões dos admins
CREATE TABLE public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    permission admin_permission NOT NULL,
    granted_by UUID REFERENCES auth.users(id), -- Super admin que concedeu
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(admin_id, permission)
);

-- Tabela de roles dos usuários (incluindo super admin)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    admin_id UUID REFERENCES public.admins(id), -- Admin responsável (apenas para usuários comuns)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, role)
);

-- Função para verificar se usuário tem um papel específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Função para verificar se usuário é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Função para obter o admin_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_admin_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT admin_id 
  FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
  LIMIT 1;
$$;

-- Função para verificar se admin tem permissão específica
CREATE OR REPLACE FUNCTION public.admin_has_permission(_admin_id UUID, _permission admin_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_permissions
    WHERE admin_id = _admin_id AND permission = _permission
  );
$$;

-- Função para verificar se usuário atual tem permissão
CREATE OR REPLACE FUNCTION public.current_user_has_permission(_permission admin_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN public.is_super_admin() THEN true
    WHEN public.is_admin() THEN public.admin_has_permission(public.get_current_admin_id(), _permission)
    ELSE false
  END;
$$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Super admins can manage all admins" ON public.admins
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admins can view their own data" ON public.admins
    FOR SELECT USING (user_id = auth.uid());

-- Políticas RLS para permissões de admin
CREATE POLICY "Super admins can manage all permissions" ON public.admin_permissions
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admins can view their own permissions" ON public.admin_permissions
    FOR SELECT USING (admin_id = public.get_current_admin_id());

-- Políticas RLS para roles de usuário
CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admins can manage their users' roles" ON public.user_roles
    FOR ALL USING (admin_id = public.get_current_admin_id());

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Trigger para atualizar updated_at nos admins
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();