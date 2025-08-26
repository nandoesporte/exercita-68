
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/hooks/useAdminStore';
import { toast } from 'sonner';
import { ProductFilters } from '@/components/admin/ProductFilters';
import { ProductActions } from '@/components/admin/ProductActions';
import { ProductTable } from '@/components/admin/ProductTable';
import { Button } from '@/components/ui/button';
import { ListPlus } from 'lucide-react';

const ProductManagement = () => {
  const navigate = useNavigate();
  const { products, isLoadingProducts, deleteProduct, toggleFeaturedProduct } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    navigate('/admin/products/create');
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/products/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await toggleFeaturedProduct({ 
        id, 
        isFeatured: !currentStatus 
      });
      toast.success(currentStatus ? 'Produto removido dos destaques' : 'Produto adicionado aos destaques');
    } catch (error: any) {
      console.error('Erro ao atualizar status de destaque:', error);
      
      if (error.message?.includes('database update')) {
        toast.error('Esta funcionalidade requer uma atualização no banco de dados. Por favor, contate o administrador.');
      } else {
        toast.error('Erro ao atualizar status de destaque do produto');
      }
    }
  };

  const handleNavigateToCategories = () => {
    navigate('/admin/categories');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <ProductActions onCreateNew={handleCreateNew} />
        <Button
          variant="outline"
          onClick={handleNavigateToCategories}
          className="w-full md:w-auto"
        >
          <ListPlus className="mr-2 h-4 w-4" /> Gerenciar Categorias
        </Button>
      </div>
      
      <ProductFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <ProductTable 
        products={filteredProducts}
        isLoading={isLoadingProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleFeatured={handleToggleFeatured}
      />
    </div>
  );
};

export default ProductManagement;
