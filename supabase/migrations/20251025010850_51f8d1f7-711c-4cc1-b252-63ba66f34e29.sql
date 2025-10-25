-- Create nutricao_users table
CREATE TABLE IF NOT EXISTS public.nutricao_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  altura_cm numeric NOT NULL,
  peso_kg numeric NOT NULL,
  data_nascimento date NOT NULL,
  sexo text NOT NULL CHECK (sexo IN ('M', 'F', 'Outro')),
  alergias text[] DEFAULT '{}',
  restricoes text[] DEFAULT '{}',
  objetivo text NOT NULL CHECK (objetivo IN ('perda_peso', 'manutencao', 'ganho_massa', 'saude')),
  atividade_fisica text NOT NULL CHECK (atividade_fisica IN ('sedentarismo', 'leve', 'moderada', 'alta')),
  tmb numeric,
  imc numeric,
  macronutrientes jsonb DEFAULT '{"calorias": 0, "proteinas": 0, "gorduras": 0, "carboidratos": 0}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.nutricao_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nutrition profile"
  ON public.nutricao_users
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own nutrition profile"
  ON public.nutricao_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition profile"
  ON public.nutricao_users
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition profile"
  ON public.nutricao_users
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all nutrition profiles"
  ON public.nutricao_users
  FOR ALL
  USING (is_admin());

-- Create index for faster lookups
CREATE INDEX idx_nutricao_users_user_id ON public.nutricao_users(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_nutricao_users_updated_at
  BEFORE UPDATE ON public.nutricao_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();