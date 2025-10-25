import { useState } from 'react';
import { NutritionOnboarding } from '@/components/nutrition/NutritionOnboarding';
import { TodayTab } from '@/components/nutrition/TodayTab';
import { PlanTab } from '@/components/nutrition/PlanTab';
import { RecipesTab } from '@/components/nutrition/RecipesTab';
import { EducationTab } from '@/components/nutrition/EducationTab';
import { NutritionAssistant } from '@/components/nutrition/NutritionAssistant';
import { RequestNutritionistCard } from '@/components/nutrition/RequestNutritionistCard';
import { useNutritionProfile } from '@/hooks/useNutritionProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Apple, Calendar, BookOpen, Lightbulb, User, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { GOAL_LABELS } from '@/types/nutrition';

export default function Nutrition() {
  const { profile, isLoading } = useNutritionProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mostrar onboarding apenas se não houver perfil E o onboarding não foi completado nesta sessão
  if ((!profile && !onboardingCompleted) || showOnboarding) {
    return (
      <NutritionOnboarding 
        onComplete={() => {
          setShowOnboarding(false);
          setOnboardingCompleted(true);
        }} 
      />
    );
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' };
    if (bmi < 25) return { label: 'Peso normal', color: 'text-green-500' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' };
    return { label: 'Obesidade', color: 'text-red-500' };
  };

  const bmiCategory = profile.bmi ? getBMICategory(profile.bmi) : null;

  return (
    <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nutrição</h1>
            <p className="text-muted-foreground">Gerencie sua alimentação e atinja seus objetivos</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
            <User className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </div>

        {/* Resumo do Perfil */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IMC</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.bmi?.toFixed(1)}</div>
              {bmiCategory && (
                <p className={`text-xs ${bmiCategory.color}`}>{bmiCategory.label}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta Diária</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.daily_calories}</div>
              <p className="text-xs text-muted-foreground">calorias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proteína</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.daily_protein}g</div>
              <p className="text-xs text-muted-foreground">por dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{GOAL_LABELS[profile.goal]}</div>
              <Badge variant="secondary" className="mt-1">
                TMB: {profile.bmr} cal
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Hoje
            </TabsTrigger>
            <TabsTrigger value="plan">
              <Calendar className="h-4 w-4 mr-2" />
              Plano
            </TabsTrigger>
            <TabsTrigger value="recipes">
              <BookOpen className="h-4 w-4 mr-2" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="education">
              <Lightbulb className="h-4 w-4 mr-2" />
              Educação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <TodayTab />
          </TabsContent>

          <TabsContent value="plan">
            <PlanTab />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipesTab />
          </TabsContent>

          <TabsContent value="education">
            <EducationTab />
          </TabsContent>
        </Tabs>

        {/* Assistente Nutricional */}
        <NutritionAssistant />
    </div>
  );
}