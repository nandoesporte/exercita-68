import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types/blog';

export function useBlogRecommendations(currentPostId?: string) {
  return useQuery({
    queryKey: ['blog-recommendations', currentPostId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get user's reading history
      const { data: interactions } = await supabase
        .from('user_blog_interactions')
        .select('post_id, blog_posts!inner(category_id, tags)')
        .eq('user_id', user.id)
        .eq('is_read', true)
        .order('read_at', { ascending: false })
        .limit(10);

      if (!interactions || interactions.length === 0) {
        // If no history, return popular posts
        const { data: popularPosts } = await supabase
          .from('blog_posts')
          .select('*, blog_categories(*)')
          .eq('is_published', true)
          .neq('id', currentPostId || '')
          .order('views_count', { ascending: false })
          .limit(3);

        return popularPosts as BlogPost[];
      }

      // Analyze user preferences
      const categoryPreferences = new Map<string, number>();
      const tagPreferences = new Map<string, number>();

      interactions.forEach((interaction: any) => {
        const post = interaction.blog_posts;
        
        // Count category preferences
        if (post.category_id) {
          categoryPreferences.set(
            post.category_id,
            (categoryPreferences.get(post.category_id) || 0) + 1
          );
        }

        // Count tag preferences
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            tagPreferences.set(tag, (tagPreferences.get(tag) || 0) + 1);
          });
        }
      });

      // Get most preferred categories (top 3)
      const topCategories = Array.from(categoryPreferences.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([categoryId]) => categoryId);

      // Get posts from preferred categories
      let query = supabase
        .from('blog_posts')
        .select('*, blog_categories(*)')
        .eq('is_published', true)
        .neq('id', currentPostId || '');

      if (topCategories.length > 0) {
        query = query.in('category_id', topCategories);
      }

      const { data: recommendedPosts, error } = await query
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Score and sort recommendations
      const scoredPosts = (recommendedPosts || []).map((post: any) => {
        let score = 0;

        // Category match score
        if (post.category_id && categoryPreferences.has(post.category_id)) {
          score += categoryPreferences.get(post.category_id)! * 10;
        }

        // Tag match score
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tagPreferences.has(tag)) {
              score += tagPreferences.get(tag)! * 5;
            }
          });
        }

        // Recency score
        const daysAgo = Math.floor(
          (Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        score += Math.max(0, 30 - daysAgo);

        return { ...post, score };
      });

      // Return top 3 recommendations
      return scoredPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3) as BlogPost[];
    },
    enabled: true,
  });
}
