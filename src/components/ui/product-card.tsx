
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Product } from '@/types/store';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const isMobile = useIsMobile();
  
  const handleBuyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!product.sale_url) {
      e.preventDefault();
      console.error('No sale URL provided for this product');
      return;
    }
  };

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden flex flex-col", className)}>
      {/* Product Image */}
      <Link to={`/store/${product.id}`} className="relative block h-36 md:h-48 overflow-hidden">
        <img 
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
        />
        {/* Badge for active status */}
        {product.is_active && (
          <span className="absolute top-2 right-2 md:top-3 md:right-3 bg-fitness-green/90 text-white text-xs px-2 py-1 rounded-full">
            Em Estoque
          </span>
        )}
      </Link>

      {/* Product Content */}
      <div className="flex flex-col flex-grow p-2 md:p-4 space-y-1 md:space-y-3">
        <Link to={`/store/${product.id}`}>
          <h3 className="font-semibold text-sm md:text-lg line-clamp-1">{product.name}</h3>
        </Link>
        
        {/* Category if available */}
        {product.categories && (
          <div className="text-xs text-muted-foreground hidden md:block">
            {product.categories.name}
          </div>
        )}
        
        {/* Description */}
        <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 md:line-clamp-2 flex-grow">
          {product.description}
        </p>
        
        {/* Price and Action */}
        <div className="flex items-center justify-between pt-1 md:pt-3 mt-auto">
          <span className="font-bold text-sm md:text-lg">
            {formatCurrency(product.price)}
          </span>
          
          <div className="flex gap-1 md:gap-2">
            <Button 
              asChild
              size={isMobile ? "sm" : "default"}
              variant="default"
              className="bg-fitness-green hover:bg-fitness-green/90 shadow-sm hover:shadow-md transition-all rounded-lg text-xs md:text-sm px-2 md:px-4"
              disabled={!product.sale_url}
            >
              <a 
                href={product.sale_url || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1"
                onClick={handleBuyClick}
              >
                Comprar
                <ExternalLink size={isMobile ? 12 : 14} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
