import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types/blog';
import { toast } from 'sonner';

export function useAdminBlogPosts() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (postData: any) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar post: ' + error.message);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...postData }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar post: ' + error.message);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir post: ' + error.message);
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const updateData: any = { 
        is_published,
        updated_at: new Date().toISOString()
      };
      
      if (is_published && !posts?.find(p => p.id === id)?.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  return {
    posts: posts || [],
    isLoading,
    error,
    createPost: createPost.mutate,
    isCreating: createPost.isPending,
    updatePost: updatePost.mutate,
    isUpdating: updatePost.isPending,
    deletePost: deletePost.mutate,
    isDeleting: deletePost.isPending,
    togglePublish: togglePublish.mutate,
    isTogglingPublish: togglePublish.isPending,
  };
}

export function useAdminBlogCategories() {
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['admin-blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createCategory = useMutation({
    mutationFn: async (categoryData: any) => {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...categoryData }: any) => {
      const { data, error } = await supabase
        .from('blog_categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir categoria: ' + error.message);
    },
  });

  return {
    categories: categories || [],
    isLoading,
    error,
    createCategory: createCategory.mutate,
    isCreating: createCategory.isPending,
    updateCategory: updateCategory.mutate,
    isUpdating: updateCategory.isPending,
    deleteCategory: deleteCategory.mutate,
    isDeleting: deleteCategory.isPending,
  };
}
