-- Check current policies for user_gym_photos table
-- Update the INSERT policy to be more flexible with admin_id
DROP POLICY "Users can create gym photos with their admin" ON user_gym_photos;

-- Create a more flexible policy that allows users to create gym photos
-- The admin_id will be set automatically by the trigger
CREATE POLICY "Users can create their own gym photos" 
ON user_gym_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);