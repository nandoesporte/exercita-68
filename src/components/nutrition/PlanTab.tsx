import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, Calendar, UtensilsCrossed, Settings, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMealPlanGenerator } from "@/hooks/useMealPlanGenerator";
import { useNutritionProfile } from "@/hooks/useNutritionProfile";
import { toast } from "sonner";

const WEEK_DAYS = [
  { day: "Segunda", meals: 4, calories: 2100 },
  { day: "Terça", meals: 4, calories: 2050 },
  { day: "Quarta", meals: 4, calories: 2000 },
  { day: "Quinta", meals: 4, calories: 2100 },
  { day: "Sexta", meals: 4, calories: 2050 },
  { day: "Sábado", meals: 3, calories: 1900 },
  { day: "Domingo", meals: 3, calories: 1850 },
];

const SAMPLE_MEALS = [
  { type: "Café da Manhã", name: "Omelete de Claras com Aveia", calories: 350, protein: 25, carbs: 35, fats: 8 },
  { type: "Almoço", name: "Frango Grelhado com Batata Doce", calories: 550, protein: 45, carbs: 50, fats: 12 },
  { type: "Lanche", name: "Iogurte Grego com Frutas", calories: 200, protein: 15, carbs: 25, fats: 5 },
  { type: "Jantar", name: "Salmão com Legumes", calories: 480, protein: 40, carbs: 30, fats: 18 },
];

export function PlanTab() {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const generateMealPlan = useMealPlanGenerator();
  const { profile } = useNutritionProfile();

  const handleGeneratePlan = async () => {
    if (!profile) {
      toast.error('Configure seu perfil nutricional primeiro');
      return;
    }

    try {
      await generateMealPlan.mutateAsync({
        user_profile: {
          peso_kg: profile.weight,
          altura_cm: profile.height,
          idade: profile.age,
          sexo: profile.gender === 'masculino' ? 'M' : 'F',
          atividade_fisica: profile.activity_level,
          objetivo: profile.goal,
        },
        calorias_alvo: profile.daily_calories || 2000,
        macros: {
          proteina: { gramas: profile.daily_protein || 150, percentual: 30 },
          carboidrato: { gramas: profile.daily_carbs || 200, percentual: 40 },
          gordura: { gramas: profile.daily_fats || 60, percentual: 30 },
        },
        restricoes: profile.restrictions || [],
        preferencias: [],
        refeicoes_por_dia: 4,
      });
      toast.success('Plano nutricional gerado com sucesso!');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao gerar plano nutricional');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Plano Semanal
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Seu plano personalizado de refeições
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Personalizar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar Plano Nutricional Personalizado</DialogTitle>
                  <DialogDescription>
                    Vamos criar um plano semanal de refeições baseado no seu perfil e objetivos nutricionais.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {profile && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p className="text-sm"><strong>Meta Diária:</strong> {profile.daily_calories} calorias</p>
                      <p className="text-sm"><strong>Proteína:</strong> {profile.daily_protein}g</p>
                      <p className="text-sm"><strong>Carboidratos:</strong> {profile.daily_carbs}g</p>
                      <p className="text-sm"><strong>Gorduras:</strong> {profile.daily_fats}g</p>
                    </div>
                  )}
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={generateMealPlan.isPending || !profile}
                    className="w-full"
                  >
                    {generateMealPlan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Gerar Plano Semanal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Dias */}
      <div className="space-y-3">
        {WEEK_DAYS.map((dayData) => (
          <Collapsible
            key={dayData.day}
            open={openDay === dayData.day}
            onOpenChange={(isOpen) => setOpenDay(isOpen ? dayData.day : null)}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dayData.day}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {dayData.meals} refeições • ~{dayData.calories} kcal
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-primary border-primary/30">
                        Ver Detalhes
                      </Badge>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          openDay === dayData.day ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3 border-t">
                  {SAMPLE_MEALS.map((meal, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-4 rounded-lg bg-card border hover:border-primary/30 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary">{meal.type}</span>
                        </div>
                        <h4 className="font-semibold">{meal.name}</h4>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>P: {meal.protein}g</span>
                          <span>C: {meal.carbs}g</span>
                          <span>G: {meal.fats}g</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{meal.calories}</div>
                        <div className="text-xs text-muted-foreground">kcal</div>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full mt-4">
                    Substituir Refeição
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
