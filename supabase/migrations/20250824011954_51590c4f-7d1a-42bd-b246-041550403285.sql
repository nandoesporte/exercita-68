-- Fix foreign key constraint to allow cascade deletion of workout_days when workout is deleted

-- Drop the existing foreign key constraint
ALTER TABLE workout_days 
DROP CONSTRAINT IF EXISTS workout_days_workout_id_fkey;

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE workout_days
ADD CONSTRAINT workout_days_workout_id_fkey 
FOREIGN KEY (workout_id) 
REFERENCES workouts(id) 
ON DELETE CASCADE;

-- Also fix workout_exercises table if it has the same issue
ALTER TABLE workout_exercises 
DROP CONSTRAINT IF EXISTS workout_exercises_workout_id_fkey;

ALTER TABLE workout_exercises
ADD CONSTRAINT workout_exercises_workout_id_fkey 
FOREIGN KEY (workout_id) 
REFERENCES workouts(id) 
ON DELETE CASCADE;