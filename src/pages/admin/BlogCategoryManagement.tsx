import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAdminBlogCategories } from '@/hooks/useAdminBlogPosts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const BlogCategoryManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const {
    categories,
    isLoading,
    error,
    createCategory,
    isCreating,
    updateCategory,
    isUpdating,
    deleteCategory,
    isDeleting,
  } = useAdminBlogCategories();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#9333ea',
    icon: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#9333ea',
      icon: '',
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color,
        icon: category.icon || '',
      });
      setSelectedCategoryId(id);
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategory(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditDialogOpen && selectedCategoryId) {
      updateCategory({ id: selectedCategoryId, ...formData });
      setIsEditDialogOpen(false);
    } else {
      createCategory(formData);
      setIsCreateDialogOpen(false);
    }
    resetForm();
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    // Auto-generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData((prev) => ({ ...prev, slug }));
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: row.original.color }}
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.slug}</Badge>
      ),
      hideOnMobile: true,
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }: any) => (
        <p className="text-sm text-muted-foreground truncate max-w-xs">
          {row.original.description || '-'}
        </p>
      ),
      hideOnMobile: true,
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original.id)}
            className="px-2 sm:px-3"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={isDeleting}
            className="px-2 sm:px-3"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-4 bg-destructive/20 rounded-md">
        <p className="text-destructive">Erro: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-2">
            <Link to="/admin/blog">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para Posts
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Categorias do Blog</h1>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <DataTable columns={columns} data={categories} isLoading={isLoading} />

      {/* Create/Edit Category Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-[500px] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isEditDialogOpen ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#9333ea"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCreating || isUpdating}
              className="w-full"
            >
              {isEditDialogOpen ? 'Atualizar' : 'Criar'} Categoria
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogCategoryManagement;
