-- Finalizar políticas RLS para demais tabelas

-- USER WORKOUT HISTORY
DROP POLICY IF EXISTS "Users can view their own workout history" ON public.user_workout_history;
DROP POLICY IF EXISTS "Users can create their own workout history" ON public.user_workout_history;
DROP POLICY IF EXISTS "Users can update their own workout history" ON public.user_workout_history;
DROP POLICY IF EXISTS "Admins can delete workout history" ON public.user_workout_history;

CREATE POLICY "Users can view their own workout history" ON public.user_workout_history
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Users can create workout history with their admin" ON public.user_workout_history
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        admin_id = public.get_user_admin_id(auth.uid())
    );

CREATE POLICY "Users can update their own workout history" ON public.user_workout_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete workout history from their users" ON public.user_workout_history
    FOR DELETE USING (
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

-- WORKOUT RECOMMENDATIONS
DROP POLICY IF EXISTS "Users can view their own workout recommendations" ON public.workout_recommendations;
DROP POLICY IF EXISTS "Admins can manage workout recommendations" ON public.workout_recommendations;

CREATE POLICY "Users can view workout recommendations" ON public.workout_recommendations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Admins can manage workout recommendations" ON public.workout_recommendations
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_workouts') AND 
         admin_id = public.get_current_admin_id())
    );

-- ORDERS
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Users can create orders with their admin" ON public.orders
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        admin_id = public.get_user_admin_id(auth.uid())
    );

CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (
        auth.uid() = user_id OR
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Admins can delete orders from their users" ON public.orders
    FOR DELETE USING (
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

-- PAYMENT SETTINGS
DROP POLICY IF EXISTS "Admins can manage payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Admins can view payment settings" ON public.payment_settings;

CREATE POLICY "Admins can view their payment settings" ON public.payment_settings
    FOR SELECT USING (
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Admins can manage their payment settings" ON public.payment_settings
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_payment_methods') AND 
         admin_id = public.get_current_admin_id())
    );

-- PIX KEYS
DROP POLICY IF EXISTS "Admins can manage PIX keys" ON public.pix_keys;
DROP POLICY IF EXISTS "Admins can view PIX keys" ON public.pix_keys;

CREATE POLICY "Admins can view their PIX keys" ON public.pix_keys
    FOR SELECT USING (
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Admins can manage their PIX keys" ON public.pix_keys
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_payment_methods') AND 
         admin_id = public.get_current_admin_id())
    );

-- PERSONAL TRAINERS
DROP POLICY IF EXISTS "Admins can manage personal trainers" ON public.personal_trainers;
DROP POLICY IF EXISTS "Admins can view personal trainers" ON public.personal_trainers;

CREATE POLICY "Admins can view their personal trainers" ON public.personal_trainers
    FOR SELECT USING (
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Admins can manage their personal trainers" ON public.personal_trainers
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );