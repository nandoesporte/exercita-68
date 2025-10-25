-- Tabela de perfis nutricionais
CREATE TABLE public.nutrition_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino', 'outro')),
  allergies TEXT[] DEFAULT '{}',
  restrictions TEXT[] DEFAULT '{}',
  goal TEXT NOT NULL CHECK (goal IN ('perder_peso', 'ganhar_massa', 'manter_peso', 'saude_geral')),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentario', 'leve', 'moderado', 'intenso', 'muito_intenso')),
  bmi NUMERIC,
  bmr NUMERIC,
  daily_calories NUMERIC,
  daily_protein NUMERIC,
  daily_carbs NUMERIC,
  daily_fats NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de receitas (criar antes de meal_plan_items que a referencia)
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL,
  instructions TEXT NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER DEFAULT 1,
  calories_per_serving NUMERIC,
  protein_per_serving NUMERIC,
  carbs_per_serving NUMERIC,
  fats_per_serving NUMERIC,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de planos alimentares
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nutrition_profile_id UUID REFERENCES public.nutrition_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by_admin UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de itens do plano alimentar
CREATE TABLE public.meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo')),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia')),
  recipe_id UUID REFERENCES public.recipes(id),
  custom_meal TEXT,
  portion_size TEXT,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fats NUMERIC,
  notes TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de diário alimentar
CREATE TABLE public.food_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia')),
  recipe_id UUID REFERENCES public.recipes(id),
  food_name TEXT NOT NULL,
  description TEXT,
  quantity TEXT,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fats NUMERIC,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de dicas nutricionais
CREATE TABLE public.nutrition_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hidratacao', 'macronutrientes', 'suplementacao', 'receitas', 'habitos', 'mitos')),
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_tips ENABLE ROW LEVEL SECURITY;

-- RLS Policies para nutrition_profiles
CREATE POLICY "Users can view their own nutrition profile"
  ON public.nutrition_profiles FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own nutrition profile"
  ON public.nutrition_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition profile"
  ON public.nutrition_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all nutrition profiles"
  ON public.nutrition_profiles FOR ALL
  USING (is_admin());

-- RLS Policies para meal_plans
CREATE POLICY "Users can view their own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all meal plans"
  ON public.meal_plans FOR ALL
  USING (is_admin());

-- RLS Policies para meal_plan_items
CREATE POLICY "Users can view items from their meal plans"
  ON public.meal_plan_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND (meal_plans.user_id = auth.uid() OR is_admin())
  ));

CREATE POLICY "Users can create items in their meal plans"
  ON public.meal_plan_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in their meal plans"
  ON public.meal_plan_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from their meal plans"
  ON public.meal_plan_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all meal plan items"
  ON public.meal_plan_items FOR ALL
  USING (is_admin());

-- RLS Policies para recipes
CREATE POLICY "Everyone can view published recipes"
  ON public.recipes FOR SELECT
  USING (is_published = true OR is_admin());

CREATE POLICY "Admins can manage recipes"
  ON public.recipes FOR ALL
  USING (is_admin());

-- RLS Policies para food_diary_entries
CREATE POLICY "Users can view their own food diary"
  ON public.food_diary_entries FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own food diary entries"
  ON public.food_diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food diary entries"
  ON public.food_diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food diary entries"
  ON public.food_diary_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all food diary entries"
  ON public.food_diary_entries FOR SELECT
  USING (is_admin());

-- RLS Policies para nutrition_tips
CREATE POLICY "Everyone can view published nutrition tips"
  ON public.nutrition_tips FOR SELECT
  USING (is_published = true OR is_admin());

CREATE POLICY "Admins can manage nutrition tips"
  ON public.nutrition_tips FOR ALL
  USING (is_admin());

-- Triggers para atualizar updated_at
CREATE TRIGGER update_nutrition_profiles_updated_at
  BEFORE UPDATE ON public.nutrition_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_tips_updated_at
  BEFORE UPDATE ON public.nutrition_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_nutrition_profiles_user_id ON public.nutrition_profiles(user_id);
CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_meal_plan_items_meal_plan_id ON public.meal_plan_items(meal_plan_id);
CREATE INDEX idx_food_diary_entries_user_id ON public.food_diary_entries(user_id);
CREATE INDEX idx_food_diary_entries_entry_date ON public.food_diary_entries(entry_date);
CREATE INDEX idx_recipes_tags ON public.recipes USING GIN(tags);
CREATE INDEX idx_nutrition_tips_category ON public.nutrition_tips(category);