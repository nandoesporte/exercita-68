
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { ProductCard } from '@/components/ui/product-card';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

const Store = () => {
  const { products, isLoadingProducts, categories, featuredProducts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Get categories that have at least one product
  const categoriesWithProducts = useMemo(() => {
    // Create a set of category IDs that have products
    const categoryIdsWithProducts = new Set(
      products
        .map(product => product.category_id)
        .filter(id => id !== null) as string[]
    );
    
    // Filter the categories list to only include those with products
    return categories.filter(category => categoryIdsWithProducts.has(category.id));
  }, [products, categories]);

  // Filtragem de produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Seção de Destaque */}
      {featuredProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 text-fitness-green">Produtos em Destaque</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Barra de pesquisa e filtros */}
      <section className="bg-fitness-darkGray/30 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Pesquisar produtos..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-fitness-green text-white'
                  : 'bg-fitness-darkGray/50 hover:bg-fitness-darkGray/80'
              }`}
            >
              Todos
            </button>
            {categoriesWithProducts.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-fitness-green text-white'
                    : 'bg-fitness-darkGray/50 hover:bg-fitness-darkGray/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lista de produtos */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>
        
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[400px] rounded-lg bg-fitness-darkGray/20 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-fitness-darkGray/20 rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">
              Nenhum produto encontrado
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente ajustar seus filtros ou termos de pesquisa.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Store;
