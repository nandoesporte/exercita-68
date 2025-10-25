import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  source: "local" | "openfoodfacts" | "edamam";
  serving_size?: string;
}

interface FoodSearchInputProps {
  onSelect: (food: FoodItem) => void;
  value: string;
  onChange: (value: string) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  local: "Base",
  openfoodfacts: "OFF",
  edamam: "Edamam",
};

export function FoodSearchInput({ onSelect, value, onChange }: FoodSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchFood = async (query: string): Promise<FoodItem[]> => {
    try {
      console.log(`Searching foods for: ${query}`);
      
      const { data, error } = await supabase.functions.invoke('search-food', {
        body: { q: query },
      });

      if (error) {
        console.error("Error calling search-food function:", error);
        // Fallback to empty if function fails
        return [];
      }

      // Check if we got a fallback response (error but with local data)
      if (data?.fallback) {
        console.log("Using fallback data from function");
        return data.results || [];
      }

      console.log(`Found ${data?.count || 0} results (cached: ${data?.cached || false})`);
      return data?.results || [];
    } catch (error) {
      console.error("Network error searching food:", error);
      // Return empty on network errors
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

    // Debounced search using the edge function
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchFood(value);
      setSuggestions(results);
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
                        {SOURCE_LABELS[food.source] || food.source}
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
