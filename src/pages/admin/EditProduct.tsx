
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminStore } from '@/hooks/useAdminStore';
import ProductForm from '@/components/admin/ProductForm';
import { ProductFormData } from '@/types/store';
import { Product } from '@/types/store';
import { toast } from '@/lib/toast-wrapper';

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    fetchProduct, 
    updateProduct, 
    isUpdating, 
    categories, 
    isLoadingCategories 
  } = useAdminStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData | null>(null);
  const [isDataFetched, setIsDataFetched] = useState(false);

  useEffect(() => {
    // Evitar múltiplas chamadas se os dados já foram buscados
    if (isDataFetched) {
      return;
    }

    const loadProduct = async () => {
      if (!id) {
        setError('ID do produto não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Loading product data for ID:', id);
        const data = await fetchProduct(id);
        console.log('Product data loaded:', data);
        setProduct(data);
        
        // Prepare form data once, not on every render
        const preparedFormData: ProductFormData = {
          name: data.name,
          description: data.description || '',
          price: data.price,
          image_url: data.image_url || '',
          sale_url: data.sale_url || '',
          category_id: data.category_id || null,
          is_active: data.is_active,
          is_featured: data.is_featured // Make sure this is included
        };
        
        setFormData(preparedFormData);
        setIsLoading(false);
        setIsDataFetched(true);
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
        setError('Não foi possível carregar o produto');
        setIsLoading(false);
        setIsDataFetched(true);
      }
    };

    loadProduct();
  }, [id, fetchProduct, isDataFetched]);

  const handleSubmit = async (data: ProductFormData) => {
    if (!id) return;
    
    try {
      console.log('Submitting product update:', data);
      await updateProduct({
        id,
        ...data
      });
      
      toast('Produto atualizado com sucesso');
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast('Erro ao atualizar produto. Tente novamente.');
    }
  };

  if (isLoading || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product || !formData) {
    return (
      <div className="p-6 bg-card rounded-lg border border-border text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">
          Erro ao carregar produto
        </h2>
        <p className="text-muted-foreground mb-4">{error || 'Produto não encontrado'}</p>
        <button 
          onClick={() => navigate('/admin/products')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Editar Produto</h1>
      </div>
      
      <div className="bg-card rounded-lg border border-border p-6">
        <ProductForm 
          onSubmit={handleSubmit} 
          isLoading={isUpdating}
          defaultValues={formData}
          categories={categories}
          isEditing={true}
        />
      </div>
    </div>
  );
};

export default EditProduct;
