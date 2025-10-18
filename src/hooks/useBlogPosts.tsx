import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types/blog';
import { toast } from 'sonner';

export function useBlogPosts(
  categoryId?: string,
  contentType?: string,
  searchQuery?: string
) {
  return useQuery({
    queryKey: ['blog-posts', categoryId, contentType, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*, blog_categories(*)')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Increment view count
      if (data) {
        await supabase
          .from('blog_posts')
          .update({ views_count: data.views_count + 1 })
          .eq('id', data.id);
      }

      return data as BlogPost;
    },
    enabled: !!slug,
  });
}

export function useToggleSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: existing } = await supabase
        .from('user_blog_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_blog_interactions')
          .update({
            is_saved: isSaved,
            saved_at: isSaved ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_blog_interactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            is_saved: isSaved,
            saved_at: isSaved ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-blog-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      toast.success(variables.isSaved ? 'Post salvo!' : 'Post removido dos salvos');
    },
    onError: () => {
      toast.error('Erro ao salvar post');
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: existing } = await supabase
        .from('user_blog_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_blog_interactions')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_blog_interactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            is_read: true,
            read_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-blog-interactions'] });
    },
  });
}

export function useUserBlogInteractions() {
  return useQuery({
    queryKey: ['user-blog-interactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_blog_interactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
  });
}

export function useSavedPosts() {
  return useQuery({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_blog_interactions')
        .select('post_id, blog_posts(*, blog_categories(*))')
        .eq('user_id', user.id)
        .eq('is_saved', true);

      if (error) throw error;
      return data.map(item => item.blog_posts).filter(Boolean) as BlogPost[];
    },
  });
}
