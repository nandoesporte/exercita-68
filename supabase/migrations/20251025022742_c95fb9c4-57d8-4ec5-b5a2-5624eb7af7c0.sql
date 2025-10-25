-- Add is_featured column to workouts table
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.workouts.is_featured IS 'Treinos em destaque mostrados para todos os usuários na página inicial';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workouts_is_featured ON public.workouts(is_featured) WHERE is_featured = true;