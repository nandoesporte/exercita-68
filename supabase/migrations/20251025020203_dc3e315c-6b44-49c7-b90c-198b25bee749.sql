-- Create food search cache table
CREATE TABLE IF NOT EXISTS public.food_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term TEXT NOT NULL,
  results JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('local', 'openfoodfacts', 'edamam')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_food_search_cache_term ON public.food_search_cache(search_term);
CREATE INDEX IF NOT EXISTS idx_food_search_cache_expires ON public.food_search_cache(expires_at);

-- Enable RLS
ALTER TABLE public.food_search_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can read food search cache"
ON public.food_search_cache
FOR SELECT
USING (true);

CREATE POLICY "System can insert into food search cache"
ON public.food_search_cache
FOR INSERT
WITH CHECK (true);

-- Function to clean expired cache entries (can be called periodically)
CREATE OR REPLACE FUNCTION public.clean_expired_food_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.food_search_cache 
  WHERE expires_at < now();
END;
$$;