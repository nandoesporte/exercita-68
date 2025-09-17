-- Fix incorrect exercise categorization: move leg exercises from "Costas" to "Membros Inferiores"

DO $$
DECLARE
    costas_id uuid;
    membros_inferiores_id uuid;
    exercise_record record;
BEGIN
    -- Get the category IDs
    SELECT id INTO costas_id FROM workout_categories WHERE name = 'Costas';
    SELECT id INTO membros_inferiores_id FROM workout_categories WHERE name = 'Membros Inferiores';
    
    -- Move leg exercises from Costas to Membros Inferiores
    FOR exercise_record IN
        SELECT id, name FROM exercises 
        WHERE category_id = costas_id 
        AND (
            LOWER(name) LIKE '%agachamento%' OR
            LOWER(name) LIKE '%leg press%' OR
            LOWER(name) LIKE '%panturrinha%' OR
            LOWER(name) LIKE '%coxa%' OR
            LOWER(name) LIKE '%quadriceps%' OR
            LOWER(name) LIKE '%femoral%' OR
            LOWER(name) LIKE '%squat%' OR
            LOWER(name) LIKE '%lunge%' OR
            LOWER(name) LIKE '%stiff%' OR
            LOWER(name) LIKE '%cadeira flexora%' OR
            LOWER(name) LIKE '%cadeira extensora%'
        )
    LOOP
        UPDATE exercises 
        SET category_id = membros_inferiores_id 
        WHERE id = exercise_record.id;
        
        RAISE NOTICE 'Moved exercise "%" from Costas to Membros Inferiores', exercise_record.name;
    END LOOP;
END $$;