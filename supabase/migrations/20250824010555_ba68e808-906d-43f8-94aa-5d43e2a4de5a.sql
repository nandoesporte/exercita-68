-- Fix workout exercises that have null day_of_week
-- Set them to 'monday' for the specific workout that's having issues
UPDATE workout_exercises 
SET day_of_week = 'monday'
WHERE workout_id = '24c8fe5c-0eca-4bbd-8937-7d4d4f3bd371' 
AND day_of_week IS NULL;