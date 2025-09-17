-- Remove duplicate exercises, keeping only the oldest one for each name
DO $$
DECLARE
    duplicate_record record;
    exercise_to_delete uuid;
BEGIN
    -- Loop through all exercise names that have duplicates
    FOR duplicate_record IN
        SELECT name, array_agg(id ORDER BY created_at ASC) as exercise_ids
        FROM exercises 
        GROUP BY name 
        HAVING COUNT(*) > 1
    LOOP
        -- Delete all but the first (oldest) exercise for each duplicate name
        FOR i IN 2..array_length(duplicate_record.exercise_ids, 1) LOOP
            exercise_to_delete := duplicate_record.exercise_ids[i];
            
            -- First delete any workout_exercises that reference this exercise
            DELETE FROM workout_exercises WHERE exercise_id = exercise_to_delete;
            
            -- Then delete the exercise itself
            DELETE FROM exercises WHERE id = exercise_to_delete;
            
            RAISE NOTICE 'Deleted duplicate exercise "%" with ID %', duplicate_record.name, exercise_to_delete;
        END LOOP;
    END LOOP;
    
    -- Show final count
    RAISE NOTICE 'Cleanup complete. Total exercises remaining: %', (SELECT COUNT(*) FROM exercises);
END $$;