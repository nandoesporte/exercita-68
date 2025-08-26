-- Enable Row Level Security on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only admins to view admin data
CREATE POLICY "Only admins can view admin data" 
ON public.admins 
FOR SELECT 
USING (public.is_admin());

-- Create policy to allow only admins to insert admin records
CREATE POLICY "Only admins can create admin records" 
ON public.admins 
FOR INSERT 
WITH CHECK (public.is_admin());

-- Create policy to allow only admins to update admin records
CREATE POLICY "Only admins can update admin records" 
ON public.admins 
FOR UPDATE 
USING (public.is_admin());

-- Create policy to allow only admins to delete admin records
CREATE POLICY "Only admins can delete admin records" 
ON public.admins 
FOR DELETE 
USING (public.is_admin());