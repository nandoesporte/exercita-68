import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Calendar, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Modelo de Plano personalizado para Lipedema
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Para um Plano Personalizado Agende conosco
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/appointments">
                <Calendar className="w-4 h-4 mr-2" />
                Agendar
              </Link>
            </Button>
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
