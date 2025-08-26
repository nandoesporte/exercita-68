-- Drop existing policies if they exist and recreate them
-- This ensures we have the correct security policies without conflicts

-- Admin subscriptions
DROP POLICY IF EXISTS "Admins can view their own subscriptions" ON public.admin_subscriptions;
DROP POLICY IF EXISTS "Admins can create their own subscriptions" ON public.admin_subscriptions;

CREATE POLICY "Admins can view their own subscriptions" 
ON public.admin_subscriptions 
FOR SELECT 
USING (
  public.is_admin() AND 
  admin_id IN (SELECT id FROM public.admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can create their own subscriptions" 
ON public.admin_subscriptions 
FOR INSERT 
WITH CHECK (
  public.is_admin() AND 
  admin_id IN (SELECT id FROM public.admins WHERE user_id = auth.uid())
);

-- Appointments
CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update appointments" 
ON public.appointments 
FOR UPDATE 
USING (public.is_admin());

-- Equipment based workouts
CREATE POLICY "Users can view their own equipment workouts" 
ON public.equipment_based_workouts 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own equipment workouts" 
ON public.equipment_based_workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Order items
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ) OR public.is_admin()
);

-- User workout history
CREATE POLICY "Users can view their own workout history" 
ON public.user_workout_history 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own workout history" 
ON public.user_workout_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- User gym photos
CREATE POLICY "Users can view their own gym photos" 
ON public.user_gym_photos 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own gym photos" 
ON public.user_gym_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Workout recommendations
CREATE POLICY "Users can view their own workout recommendations" 
ON public.workout_recommendations 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can create workout recommendations" 
ON public.workout_recommendations 
FOR ALL 
USING (public.is_admin());

-- Tables that should be admin-only
CREATE POLICY "Only admins can access payment settings" 
ON public.payment_settings 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can access pix keys" 
ON public.pix_keys 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can access webhook logs" 
ON public.kiwify_webhook_logs 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can access gym photo analysis" 
ON public.gym_photo_analysis 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can access workout clone history" 
ON public.workout_clone_history 
FOR ALL 
USING (public.is_admin());

-- Public viewing tables with admin modification
CREATE POLICY "Everyone can view personal trainers" 
ON public.personal_trainers 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify personal trainers" 
ON public.personal_trainers 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Everyone can view product categories" 
ON public.product_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify product categories" 
ON public.product_categories 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Everyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can modify products" 
ON public.products 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Everyone can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can modify subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Everyone can view workout days" 
ON public.workout_days 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify workout days" 
ON public.workout_days 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Everyone can view workout exercises" 
ON public.workout_exercises 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify workout exercises" 
ON public.workout_exercises 
FOR ALL 
USING (public.is_admin());