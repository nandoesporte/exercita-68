-- Fix category associations for exercises that were uploaded to wrong categories

-- Update exercises that should be in "Alongamento" category
UPDATE exercises 
SET category_id = '9b19ed0e-0af9-4d9f-9533-e363272b7018'
WHERE name ILIKE '%alongamento%' 
   OR name ILIKE '%stretch%' 
   OR name ILIKE '%estiramento%';

-- Update exercises that should be in "Ombros" category  
UPDATE exercises 
SET category_id = '0cf3a57e-20d9-49d1-a76b-a8387008a5fa'
WHERE (name ILIKE '%ombro%' OR name ILIKE '%shoulder%' OR name ILIKE '%desenvolvimento%')
   AND name NOT ILIKE '%tricep%'
   AND name NOT ILIKE '%peitoral%';

-- Update exercises that should be in "Triceps" category
UPDATE exercises 
SET category_id = '961ab250-ab3a-4485-9790-08514d8a0d87'  
WHERE name ILIKE '%tricep%';

-- Update exercises that should be in "Membros Inferiores" category
UPDATE exercises 
SET category_id = '337e1ff9-b6a4-420d-92fa-496750140a38'
WHERE name ILIKE '%inferior%' 
   OR name ILIKE '%perna%'
   OR name ILIKE '%coxa%'
   OR name ILIKE '%gluteo%'
   OR name ILIKE '%quadril%';

-- Update exercises that should be in "Funcional - Homem" category
-- (Exercises that are currently in "Funcional - Mulher" but should be for men)
UPDATE exercises 
SET category_id = '3438ec30-2645-45e7-88d5-428466e29af1'
WHERE category_id = '39c994fc-ad16-45a5-8dbd-4027c405143d' 
   AND (name ILIKE '%homem%' OR name ILIKE '%masculino%' OR name ILIKE '%male%');