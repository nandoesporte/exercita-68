-- Create receitas table
CREATE TABLE IF NOT EXISTS public.receitas (
  receita_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao_curta text,
  ingredientes jsonb NOT NULL DEFAULT '[]'::jsonb,
  modo_preparo text NOT NULL,
  tempo_minutos integer NOT NULL,
  rendimento integer NOT NULL DEFAULT 1,
  calorias_por_porcao numeric,
  macros_por_porcao jsonb DEFAULT '{"proteina": 0, "gordura": 0, "carboidrato": 0}'::jsonb,
  tags text[] DEFAULT '{}',
  nivel_dificuldade text CHECK (nivel_dificuldade IN ('fácil', 'médio', 'difícil')),
  imagem_url text,
  criado_por text NOT NULL DEFAULT 'system',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view receitas"
  ON public.receitas
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can create receitas"
  ON public.receitas
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update receitas"
  ON public.receitas
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete receitas"
  ON public.receitas
  FOR DELETE
  USING (is_admin());

-- Create indexes for faster lookups
CREATE INDEX idx_receitas_criado_por ON public.receitas(criado_por);
CREATE INDEX idx_receitas_tags ON public.receitas USING GIN(tags);
CREATE INDEX idx_receitas_nivel ON public.receitas(nivel_dificuldade);