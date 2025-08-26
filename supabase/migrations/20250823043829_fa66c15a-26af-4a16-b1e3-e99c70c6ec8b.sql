-- Continuar atualizando políticas RLS para outras tabelas

-- PRODUCTS
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Users can view products from their admin" ON public.products
    FOR SELECT USING (
        (is_active = true AND (
            public.is_super_admin() OR
            admin_id = public.get_user_admin_id(auth.uid()) OR
            admin_id IS NULL -- Produtos públicos do sistema
        )) OR public.is_admin()
    );

CREATE POLICY "Admins can manage their products" ON public.products
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_products') AND 
         admin_id = public.get_current_admin_id())
    );

-- PRODUCT CATEGORIES
DROP POLICY IF EXISTS "Anyone can view product categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can manage product categories" ON public.product_categories;

CREATE POLICY "Users can view product categories from their admin" ON public.product_categories
    FOR SELECT USING (
        public.is_super_admin() OR
        admin_id = public.get_user_admin_id(auth.uid()) OR
        admin_id IS NULL -- Categorias públicas do sistema
    );

CREATE POLICY "Admins can manage their product categories" ON public.product_categories
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_store') AND 
         admin_id = public.get_current_admin_id())
    );

-- APPOINTMENTS
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Users can create appointments with their admin" ON public.appointments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        admin_id = public.get_user_admin_id(auth.uid())
    );

CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE USING (
        auth.uid() = user_id OR
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_appointments') AND 
         admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Admins can delete their appointments" ON public.appointments
    FOR DELETE USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_appointments') AND 
         admin_id = public.get_current_admin_id())
    );

-- USER GYM PHOTOS
DROP POLICY IF EXISTS "Users can view their own gym photos" ON public.user_gym_photos;
DROP POLICY IF EXISTS "Users can create their own gym photos" ON public.user_gym_photos;
DROP POLICY IF EXISTS "Users can update their own gym photos" ON public.user_gym_photos;
DROP POLICY IF EXISTS "Admins can delete gym photos" ON public.user_gym_photos;

CREATE POLICY "Users can view gym photos from their admin" ON public.user_gym_photos
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Users can create gym photos with their admin" ON public.user_gym_photos
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        admin_id = public.get_user_admin_id(auth.uid())
    );

CREATE POLICY "Users can update their own gym photos" ON public.user_gym_photos
    FOR UPDATE USING (
        auth.uid() = user_id OR
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_gym_photos') AND 
         admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Admins can delete gym photos from their users" ON public.user_gym_photos
    FOR DELETE USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_gym_photos') AND 
         admin_id = public.get_current_admin_id())
    );