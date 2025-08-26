-- Criar sistema de assinaturas para admins
-- Tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  kiwify_product_id TEXT, -- ID do produto na Kiwify
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de assinaturas dos admins
CREATE TABLE public.admin_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  kiwify_order_id TEXT, -- ID do pedido na Kiwify
  kiwify_customer_id TEXT, -- ID do cliente na Kiwify
  payment_url TEXT, -- URL de checkout da Kiwify
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(admin_id) -- Um admin pode ter apenas uma assinatura ativa por vez
);

-- Tabela de logs de webhook da Kiwify
CREATE TABLE public.kiwify_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  order_id TEXT,
  customer_id TEXT,
  status TEXT,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  admin_subscription_id UUID REFERENCES public.admin_subscriptions(id)
);

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiwify_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_plans
CREATE POLICY "Super admins can manage subscription plans" ON public.subscription_plans
FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Admins can view active subscription plans" ON public.subscription_plans
FOR SELECT TO authenticated
USING (is_admin() AND is_active = true);

-- Políticas RLS para admin_subscriptions
CREATE POLICY "Super admins can manage all admin subscriptions" ON public.admin_subscriptions
FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Admins can view their own subscription" ON public.admin_subscriptions
FOR SELECT TO authenticated
USING (
  is_admin() AND 
  admin_id IN (SELECT id FROM public.admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update their own subscription" ON public.admin_subscriptions
FOR UPDATE TO authenticated
USING (
  is_admin() AND 
  admin_id IN (SELECT id FROM public.admins WHERE user_id = auth.uid())
);

-- Políticas RLS para kiwify_webhook_logs
CREATE POLICY "Super admins can view webhook logs" ON public.kiwify_webhook_logs
FOR SELECT TO authenticated
USING (is_super_admin());

-- Criar triggers para updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_subscriptions_updated_at
BEFORE UPDATE ON public.admin_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar se admin tem assinatura ativa
CREATE OR REPLACE FUNCTION public.admin_has_active_subscription(admin_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_subscriptions sub
    JOIN public.admins a ON sub.admin_id = a.id
    WHERE a.user_id = admin_user_id
    AND sub.status = 'active'
    AND sub.end_date > now()
  );
$$;

-- Função para verificar se usuário pode acessar como admin
CREATE OR REPLACE FUNCTION public.can_access_admin_features()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN is_super_admin() THEN true
    WHEN is_admin() THEN admin_has_active_subscription(auth.uid())
    ELSE false
  END;
$$;