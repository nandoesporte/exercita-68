import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFoodDiary } from "@/hooks/useFoodDiary";
import { useNutritionProfile } from "@/hooks/useNutritionProfile";

export function NutritionAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { entries } = useFoodDiary();
  const { profile } = useNutritionProfile();

  const todayEntries = entries || [];
  const totalCalories = todayEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  const targetCalories = profile?.daily_calories || 2000;
  const remainingCalories = targetCalories - totalCalories;

  const getSuggestion = () => {
    if (remainingCalories > 1500) {
      return {
        title: "Ainda há muito espaço para suas refeições!",
        message: "Você consumiu apenas uma pequena parte das suas calorias diárias. Que tal um almoço balanceado com proteínas e carboidratos complexos?",
        recipes: ["Frango Grelhado com Batata Doce", "Salmão com Quinoa"],
      };
    } else if (remainingCalories > 500) {
      return {
        title: "No caminho certo!",
        message: `Você tem ${Math.round(remainingCalories)} calorias restantes. Uma refeição leve seria ideal para fechar o dia.`,
        recipes: ["Salada com Atum", "Omelete de Claras"],
      };
    } else if (remainingCalories > 0) {
      return {
        title: "Quase lá!",
        message: `Apenas ${Math.round(remainingCalories)} calorias restantes. Um lanche leve seria perfeito!`,
        recipes: ["Iogurte Grego com Frutas", "Mix de Castanhas"],
      };
    } else {
      return {
        title: "Meta atingida!",
        message: "Você atingiu sua meta calórica do dia. Continue mantendo uma alimentação balanceada!",
        recipes: [],
      };
    }
  };

  const suggestion = getSuggestion();

  return (
    <>
      {/* Botão Flutuante */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow relative"
        >
          <Bot className="h-6 w-6" />
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </Button>
      </motion.div>

      {/* Card de Sugestões */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-md"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="shadow-2xl border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    Assistente Nutricional
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">{suggestion.title}</h4>
                  <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                </div>

                {suggestion.recipes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sugestões de receitas:</p>
                    <div className="space-y-2">
                      {suggestion.recipes.map((recipe, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left h-auto py-3"
                          >
                            <div>
                              <div className="font-medium">{recipe}</div>
                              <div className="text-xs text-muted-foreground">
                                Clique para ver a receita completa
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    Dica personalizada baseada no seu consumo de hoje
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
