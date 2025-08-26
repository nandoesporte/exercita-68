
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminStore } from '@/hooks/useAdminStore';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCategory } from '@/types/store';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  color: z.string().regex(/^#([0-9A-F]{6}|[0-9A-F]{3})$/i, 'Deve ser um código de cor hexadecimal válido').optional(),
  icon: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ProductCategory | null;
}

export const CategoryForm = ({ open, onOpenChange, category }: CategoryFormProps) => {
  const { createCategory, updateCategory, isCreatingCategory, isUpdatingCategory } = useAdminStore();
  const isLoading = isCreatingCategory || isUpdatingCategory;
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#00CB7E',
      icon: '',
    },
  });
  
  useEffect(() => {
    if (category) {
      form.reset({
        id: category.id,
        name: category.name,
        color: category.color || '#00CB7E',
        icon: category.icon || '',
      });
    } else {
      form.reset({
        name: '',
        color: '#00CB7E',
        icon: '',
      });
    }
  }, [category, form]);
  
  

  const onSubmit = async (values: CategoryFormValues) => {
    try {
        if (category?.id) {
          // Ensure name is provided when updating
          if (!values.name) {
            toast('Nome da categoria é obrigatório');
            return;
          }
          
          updateCategory({
          id: category.id,
          name: values.name, // Required field
          color: values.color,
          icon: values.icon,
        });
        toast('Categoria atualizada com sucesso');
      } else {
        // Ensure name is provided when creating
        if (!values.name) {
          toast('Nome da categoria é obrigatório');
          return;
        }
        
        createCategory({
          name: values.name, // Required field
          color: values.color,
          icon: values.icon,
        });
        toast('Categoria criada com sucesso');
      }
      onOpenChange(false);
      } catch (error) {
        console.error('Error saving category:', error);
        toast('Erro ao salvar categoria.');
      }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoria' : 'Nova Categoria'}
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
                    <Input placeholder="Ex: Suplementos" {...field} />
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
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-fitness-green hover:bg-fitness-green/80"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
