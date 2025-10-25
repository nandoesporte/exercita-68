import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  source: "local" | "openfoodfacts";
  serving_size?: string;
}

interface FoodSearchInputProps {
  onSelect: (food: FoodItem) => void;
  value: string;
  onChange: (value: string) => void;
}

const LOCAL_FOODS: FoodItem[] = [
  { id: "1", name: "Frango Grelhado", calories: 165, protein: 31, carbs: 0, fats: 3.6, source: "local", serving_size: "100g" },
  { id: "2", name: "Arroz Branco", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, source: "local", serving_size: "100g" },
  { id: "3", name: "Feijão Preto", calories: 132, protein: 8.9, carbs: 23, fats: 0.5, source: "local", serving_size: "100g" },
  { id: "4", name: "Batata Doce", calories: 86, protein: 1.6, carbs: 20, fats: 0.1, source: "local", serving_size: "100g" },
  { id: "5", name: "Ovo Cozido", calories: 155, protein: 13, carbs: 1.1, fats: 11, source: "local", serving_size: "1 unidade" },
  { id: "6", name: "Banana", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, source: "local", serving_size: "1 unidade" },
  { id: "7", name: "Aveia", calories: 389, protein: 16.9, carbs: 66, fats: 6.9, source: "local", serving_size: "100g" },
  { id: "8", name: "Peito de Peru", calories: 111, protein: 24, carbs: 0.7, fats: 1, source: "local", serving_size: "100g" },
  { id: "9", name: "Iogurte Grego Natural", calories: 59, protein: 10, carbs: 3.6, fats: 0.4, source: "local", serving_size: "100g" },
  { id: "10", name: "Salmão", calories: 208, protein: 20, carbs: 0, fats: 13, source: "local", serving_size: "100g" },
];

export function FoodSearchInput({ onSelect, value, onChange }: FoodSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchOpenFoodFacts = async (query: string): Promise<FoodItem[]> => {
    try {
      const response = await fetch(
        `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`
      );
      const data = await response.json();

      return (data.products || []).map((product: any) => ({
        id: product.code || Math.random().toString(),
        name: product.product_name_pt || product.product_name || "Produto sem nome",
        calories: Math.round(product.nutriments?.["energy-kcal_100g"] || 0),
        protein: product.nutriments?.proteins_100g || 0,
        carbs: product.nutriments?.carbohydrates_100g || 0,
        fats: product.nutriments?.fat_100g || 0,
        source: "openfoodfacts" as const,
        serving_size: "100g",
      })).filter((item: FoodItem) => item.calories > 0);
    } catch (error) {
      console.error("Erro ao buscar no Open Food Facts:", error);
      return [];
    }
  };

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setIsSearching(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Search local foods first
    const localResults = LOCAL_FOODS.filter((food) =>
      food.name.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions(localResults);

    // Debounced search on Open Food Facts
    searchTimeoutRef.current = setTimeout(async () => {
      if (value.length >= 3) {
        const externalResults = await searchOpenFoodFacts(value);
        setSuggestions([...localResults, ...externalResults]);
      }
      setIsSearching(false);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  const handleSelect = (food: FoodItem) => {
    onSelect(food);
    onChange(food.name);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Ex: Frango grelhado, banana..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && setIsOpen(true)}
          className="pl-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-hidden">
          <Command>
            <CommandList>
              <CommandGroup>
                {suggestions.map((food) => (
                  <CommandItem
                    key={food.id}
                    onSelect={() => handleSelect(food)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <div className="font-medium">{food.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {food.calories} kcal • P: {food.protein?.toFixed(1)}g • C: {food.carbs?.toFixed(1)}g • G:{" "}
                          {food.fats?.toFixed(1)}g
                        </div>
                        {food.serving_size && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Porção: {food.serving_size}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {food.source === "local" ? "Base" : "OFF"}
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {isSearching && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Buscando mais alimentos...
                </div>
              )}
            </CommandList>
          </Command>
        </div>
      )}

      {isOpen && value.length >= 2 && suggestions.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          Nenhum alimento encontrado
        </div>
      )}
    </div>
  );
}
