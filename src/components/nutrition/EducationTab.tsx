import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, TrendingUp, Heart, Dumbbell, Brain } from "lucide-react";
import { RequestNutritionistCard } from "./RequestNutritionistCard";

const ARTICLES = [
  {
    id: 1,
    title: "Como Calcular Suas Necessidades Calóricas",
    category: "Básico",
    icon: TrendingUp,
    duration: "5 min",
    type: "article",
    excerpt: "Aprenda a calcular suas necessidades calóricas diárias com base em seu objetivo e nível de atividade.",
  },
  {
    id: 2,
    title: "Macronutrientes: Proteínas, Carboidratos e Gorduras",
    category: "Nutrição",
    icon: Heart,
    duration: "8 min",
    type: "article",
    excerpt: "Entenda a importância de cada macronutriente e como distribuí-los em sua dieta.",
  },
  {
    id: 3,
    title: "Nutrição para Ganho de Massa Muscular",
    category: "Avançado",
    icon: Dumbbell,
    duration: "12 min",
    type: "video",
    excerpt: "Estratégias nutricionais comprovadas para maximizar o ganho de massa muscular.",
  },
  {
    id: 4,
    title: "Hidratação e Performance",
    category: "Saúde",
    icon: Heart,
    duration: "6 min",
    type: "article",
    excerpt: "A importância da hidratação adequada para sua saúde e desempenho físico.",
  },
  {
    id: 5,
    title: "Alimentação Intuitiva: Ouvindo Seu Corpo",
    category: "Bem-estar",
    icon: Brain,
    duration: "10 min",
    type: "video",
    excerpt: "Desenvolva uma relação saudável com a comida através da alimentação intuitiva.",
  },
  {
    id: 6,
    title: "Suplementação: O Que Você Precisa Saber",
    category: "Avançado",
    icon: TrendingUp,
    duration: "15 min",
    type: "video",
    excerpt: "Guia completo sobre suplementação: quando, como e quais suplementos usar.",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Básico": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Nutrição": "bg-green-500/10 text-green-600 border-green-500/20",
  "Avançado": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "Saúde": "bg-red-500/10 text-red-600 border-red-500/20",
  "Bem-estar": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export function EducationTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Educação Nutricional
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Aprenda sobre nutrição e melhore seus hábitos alimentares
          </p>
        </CardHeader>
      </Card>

      {/* Card de Solicitação de Nutricionista */}
      <RequestNutritionistCard />

      {/* Lista de Artigos/Vídeos */}
      <div className="grid gap-4 md:grid-cols-2">
        {ARTICLES.map((article) => {
          const Icon = article.icon;
          return (
            <Card
              key={article.id}
              className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={CATEGORY_COLORS[article.category] || ""}
                    >
                      {article.category}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {article.type === "video" ? (
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <span>Vídeo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Artigo</span>
                    </div>
                  )}
                  <span>•</span>
                  <span>{article.duration}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
