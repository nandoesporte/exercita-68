
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminStore } from '@/hooks/useAdminStore';
import ProductForm from '@/components/admin/ProductForm';
import { ProductFormData } from '@/types/store';
import { toast } from '@/lib/toast-wrapper';

const CreateProduct = () => {
  const navigate = useNavigate();
  const { 
    createProduct, 
    isCreating, 
    categories, 
    isLoadingCategories,
  } = useAdminStore();
  
  const handleCreateProduct = async (data: ProductFormData) => {
    try {
      console.log('Criando produto com dados:', data);
      await createProduct(data);
      toast('Produto criado com sucesso');
      navigate('/admin/products');
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast('Erro ao criar produto. Tente novamente.');
    }
  };

  const isLoading = isCreating || isLoadingCategories;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Criar Novo Produto</h1>
      </div>
      
      <div className="bg-card rounded-lg border border-border p-6">
        {isLoadingCategories ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <ProductForm 
            onSubmit={handleCreateProduct} 
            isLoading={isCreating}
            categories={categories || []}
            isEditing={false}
          />
        )}
      </div>
    </div>
  );
};

export default CreateProduct;
