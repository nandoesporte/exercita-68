
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory } from '@/types/store';

export const useStore = () => {
  // Fetch featured products with error handling for missing column
  const { 
    data: featuredProducts = [], 
    isLoading: isLoadingFeaturedProducts 
  } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      try {
        // Try to fetch products with is_featured=true
        const { data, error } = await supabase
          .from('products')
          .select('*, categories:product_categories(name)')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching featured products:', error);
          
          // If the column doesn't exist, fall back to regular products
          if (error.message?.includes('column') && error.message?.includes('does not exist')) {
            console.log('The is_featured column does not exist yet, falling back to regular products');
            
            const { data: regularProducts, error: regularError } = await supabase
              .from('products')
              .select('*, categories:product_categories(name)')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(6);
            
            if (regularError) {
              throw regularError;
            }
            
            return regularProducts as Product[];
          }
          
          throw error;
        }

        return data as Product[];
      } catch (error) {
        console.error('Error in featuredProducts query:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch all products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts 
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories:product_categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return data as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch product categories
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories 
  } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data as ProductCategory[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch a single product
  const fetchProduct = async (id: string): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories:product_categories(name)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data as Product;
  };

  return {
    featuredProducts,
    isLoadingFeaturedProducts,
    products,
    isLoadingProducts,
    categories,
    isLoadingCategories,
    fetchProduct,
  };
};
