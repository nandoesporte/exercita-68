import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { Search, FileText, Video, Image, Mic, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface BlogFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  selectedContentType: string | null;
  onContentTypeChange: (type: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const contentTypes = [
  { value: 'article', label: 'Artigos', icon: FileText },
  { value: 'video', label: 'Vídeos', icon: Video },
  { value: 'infographic', label: 'Infográficos', icon: Image },
  { value: 'podcast', label: 'Podcasts', icon: Mic },
];

export function BlogFilters({
  selectedCategory,
  onCategoryChange,
  selectedContentType,
  onContentTypeChange,
  searchQuery,
  onSearchChange,
}: BlogFiltersProps) {
  const { data: categories = [] } = useBlogCategories();

  const hasActiveFilters = selectedCategory || selectedContentType || searchQuery;

  const clearAllFilters = () => {
    onCategoryChange(null);
    onContentTypeChange(null);
    onSearchChange('');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Buscar conteúdo..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card/50 backdrop-blur border-border/50"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => onSearchChange('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-turquoise hover:text-turquoise/80"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Content Type Filters */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Tipo de Conteúdo</h3>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map(({ value, label, icon: Icon }) => (
            <Badge
              key={value}
              variant={selectedContentType === value ? 'default' : 'outline'}
              className={`cursor-pointer transition-all ${
                selectedContentType === value
                  ? 'bg-turquoise hover:bg-turquoise/80 text-white'
                  : 'hover:border-turquoise hover:text-turquoise'
              }`}
              onClick={() =>
                onContentTypeChange(selectedContentType === value ? null : value)
              }
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Categorias</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const IconComponent = category.icon 
              ? (LucideIcons[category.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
              : null;

            return (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className="cursor-pointer transition-all"
                style={
                  selectedCategory === category.id
                    ? {
                        backgroundColor: category.color,
                        borderColor: category.color,
                        color: 'white',
                      }
                    : {
                        borderColor: category.color + '50',
                        color: category.color,
                      }
                }
                onClick={() =>
                  onCategoryChange(selectedCategory === category.id ? null : category.id)
                }
              >
                {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
                {category.name}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
