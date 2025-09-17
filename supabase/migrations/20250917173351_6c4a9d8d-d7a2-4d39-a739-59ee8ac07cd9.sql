-- Fix category names and associations
UPDATE workout_categories 
SET name = 'Triceps' 
WHERE name = 'Triceps ';

-- Check if there are exercises that should be associated with Funcional - Homem
-- Let's see what exercises contain "funcional" in their names
DO $$
DECLARE
    funcional_homem_id uuid;
    exercise_record record;
BEGIN
    -- Get the Funcional - Homem category ID
    SELECT id INTO funcional_homem_id 
    FROM workout_categories 
    WHERE name = 'Funcional - Homem';
    
    -- Update exercises that contain "funcional" and "homem" in their names
    -- to be associated with Funcional - Homem category
    FOR exercise_record IN
        SELECT id, name FROM exercises 
        WHERE (LOWER(name) LIKE '%funcional%' AND LOWER(name) LIKE '%homem%')
           OR (LOWER(name) LIKE '%functional%' AND LOWER(name) LIKE '%men%')
    LOOP
        UPDATE exercises 
        SET category_id = funcional_homem_id 
        WHERE id = exercise_record.id;
        
        RAISE NOTICE 'Updated exercise "%" to Funcional - Homem category', exercise_record.name;
    END LOOP;
END $$;