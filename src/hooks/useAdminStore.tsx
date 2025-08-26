
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory, ProductFormData } from '@/types/store';
import { toast } from '@/lib/toast-wrapper';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

export const useAdminStore = () => {
  const queryClient = useQueryClient();
  const { adminId, isSuperAdmin, hasPermission } = useAdminPermissionsContext();

  // Fetch all products (admin)
  const { 
    data: products = [], 
    isLoading: isLoadingProducts 
  } = useQuery({
    queryKey: ['admin-products', adminId],
    queryFn: async () => {
      if (!hasPermission('manage_products')) {
        throw new Error('Você não tem permissão para gerenciar produtos');
      }

      console.log('Fetching admin products');
      let query = supabase
        .from('products')
        .select('*, categories:product_categories(name)')
        .order('created_at', { ascending: false });

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        query = query.eq('admin_id', adminId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        toast('Erro ao carregar produtos');
        return [];
      }

      // Map database fields to our Product interface with proper type safety
      return (data || []).map(item => {
        // Create a properly typed product object
        const product: Product = {
          id: item.id,
          name: item.name,
          description: item.description || null,
          price: item.price,
          image_url: item.image_url || null,
          is_active: item.is_active === undefined ? true : item.is_active,
          is_featured: item.is_featured === undefined ? false : item.is_featured,
          created_at: item.created_at,
          updated_at: item.updated_at,
          sale_url: item.sale_url || '',
          category_id: item.category_id || null,
          // Categories is populated since we're fetching it
          categories: item.categories ? { name: (item.categories as any).name } : null
        };
        return product;
      });
    },
    enabled: hasPermission('manage_products') && !!adminId,
  });

  // Fetch a specific product with cacheTime and staleTime to prevent repeated requests
  const fetchProduct = async (id: string): Promise<Product> => {
    console.log('Fetching product with ID:', id);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories:product_categories(name)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      toast('Erro ao carregar produto');
      throw error;
    }

    console.log('Product data received:', data);
    
    // Map database fields to our Product interface with proper type safety
    const product: Product = {
      id: data.id,
      name: data.name,
      description: data.description || null,
      price: data.price,
      image_url: data.image_url || null,
      is_active: data.is_active === undefined ? true : data.is_active,
      is_featured: data.is_featured === undefined ? false : data.is_featured,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sale_url: data.sale_url || '',
      category_id: data.category_id || null,
      // Categories is populated since we're fetching it
      categories: data.categories ? { name: (data.categories as any).name } : null
    };
    
    return product;
  };

  // Fetch product categories
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories 
  } = useQuery({
    queryKey: ['admin-product-categories', adminId],
    queryFn: async () => {
      if (!hasPermission('manage_categories') && !hasPermission('manage_products')) {
        throw new Error('Você não tem permissão para gerenciar categorias');
      }

      let query = supabase
        .from('product_categories')
        .select('*')
        .order('name');

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        query = query.eq('admin_id', adminId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching categories:', error);
        toast('Erro ao carregar categorias');
        return [];
      }

      return data as ProductCategory[];
    },
    enabled: (hasPermission('manage_categories') || hasPermission('manage_products')) && !!adminId,
  });

  // Create a category
  const { mutateAsync: createCategory, isPending: isCreatingCategory } = useMutation({
    mutationFn: async (categoryData: Omit<ProductCategory, 'id'>) => {
      const { data, error } = await supabase
        .from('product_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        toast('Erro ao criar categoria');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-categories'] });
    }
  });

  // Update a category
  const { mutateAsync: updateCategory, isPending: isUpdatingCategory } = useMutation({
    mutationFn: async (category: ProductCategory) => {
      const { data, error } = await supabase
        .from('product_categories')
        .update({
          name: category.name,
          color: category.color,
          icon: category.icon
        })
        .eq('id', category.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        toast('Erro ao atualizar categoria');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-categories'] });
    }
  });

  // Delete a category
  const { mutateAsync: deleteCategory, isPending: isDeletingCategory } = useMutation({
    mutationFn: async (id: string) => {
      try {
        // First update any products using this category to set category_id to null
        const { error: productsError } = await supabase
          .from('products')
          .update({ category_id: null })
          .eq('category_id', id);
          
        if (productsError) {
          console.error('Error updating products:', productsError);
          throw productsError;
        }
        
        // Then update any exercises using this category to set category_id to null
        const { error: exercisesError } = await supabase
          .from('exercises')
          .update({ category_id: null })
          .eq('category_id', id);
          
        if (exercisesError) {
          console.error('Error updating exercises:', exercisesError);
          throw exercisesError;
        }
        
        // Finally, delete the category
        const { error } = await supabase
          .from('product_categories')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting category:', error);
          throw error;
        }

        return id;
      } catch (error) {
        console.error('Error in delete operation:', error);
        toast('Erro ao excluir categoria');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  });

  // Create a product
  const { mutateAsync: createProduct, isPending: isCreating } = useMutation({
    mutationFn: async (product: ProductFormData) => {
      console.log('Saving product to database:', product);
      
      // Convert ProductFormData to match the database columns
      const dbProduct = {
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        sale_url: product.sale_url,
        is_active: product.is_active,
        is_featured: product.is_featured,
        category_id: product.category_id === '' ? null : product.category_id
      };

      console.log('Database product object to create:', dbProduct);

      const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        toast('Erro ao criar produto');
        throw error;
      }

      console.log('Product created successfully:', data);
      
      toast('Produto criado com sucesso');

      // Map database fields to our Product interface
      const newProduct: Product = {
        id: data.id,
        name: data.name,
        description: data.description || null,
        price: data.price,
        image_url: data.image_url || null,
        is_active: data.is_active === undefined ? true : data.is_active,
        is_featured: data.is_featured === undefined ? false : data.is_featured,
        created_at: data.created_at,
        updated_at: data.updated_at,
        sale_url: data.sale_url || '',
        category_id: data.category_id || null,
        categories: null // New product might not have categories loaded
      };
      
      return newProduct;
    },
    onSuccess: () => {
      console.log('Invalidating queries after product creation');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Update a product
  const { mutateAsync: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...product }: ProductFormData & { id: string }) => {
      console.log('Updating product with ID:', id);
      console.log('Update data:', product);
      
      // Convert ProductFormData to match the database columns
      const dbProduct = {
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        sale_url: product.sale_url,
        is_active: product.is_active,
        is_featured: product.is_featured,
        category_id: product.category_id === '' ? null : product.category_id
      };

      console.log('Database product object to update:', dbProduct);

      const { data, error } = await supabase
        .from('products')
        .update(dbProduct)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating product:', error);
        toast('Erro ao atualizar produto');
        throw error;
      }

      console.log('Product updated successfully:', data);
      
      toast('Produto atualizado com sucesso');

      // Map database fields to our Product interface
      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        description: data.description || null,
        price: data.price,
        image_url: data.image_url || null,
        is_active: data.is_active === undefined ? true : data.is_active,
        is_featured: data.is_featured === undefined ? false : data.is_featured,
        created_at: data.created_at,
        updated_at: data.updated_at,
        sale_url: data.sale_url || '',
        category_id: data.category_id || null,
        categories: null // Updated product might not have categories loaded
      };
      
      return updatedProduct;
    },
    onSuccess: () => {
      console.log('Invalidating queries after product update');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Delete a product
  const { mutateAsync: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        toast('Erro ao excluir produto');
        throw error;
      }

      toast('Produto excluído com sucesso');

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Toggle product featured status - Fix the type issue here
  const { mutateAsync: toggleFeaturedProduct } = useMutation({
    // Use a proper parameter object to match TanStack Query's expected signature
    mutationFn: async (params: { id: string; isFeatured: boolean }) => {
      const { id, isFeatured } = params;
      
      console.log(`Toggling featured status for product ${id} to ${isFeatured}`);
      
      try {
        // Try to update the product's is_featured status
        const { data, error } = await supabase
          .from('products')
          .update({ 
            is_featured: isFeatured, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          // Check if error is because column doesn't exist
          if (error.message?.includes('column') && error.message?.includes('does not exist')) {
            console.error('The is_featured column does not exist:', error);
            throw new Error('The featured product functionality requires a database update. Please contact the administrator.');
          } else {
            console.error('Error toggling featured status:', error);
            throw error;
          }
        }

        return data;
      } catch (error) {
        console.error('Error in toggleFeaturedProduct:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products,
    isLoadingProducts,
    fetchProduct,
    categories,
    isLoadingCategories,
    createCategory,
    isCreatingCategory,
    updateCategory,
    isUpdatingCategory,
    deleteCategory,
    isDeletingCategory,
    createProduct,
    isCreating,
    updateProduct,
    isUpdating,
    deleteProduct,
    isDeleting,
    toggleFeaturedProduct,
  };
};
