import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAdminBlogPosts } from '@/hooks/useAdminBlogPosts';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import BlogPostForm from '@/components/admin/BlogPostForm';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BlogManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const {
    posts,
    isLoading,
    error,
    createPost,
    isCreating,
    updatePost,
    isUpdating,
    deletePost,
    isDeleting,
    togglePublish,
    isTogglingPublish,
  } = useAdminBlogPosts();

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedPostId(id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este post?')) {
      deletePost(id);
    }
  };

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
    togglePublish({ id, is_published: !currentStatus });
  };

  const selectedPost = selectedPostId
    ? posts.find((post) => post.id === selectedPostId)
    : null;

  const columns = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }: any) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }: any) => (
        <Badge variant="outline" style={{ backgroundColor: row.original.blog_categories?.color + '20' }}>
          {row.original.blog_categories?.name || 'Sem categoria'}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      accessorKey: 'content_type',
      header: 'Tipo',
      cell: ({ row }: any) => {
        const typeLabels: Record<string, string> = {
          article: 'Artigo',
          video: 'Vídeo',
          infographic: 'Infográfico',
          podcast: 'Podcast',
        };
        return <Badge variant="secondary">{typeLabels[row.original.content_type]}</Badge>;
      },
      hideOnMobile: true,
    },
    {
      accessorKey: 'views_count',
      header: 'Visualizações',
      cell: ({ row }: any) => (
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {row.original.views_count}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: ({ row }: any) => (
        <Button
          variant={row.original.is_published ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTogglePublish(row.original.id, row.original.is_published)}
          disabled={isTogglingPublish}
          className="gap-1"
        >
          {row.original.is_published ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Publicado</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Rascunho</span>
            </>
          )}
        </Button>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="px-2 sm:px-3"
          >
            <Link to={`/blog/${row.original.slug}`} target="_blank">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
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
          <h1 className="text-xl sm:text-2xl font-bold">Gerenciamento de Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {posts.length} post{posts.length !== 1 ? 's' : ''} • {posts.filter(p => p.is_published).length} publicado{posts.filter(p => p.is_published).length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handleCreate} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Novo Post
          </Button>
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link to="/admin/blog-categories">Categorias</Link>
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={posts} isLoading={isLoading} />

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Criar Novo Post</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <BlogPostForm
              onSubmit={(data) => {
                createPost(data);
                setIsCreateDialogOpen(false);
              }}
              isLoading={isCreating}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Post</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <BlogPostForm
                onSubmit={(data) => {
                  updatePost({
                    id: selectedPost.id,
                    ...data,
                  });
                  setIsEditDialogOpen(false);
                }}
                isLoading={isUpdating}
                initialData={selectedPost}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
