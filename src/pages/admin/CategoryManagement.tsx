
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/hooks/useAdminStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryForm } from '@/components/admin/CategoryForm';
import { DataTable } from "@/components/ui/data-table";

const CategoryManagement = () => {
  const navigate = useNavigate();
  const { categories, isLoadingCategories, deleteCategory, isDeletingCategory } = useAdminStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleCreateNew = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };
  
  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        setIsDeleting(true);
        await deleteCategory(deleteId);
        toast('Categoria excluída com sucesso');
      } catch (error) {
        console.error('Error deleting category:', error);
        toast('Erro ao excluir categoria. Certifique-se de que não existem exercícios ou produtos usando esta categoria.');
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };
  
  const columns = [
    {
      accessorKey: 'name',
      header: 'Nome'
    },
    {
      accessorKey: 'color',
      header: 'Cor',
      cell: ({ row }: { row: { original: any } }) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-full" 
            style={{ backgroundColor: row.original.color || '#ccc' }}
          />
          <span>{row.original.color || 'N/A'}</span>
        </div>
      )
    },
    {
      accessorKey: 'icon',
      header: 'Ícone',
      cell: ({ row }: { row: { original: any } }) => (
        row.original.icon ? row.original.icon : 'Sem ícone'
      )
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: { original: any } }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento de Categorias</h1>
        <Button onClick={handleCreateNew} className="bg-fitness-green hover:bg-fitness-green/80">
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>
      
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoadingCategories}
        />
      </div>
      
      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
      />
      
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A categoria será permanentemente excluída.
              Produtos e exercícios associados a esta categoria ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting || isDeletingCategory}
            >
              {isDeleting || isDeletingCategory ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoryManagement;
