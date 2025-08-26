
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const ProductFilters = ({ searchTerm, setSearchTerm }: ProductFiltersProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input 
        placeholder="Buscar produtos..." 
        className="pl-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};
