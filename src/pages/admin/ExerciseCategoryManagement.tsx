import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Dumbbell } from 'lucide-react';
import { DataTable } from "@/components/ui/data-table";
import { toast } from '@/lib/toast-wrapper';
import { useExerciseCategories } from '@/hooks/useExerciseCategories';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ExerciseCategory } from '@/hooks/useExerciseCategories';

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  color: z.string().regex(/^#([0-9A-F]{6}|[0-9A-F]{3})$/i, 'Deve ser um código de cor hexadecimal válido').optional(),
  icon: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

const ExerciseCategoryManagement = () => {
  const {
    categories,
    isLoadingCategories,
    createCategory,
    isCreatingCategory,
    updateCategory,
    isUpdatingCategory,
    deleteCategory,
    isDeletingCategory,
    createDefaultCategories,
  } = useExerciseCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExerciseCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#00CB7E',
      icon: '',
    },
  });

  const handleCreateNew = () => {
    setEditingCategory(null);
    form.reset({
      name: '',
      color: '#00CB7E',
      icon: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (category: ExerciseCategory) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      color: category.color || '#00CB7E',
      icon: category.icon || '',
    });
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
      } catch (error) {
        console.error('Error deleting category:', error);
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (editingCategory?.id) {
        await updateCategory({
          ...editingCategory,
          name: values.name,
          color: values.color,
          icon: values.icon,
        });
      } else {
        await createCategory({
          name: values.name,
          color: values.color || '#00CB7E',
          icon: values.icon || 'dumbbell',
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await createDefaultCategories();
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast.error('Erro ao criar categorias padrão');
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
      cell: ({ row }: { row: { original: ExerciseCategory } }) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-full border" 
            style={{ backgroundColor: row.original.color || '#ccc' }}
          />
          <span>{row.original.color || 'N/A'}</span>
        </div>
      )
    },
    {
      accessorKey: 'icon',
      header: 'Ícone',
      cell: ({ row }: { row: { original: ExerciseCategory } }) => (
        row.original.icon ? row.original.icon : 'Sem ícone'
      )
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: { original: ExerciseCategory } }) => (
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
        <h1 className="text-2xl font-bold">Categorias de Exercícios</h1>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button 
              onClick={handleCreateDefaults} 
              variant="outline"
              className="gap-2"
            >
              <Dumbbell className="h-4 w-4" />
              Criar Categorias Padrão
            </Button>
          )}
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoadingCategories}
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bíceps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <div className="flex gap-2">
                      <div 
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: field.value || '#00CB7E' }}
                      />
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do ícone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreatingCategory || isUpdatingCategory}
                >
                  {isCreatingCategory || isUpdatingCategory ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A categoria será permanentemente excluída.
              Exercícios associados a esta categoria ficarão sem categoria.
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

export default ExerciseCategoryManagement;