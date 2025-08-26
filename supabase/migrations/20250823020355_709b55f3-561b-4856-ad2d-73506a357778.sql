-- Fix foreign key references for exercises to use workout_categories
-- Note: The exercises table should reference workout_categories, not product_categories

-- First, let's make sure we have proper foreign key constraints
-- Drop existing foreign key if it exists
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_category_id_fkey;

-- Add proper foreign key constraint to exercises table to reference workout_categories
ALTER TABLE exercises 
ADD CONSTRAINT exercises_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES workout_categories(id) ON DELETE SET NULL;

-- Fix foreign key references for products to use product_categories  
-- Drop existing foreign key if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Add proper foreign key constraint to products table to reference product_categories
ALTER TABLE products 
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;