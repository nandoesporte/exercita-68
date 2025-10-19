import { useSavedPosts } from '@/hooks/useBlogPosts';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BookmarkCheck, BookOpen } from 'lucide-react';

export default function SavedPosts() {
  const { data: savedPosts, isLoading } = useSavedPosts();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <BookmarkCheck className="w-8 h-8 text-turquoise" />
          <h1 className="text-3xl font-bold">Posts Salvos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!savedPosts || savedPosts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <BookmarkCheck className="w-8 h-8 text-turquoise" />
          <h1 className="text-3xl font-bold">Posts Salvos</h1>
        </div>
        <div className="text-center py-12 space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg text-muted-foreground">
              Você ainda não salvou nenhum post
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Navegue pelo blog e salve conteúdos interessantes para ler depois
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <BookmarkCheck className="w-8 h-8 text-turquoise" />
        <div>
          <h1 className="text-3xl font-bold">Posts Salvos</h1>
          <p className="text-muted-foreground">
            {savedPosts.length} {savedPosts.length === 1 ? 'post salvo' : 'posts salvos'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedPosts.map(post => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
