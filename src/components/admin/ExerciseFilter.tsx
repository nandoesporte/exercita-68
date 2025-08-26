
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from 'lucide-react';

interface ExerciseFilterProps {
  categories: { id: string; name: string; color?: string; icon?: string; created_at?: string; updated_at?: string }[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ExerciseFilter({ 
  categories,
  searchTerm,
  onSearchChange
}: ExerciseFilterProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar exercícios..."
          className="pl-9"
        />
      </div>
    </div>
  );
}
