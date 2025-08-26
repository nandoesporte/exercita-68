-- Associar todas as categorias existentes ao admin Mayara
UPDATE workout_categories 
SET admin_id = '25e55c3a-8c3e-4d05-ba12-e9e2e4cb264f'
WHERE admin_id IS NULL;