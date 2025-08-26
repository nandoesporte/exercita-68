-- Add missing constraints only if they don't exist

-- Add CHECK constraint for pix_keys if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'pix_keys_key_type_check'
    ) THEN
        ALTER TABLE public.pix_keys 
        ADD CONSTRAINT pix_keys_key_type_check 
        CHECK (key_type = ANY (ARRAY['cpf'::text, 'email'::text, 'phone'::text, 'random'::text]));
    END IF;
END $$;

-- Add CHECK constraint for workout_days if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'workout_days_day_of_week_check'
    ) THEN
        ALTER TABLE public.workout_days 
        ADD CONSTRAINT workout_days_day_of_week_check 
        CHECK (day_of_week = ANY (ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text, 'saturday'::text, 'sunday'::text]));
    END IF;
END $$;

-- Add missing foreign keys that may not exist
DO $$ 
BEGIN
    -- Add gym_photo_analysis foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'gym_photo_analysis_photo_id_fkey'
    ) THEN
        ALTER TABLE public.gym_photo_analysis 
        ADD CONSTRAINT gym_photo_analysis_photo_id_fkey 
        FOREIGN KEY (photo_id) REFERENCES public.user_gym_photos(id);
    END IF;

    -- Add equipment_based_workouts photo_analysis_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'equipment_based_workouts_photo_analysis_id_fkey'
    ) THEN
        ALTER TABLE public.equipment_based_workouts 
        ADD CONSTRAINT equipment_based_workouts_photo_analysis_id_fkey 
        FOREIGN KEY (photo_analysis_id) REFERENCES public.gym_photo_analysis(id);
    END IF;

    -- Add profiles foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Update foreign keys to match the schema (change from profiles to auth.users where needed)
-- Update equipment_based_workouts to reference auth.users
ALTER TABLE public.equipment_based_workouts 
DROP CONSTRAINT IF EXISTS equipment_based_workouts_user_id_fkey;

ALTER TABLE public.equipment_based_workouts 
ADD CONSTRAINT equipment_based_workouts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Update orders to reference auth.users  
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Update user_gym_photos to reference auth.users
ALTER TABLE public.user_gym_photos 
DROP CONSTRAINT IF EXISTS user_gym_photos_user_id_fkey;

ALTER TABLE public.user_gym_photos 
ADD CONSTRAINT user_gym_photos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add workout_clone_history foreign keys to auth.users
ALTER TABLE public.workout_clone_history 
DROP CONSTRAINT IF EXISTS workout_clone_history_cloned_by_user_id_fkey;

ALTER TABLE public.workout_clone_history 
ADD CONSTRAINT workout_clone_history_cloned_by_user_id_fkey 
FOREIGN KEY (cloned_by_user_id) REFERENCES auth.users(id);

ALTER TABLE public.workout_clone_history 
DROP CONSTRAINT IF EXISTS workout_clone_history_target_user_id_fkey;

ALTER TABLE public.workout_clone_history 
ADD CONSTRAINT workout_clone_history_target_user_id_fkey 
FOREIGN KEY (target_user_id) REFERENCES auth.users(id);

-- Add workout_recommendations foreign key to auth.users
ALTER TABLE public.workout_recommendations 
DROP CONSTRAINT IF EXISTS workout_recommendations_user_id_fkey;

ALTER TABLE public.workout_recommendations 
ADD CONSTRAINT workout_recommendations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);