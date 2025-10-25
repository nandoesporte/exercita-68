import { useState } from 'react';
import { NutritionOnboarding } from '@/components/nutrition/NutritionOnboarding';
import { useNutritionProfile } from '@/hooks/useNutritionProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Apple, Calendar, BookOpen, Lightbulb, User, TrendingUp } from 'lucide-react';
import { GOAL_LABELS } from '@/types/nutrition';

export default function Nutrition() {
  const { profile, isLoading } = useNutritionProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || showOnboarding) {
    return <NutritionOnboarding onComplete={() => setShowOnboarding(false)} />;
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
        <Tabs defaultValue="diary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diary">
              <Calendar className="h-4 w-4 mr-2" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="plan">
              <Apple className="h-4 w-4 mr-2" />
              Plano Alimentar
            </TabsTrigger>
            <TabsTrigger value="recipes">
              <BookOpen className="h-4 w-4 mr-2" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="tips">
              <Lightbulb className="h-4 w-4 mr-2" />
              Dicas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diary">
            <Card>
              <CardHeader>
                <CardTitle>Diário Alimentar</CardTitle>
                <CardDescription>Registre suas refeições diárias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de Diário Alimentar em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle>Plano Alimentar Semanal</CardTitle>
                <CardDescription>Seu plano personalizado de refeições</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Apple className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de Plano Alimentar em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes">
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Receitas</CardTitle>
                <CardDescription>Receitas saudáveis e personalizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Biblioteca de Receitas em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips">
            <Card>
              <CardHeader>
                <CardTitle>Dicas Nutricionais</CardTitle>
                <CardDescription>Aprenda sobre nutrição e saúde</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Dicas Nutricionais em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Distribuição de Macronutrientes */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Diária de Macronutrientes</CardTitle>
            <CardDescription>Meta recomendada para seu objetivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Proteínas</span>
                <span className="text-sm text-muted-foreground">{profile.daily_protein}g</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Carboidratos</span>
                <span className="text-sm text-muted-foreground">{profile.daily_carbs}g</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Gorduras</span>
                <span className="text-sm text-muted-foreground">{profile.daily_fats}g</span>
              </div>
              <Progress value={30} className="h-2" />
            </div>
          </CardContent>
        </Card>
    </div>
  );
}