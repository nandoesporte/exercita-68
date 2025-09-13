-- Add CASCADE DELETE to foreign key constraints related to workouts
-- First, drop existing foreign keys if they exist
ALTER TABLE IF EXISTS user_workout_history DROP CONSTRAINT IF EXISTS user_workout_history_workout_id_fkey;
ALTER TABLE IF EXISTS workout_exercises DROP CONSTRAINT IF EXISTS workout_exercises_workout_id_fkey;
ALTER TABLE IF EXISTS workout_days DROP CONSTRAINT IF EXISTS workout_days_workout_id_fkey;
ALTER TABLE IF EXISTS workout_recommendations DROP CONSTRAINT IF EXISTS workout_recommendations_workout_id_fkey;

-- Add foreign keys with CASCADE DELETE
ALTER TABLE user_workout_history 
ADD CONSTRAINT user_workout_history_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;

ALTER TABLE workout_exercises 
ADD CONSTRAINT workout_exercises_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;

ALTER TABLE workout_days 
ADD CONSTRAINT workout_days_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;

ALTER TABLE workout_recommendations 
ADD CONSTRAINT workout_recommendations_workout_id_fkey 
FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;