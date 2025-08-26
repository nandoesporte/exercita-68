-- Create custom types/enums
CREATE TYPE user_permission AS ENUM ('manage_users', 'manage_workouts', 'manage_exercises', 'manage_products', 'manage_payments', 'view_analytics');
CREATE TYPE workout_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'user');

-- Create subscription_plans table first (no dependencies)
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  checkout_url text,
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

-- Create admins table 
CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text])),
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT admins_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create admin_permissions table
CREATE TABLE public.admin_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  permission user_permission NOT NULL,
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_permissions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id),
  CONSTRAINT admin_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id)
);

-- Create admin_subscriptions table
CREATE TABLE public.admin_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'cancelled'::text, 'expired'::text])),
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  kiwify_order_id text,
  kiwify_customer_id text,
  payment_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_subscriptions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id),
  CONSTRAINT admin_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  height numeric,
  weight numeric,
  birthdate date,
  gender text,
  fitness_goal text,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  instance_id uuid,
  admin_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

-- Create workout_categories table
CREATE TABLE public.workout_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  color text DEFAULT '#00CB7E'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT workout_categories_pkey PRIMARY KEY (id),
  CONSTRAINT workout_categories_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

-- Create exercises table
CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  video_url text,
  category_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT exercises_pkey PRIMARY KEY (id),
  CONSTRAINT exercises_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.workout_categories(id),
  CONSTRAINT exercises_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

-- Create workouts table
CREATE TABLE public.workouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  duration integer NOT NULL,
  level workout_level NOT NULL,
  calories integer,
  category_id uuid,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_recommended boolean DEFAULT false,
  admin_id uuid,
  user_id uuid,
  CONSTRAINT workouts_pkey PRIMARY KEY (id),
  CONSTRAINT workouts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.workout_categories(id),
  CONSTRAINT workouts_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id),
  CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create workout_exercises table
CREATE TABLE public.workout_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_id uuid,
  exercise_id uuid,
  sets integer DEFAULT 1,
  reps integer,
  duration integer,
  rest integer,
  order_position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  weight numeric,
  day_of_week text,
  is_title_section boolean DEFAULT false,
  section_title text,
  CONSTRAINT workout_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
  CONSTRAINT workout_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id)
);

-- Create remaining tables
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  trainer_name text NOT NULL,
  title text NOT NULL,
  description text,
  appointment_date timestamp with time zone NOT NULL,
  duration integer NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT appointments_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.user_gym_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  description text,
  approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  processed_by_ai boolean DEFAULT false,
  admin_id uuid,
  CONSTRAINT user_gym_photos_pkey PRIMARY KEY (id),
  CONSTRAINT user_gym_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_gym_photos_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.gym_photo_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL,
  equipment_detected jsonb,
  analysis_date timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gym_photo_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT gym_photo_analysis_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.user_gym_photos(id)
);

CREATE TABLE public.equipment_based_workouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_analysis_id uuid,
  fitness_goal text,
  fitness_level text,
  available_time integer,
  equipment_list jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  admin_id uuid,
  CONSTRAINT equipment_based_workouts_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_based_workouts_photo_analysis_id_fkey FOREIGN KEY (photo_analysis_id) REFERENCES public.gym_photo_analysis(id),
  CONSTRAINT equipment_based_workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT equipment_based_workouts_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#00CB7E'::text,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT product_categories_pkey PRIMARY KEY (id),
  CONSTRAINT product_categories_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category_id uuid,
  sale_url text,
  is_featured boolean DEFAULT false,
  admin_id uuid,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id),
  CONSTRAINT products_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  total_amount numeric NOT NULL,
  kiwify_order_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  accept_card_payments boolean DEFAULT true,
  accept_pix_payments boolean DEFAULT true,
  accept_monthly_fee boolean DEFAULT false,
  monthly_fee_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT payment_settings_pkey PRIMARY KEY (id),
  CONSTRAINT payment_settings_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.pix_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key_type text NOT NULL CHECK (key_type = ANY (ARRAY['cpf'::text, 'email'::text, 'phone'::text, 'random'::text])),
  key_value text NOT NULL,
  recipient_name text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT pix_keys_pkey PRIMARY KEY (id),
  CONSTRAINT pix_keys_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.personal_trainers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credentials text,
  bio text,
  whatsapp text,
  photo_url text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT personal_trainers_pkey PRIMARY KEY (id),
  CONSTRAINT personal_trainers_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role user_role NOT NULL,
  admin_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_roles_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.user_workout_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  workout_id uuid,
  completed_at timestamp with time zone DEFAULT now(),
  calories_burned integer,
  duration integer,
  rating integer,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT user_workout_history_pkey PRIMARY KEY (id),
  CONSTRAINT user_workout_history_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id),
  CONSTRAINT user_workout_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_workout_history_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.workout_days (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week = ANY (ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text, 'saturday'::text, 'sunday'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_days_pkey PRIMARY KEY (id),
  CONSTRAINT workout_days_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id)
);

CREATE TABLE public.workout_clone_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_workout_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  cloned_workout_id uuid,
  cloned_by_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text,
  error_message text,
  CONSTRAINT workout_clone_history_pkey PRIMARY KEY (id),
  CONSTRAINT workout_clone_history_source_workout_id_fkey FOREIGN KEY (source_workout_id) REFERENCES public.workouts(id),
  CONSTRAINT workout_clone_history_cloned_workout_id_fkey FOREIGN KEY (cloned_workout_id) REFERENCES public.workouts(id),
  CONSTRAINT workout_clone_history_cloned_by_user_id_fkey FOREIGN KEY (cloned_by_user_id) REFERENCES auth.users(id),
  CONSTRAINT workout_clone_history_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.workout_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  admin_id uuid,
  CONSTRAINT workout_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT workout_recommendations_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id),
  CONSTRAINT workout_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT workout_recommendations_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);

CREATE TABLE public.kiwify_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  order_id text,
  customer_id text,
  status text,
  payload jsonb NOT NULL,
  processed_at timestamp with time zone DEFAULT now(),
  admin_subscription_id uuid,
  CONSTRAINT kiwify_webhook_logs_pkey PRIMARY KEY (id),
  CONSTRAINT kiwify_webhook_logs_admin_subscription_id_fkey FOREIGN KEY (admin_subscription_id) REFERENCES public.admin_subscriptions(id)
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gym_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_photo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_based_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_clone_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiwify_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for profiles (most important)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create basic RLS policies for workouts (public read, admin write)
CREATE POLICY "Workouts are viewable by everyone" ON public.workouts FOR SELECT USING (true);
CREATE POLICY "Only admins can create workouts" ON public.workouts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Only admins can update workouts" ON public.workouts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create basic RLS policies for exercises (public read, admin write)
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Only admins can create exercises" ON public.exercises FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Only admins can update exercises" ON public.exercises FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create basic RLS policies for workout_categories (public read, admin write)
CREATE POLICY "Workout categories are viewable by everyone" ON public.workout_categories FOR SELECT USING (true);
CREATE POLICY "Only admins can create workout categories" ON public.workout_categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Only admins can update workout categories" ON public.workout_categories FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create helper functions for admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, super admin is just regular admin
  -- This can be extended later with specific super admin logic
  RETURN public.is_admin();
END;
$$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, instance_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'instance_id'
  );
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();