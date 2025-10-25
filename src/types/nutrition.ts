export type Gender = 'masculino' | 'feminino' | 'outro';
export type Goal = 'perder_peso' | 'ganhar_massa' | 'manter_peso' | 'saude_geral';
export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';
export type MealType = 'cafe' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia';
export type DayOfWeek = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
export type Difficulty = 'facil' | 'medio' | 'dificil';
export type TipCategory = 'hidratacao' | 'macronutrientes' | 'suplementacao' | 'receitas' | 'habitos' | 'mitos';

export interface NutritionProfile {
  id: string;
  user_id: string;
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  allergies: string[];
  restrictions: string[];
  goal: Goal;
  activity_level: ActivityLevel;
  bmi: number | null;
  bmr: number | null;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fats: number | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  admin_id: string | null;
  name: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fats_per_serving: number | null;
  tags: string[];
  image_url: string | null;
  difficulty: Difficulty | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  nutrition_profile_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by_admin: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  day_of_week: DayOfWeek;
  meal_type: MealType;
  recipe_id: string | null;
  recipe?: Recipe;
  custom_meal: string | null;
  portion_size: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  notes: string | null;
  order_position: number;
  created_at: string;
}

export interface FoodDiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  meal_type: MealType;
  recipe_id: string | null;
  recipe?: Recipe;
  food_name: string;
  description: string | null;
  quantity: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface NutritionTip {
  id: string;
  admin_id: string | null;
  title: string;
  content: string;
  category: TipCategory;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const GOAL_LABELS: Record<Goal, string> = {
  perder_peso: 'Perder Peso',
  ganhar_massa: 'Ganhar Massa Muscular',
  manter_peso: 'Manter Peso',
  saude_geral: 'Saúde Geral'
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentário',
  leve: 'Levemente Ativo',
  moderado: 'Moderadamente Ativo',
  intenso: 'Muito Ativo',
  muito_intenso: 'Extremamente Ativo'
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
  ceia: 'Ceia'
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo'
};