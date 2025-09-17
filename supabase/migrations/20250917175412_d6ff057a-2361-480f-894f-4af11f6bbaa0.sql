-- Fix remaining leg exercises that are still incorrectly categorized as "Costas"

DO $$
DECLARE
    costas_id uuid;
    membros_inferiores_id uuid;
    exercise_record record;
BEGIN
    -- Get the category IDs
    SELECT id INTO costas_id FROM workout_categories WHERE name = 'Costas';
    SELECT id INTO membros_inferiores_id FROM workout_categories WHERE name = 'Membros Inferiores';
    
    -- Move remaining leg exercises from Costas to Membros Inferiores
    FOR exercise_record IN
        SELECT id, name FROM exercises 
        WHERE category_id = costas_id 
        AND (
            -- Lower limb exercises
            LOWER(name) LIKE '%afundo%' OR
            LOWER(name) LIKE '%lunge%' OR
            LOWER(name) LIKE '%adutora%' OR
            LOWER(name) LIKE '%abdutora%' OR
            LOWER(name) LIKE '%cadeira flex%' OR
            LOWER(name) LIKE '%cadeira extensora%' OR
            LOWER(name) LIKE '%hip%gluteo%' OR
            LOWER(name) LIKE '%gluteo%' OR
            LOWER(name) LIKE '%glute%' OR
            LOWER(name) LIKE '%posterior%coxa%' OR
            LOWER(name) LIKE '%anterior%coxa%' OR
            LOWER(name) LIKE '%beinheben%' OR  -- German exercises for legs
            LOWER(name) LIKE '%stehendes%beinheben%' OR
            LOWER(name) LIKE '%panturr%' OR
            LOWER(name) LIKE '%gastrocnemio%' OR
            LOWER(name) LIKE '%soleo%' OR
            LOWER(name) LIKE '%flexor%' OR
            LOWER(name) LIKE '%tensor%' OR
            -- Additional patterns for leg exercises
            (LOWER(name) LIKE '%perna%' AND NOT LOWER(name) LIKE '%supina%') OR
            (LOWER(name) LIKE '%coxa%') OR
            (LOWER(name) LIKE '%quadriceps%') OR
            (LOWER(name) LIKE '%femoral%') OR
            (LOWER(name) LIKE '%isquio%') OR
            (LOWER(name) LIKE '%tibial%')
        )
    LOOP
        UPDATE exercises 
        SET category_id = membros_inferiores_id 
        WHERE id = exercise_record.id;
        
        RAISE NOTICE 'Moved exercise "%" from Costas to Membros Inferiores', exercise_record.name;
    END LOOP;
END $$;