-- Add missing foreign key constraints and update existing ones to match the provided schema

-- Add foreign key constraint for appointments
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Update equipment_based_workouts foreign key to reference auth.users
ALTER TABLE public.equipment_based_workouts 
DROP CONSTRAINT IF EXISTS equipment_based_workouts_user_id_fkey;

ALTER TABLE public.equipment_based_workouts 
ADD CONSTRAINT equipment_based_workouts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add foreign key for photo_analysis_id in equipment_based_workouts
ALTER TABLE public.equipment_based_workouts 
ADD CONSTRAINT equipment_based_workouts_photo_analysis_id_fkey 
FOREIGN KEY (photo_analysis_id) REFERENCES public.gym_photo_analysis(id);

-- Add foreign key for exercises category_id
ALTER TABLE public.exercises 
ADD CONSTRAINT exercises_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.workout_categories(id);

-- Add foreign key for gym_photo_analysis
ALTER TABLE public.gym_photo_analysis 
ADD CONSTRAINT gym_photo_analysis_photo_id_fkey 
FOREIGN KEY (photo_id) REFERENCES public.user_gym_photos(id);

-- Add foreign keys for order_items
ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Update orders to reference auth.users
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add CHECK constraint for pix_keys
ALTER TABLE public.pix_keys 
ADD CONSTRAINT pix_keys_key_type_check 
CHECK (key_type = ANY (ARRAY['cpf'::text, 'email'::text, 'phone'::text, 'random'::text]));

-- Update products category_id foreign key (this should already exist but let's make sure)
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

ALTER TABLE public.products 
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.workout_categories(id);

-- Add foreign key for profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id);

-- Update user_gym_photos to reference auth.users
ALTER TABLE public.user_gym_photos 
DROP CONSTRAINT IF EXISTS user_gym_photos_user_id_fkey;

ALTER TABLE public.user_gym_photos 
ADD CONSTRAINT user_gym_photos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add foreign keys for user_workout_history
ALTER TABLE public.user_workout_history 
ADD CONSTRAINT user_workout_history_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES public.workouts(id);

ALTER TABLE public.user_workout_history 
ADD CONSTRAINT user_workout_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add CHECK constraint for workout_days
ALTER TABLE public.workout_days 
ADD CONSTRAINT workout_days_day_of_week_check 
CHECK (day_of_week = ANY (ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text, 'saturday'::text, 'sunday'::text]));

-- Add foreign key for workout_days
ALTER TABLE public.workout_days 
ADD CONSTRAINT workout_days_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES public.workouts(id);

-- Add foreign keys for workout_exercises
ALTER TABLE public.workout_exercises 
ADD CONSTRAINT workout_exercises_exercise_id_fkey 
FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);

ALTER TABLE public.workout_exercises 
ADD CONSTRAINT workout_exercises_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES public.workouts(id);

-- Add foreign keys for workout_clone_history
ALTER TABLE public.workout_clone_history 
ADD CONSTRAINT workout_clone_history_cloned_by_user_id_fkey 
FOREIGN KEY (cloned_by_user_id) REFERENCES auth.users(id);

ALTER TABLE public.workout_clone_history 
ADD CONSTRAINT workout_clone_history_target_user_id_fkey 
FOREIGN KEY (target_user_id) REFERENCES auth.users(id);

ALTER TABLE public.workout_clone_history 
ADD CONSTRAINT workout_clone_history_source_workout_id_fkey 
FOREIGN KEY (source_workout_id) REFERENCES public.workouts(id);

ALTER TABLE public.workout_clone_history 
ADD CONSTRAINT workout_clone_history_cloned_workout_id_fkey 
FOREIGN KEY (cloned_workout_id) REFERENCES public.workouts(id);

-- Add foreign keys for workout_recommendations  
ALTER TABLE public.workout_recommendations 
ADD CONSTRAINT workout_recommendations_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES public.workouts(id);

ALTER TABLE public.workout_recommendations 
ADD CONSTRAINT workout_recommendations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add foreign key for workouts
ALTER TABLE public.workouts 
ADD CONSTRAINT workouts_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.workout_categories(id);