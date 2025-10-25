import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, Flame, ChefHat } from "lucide-react";
import { useRecipes } from "@/hooks/useRecipes";
import { Skeleton } from "@/components/ui/skeleton";

const DIFFICULTY_COLORS = {
  facil: "bg-green-500/10 text-green-600 border-green-500/20",
  medio: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  dificil: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function RecipesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { data: recipes, isLoading } = useRecipes();

  const allTags = recipes
    ? Array.from(new Set(recipes.flatMap((r) => r.tags || [])))
    : [];

  const filteredRecipes = recipes?.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 || selectedTags.some((tag) => recipe.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">
      {/* Busca e Filtros */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Biblioteca de Receitas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar receitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Filtrar por tags:</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Receitas */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : filteredRecipes && filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              {recipe.image_url && (
                <div className="h-48 overflow-hidden bg-accent/5">
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg line-clamp-1">{recipe.name}</h3>
                  {recipe.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  {recipe.prep_time && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.prep_time + (recipe.cook_time || 0)}min</span>
                    </div>
                  )}
                  {recipe.calories_per_serving && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Flame className="w-4 h-4" />
                      <span>{Math.round(recipe.calories_per_serving)} kcal</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {recipe.difficulty && (
                      <Badge
                        variant="outline"
                        className={DIFFICULTY_COLORS[recipe.difficulty as keyof typeof DIFFICULTY_COLORS] || ""}
                      >
                        {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver Receita
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhuma receita encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
