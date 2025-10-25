-- Create diario_alimentar table
CREATE TABLE IF NOT EXISTS public.diario_alimentar (
  entry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL,
  hora time NOT NULL,
  refeicao_tipo text NOT NULL CHECK (refeicao_tipo IN ('cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia')),
  alimentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  foto_url text,
  anotacao text,
  total_calorias numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diario_alimentar ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own diary entries"
  ON public.diario_alimentar
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own diary entries"
  ON public.diario_alimentar
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
  ON public.diario_alimentar
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
  ON public.diario_alimentar
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all diary entries"
  ON public.diario_alimentar
  FOR ALL
  USING (is_admin());

-- Create indexes for faster lookups
CREATE INDEX idx_diario_alimentar_user_id ON public.diario_alimentar(user_id);
CREATE INDEX idx_diario_alimentar_data ON public.diario_alimentar(data);
CREATE INDEX idx_diario_alimentar_user_data ON public.diario_alimentar(user_id, data);