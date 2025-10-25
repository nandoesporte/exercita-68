import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Coffee, Sun, Moon, Apple } from "lucide-react";
import { useFoodDiary } from "@/hooks/useFoodDiary";
import { useNutritionProfile } from "@/hooks/useNutritionProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MealType } from "@/types/nutrition";

const MEAL_TYPES = [
  { value: "cafe" as const, label: "Café da Manhã", icon: Coffee },
  { value: "lanche_manha" as const, label: "Lanche da Manhã", icon: Apple },
  { value: "almoco" as const, label: "Almoço", icon: Sun },
  { value: "lanche_tarde" as const, label: "Lanche da Tarde", icon: Apple },
  { value: "jantar" as const, label: "Jantar", icon: Moon },
];

export function TodayTab() {
  const { profile } = useNutritionProfile();
  const { entries, isLoading, addEntry } = useFoodDiary();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | "">("");

  const [formData, setFormData] = useState({
    food_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    quantity: "",
  });

  const todayEntries = entries || [];
  const totalCalories = todayEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  const totalProtein = todayEntries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
  const totalCarbs = todayEntries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
  const totalFats = todayEntries.reduce((sum, entry) => sum + (entry.fats || 0), 0);

  const targetCalories = profile?.daily_calories || 2000;
  const targetProtein = profile?.daily_protein || 150;
  const targetCarbs = profile?.daily_carbs || 200;
  const targetFats = profile?.daily_fats || 60;

  const caloriesProgress = Math.min((totalCalories / targetCalories) * 100, 100);
  const proteinProgress = Math.min((totalProtein / targetProtein) * 100, 100);
  const carbsProgress = Math.min((totalCarbs / targetCarbs) * 100, 100);
  const fatsProgress = Math.min((totalFats / targetFats) * 100, 100);

  const handleSubmit = async () => {
    if (!selectedMealType || !formData.food_name || !formData.calories) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await addEntry.mutateAsync({
        meal_type: selectedMealType,
        food_name: formData.food_name,
        calories: parseFloat(formData.calories),
        protein: formData.protein ? parseFloat(formData.protein) : null,
        carbs: formData.carbs ? parseFloat(formData.carbs) : null,
        fats: formData.fats ? parseFloat(formData.fats) : null,
        quantity: formData.quantity || null,
      });

      toast.success("Refeição registrada com sucesso!");
      setIsDialogOpen(false);
      setFormData({ food_name: "", calories: "", protein: "", carbs: "", fats: "", quantity: "" });
      setSelectedMealType("");
    } catch (error) {
      toast.error("Erro ao registrar refeição");
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo de Calorias */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle>Hoje</CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calorias Principal */}
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold text-primary">{Math.round(totalCalories)}</div>
            <div className="text-sm text-muted-foreground">
              de {targetCalories} kcal ({Math.round(targetCalories - totalCalories)} restantes)
            </div>
            <Progress value={caloriesProgress} className="h-3 mt-4" />
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Proteínas</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(totalProtein)}g
              </div>
              <Progress value={proteinProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">{targetProtein}g meta</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Carboidratos</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(totalCarbs)}g
              </div>
              <Progress value={carbsProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">{targetCarbs}g meta</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Gorduras</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {Math.round(totalFats)}g
              </div>
              <Progress value={fatsProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">{targetFats}g meta</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Registro Rápido */}
      <Button onClick={() => setIsDialogOpen(true)} size="lg" className="w-full h-14 text-lg">
        <Plus className="w-5 h-5 mr-2" />
        Registrar Refeição
      </Button>

      {/* Refeições do Dia */}
      <div className="space-y-4">
        {MEAL_TYPES.map((meal) => {
          const Icon = meal.icon;
          const mealEntries = todayEntries.filter((e) => e.meal_type === meal.value);
          const mealCalories = mealEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

          return (
            <Card key={meal.value} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{meal.label}</CardTitle>
                  </div>
                  {mealCalories > 0 && (
                    <span className="text-sm font-semibold text-primary">{Math.round(mealCalories)} kcal</span>
                  )}
                </div>
              </CardHeader>
              {mealEntries.length > 0 && (
                <CardContent className="pt-0 space-y-2">
                  {mealEntries.map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center text-sm py-2 border-t">
                      <span className="font-medium">{entry.food_name}</span>
                      <span className="text-muted-foreground">{Math.round(entry.calories || 0)} kcal</span>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Dialog de Registro */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Refeição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Refeição</Label>
              <Select value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as MealType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((meal) => (
                    <SelectItem key={meal.value} value={meal.value}>
                      {meal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Alimento *</Label>
              <Input
                placeholder="Ex: Frango grelhado"
                value={formData.food_name}
                onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calorias (kcal) *</Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  placeholder="150g"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Proteína (g)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  placeholder="20"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={addEntry.isPending}>
              {addEntry.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
