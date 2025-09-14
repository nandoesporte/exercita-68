-- Adicionar política para super admins verem e modificarem todas as assinaturas
CREATE POLICY "Super admins can view all subscriptions"
ON public.admin_subscriptions
FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can update all subscriptions"
ON public.admin_subscriptions
FOR UPDATE
TO authenticated
USING (public.is_super_admin());