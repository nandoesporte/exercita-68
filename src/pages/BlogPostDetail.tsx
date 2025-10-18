import { useParams, useNavigate } from 'react-router-dom';
import { useBlogPost, useToggleSavePost, useMarkAsRead, useUserBlogInteractions } from '@/hooks/useBlogPosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Clock, Eye, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading } = useBlogPost(slug!);
  const markAsRead = useMarkAsRead();
  const toggleSave = useToggleSavePost();
  const { data: interactions } = useUserBlogInteractions();

  const interaction = interactions?.find(i => i.post_id === post?.id);
  const isSaved = interaction?.is_saved || false;

  useEffect(() => {
    if (post && !interaction?.is_read) {
      markAsRead.mutate(post.id);
    }
  }, [post?.id]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || '',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/blog')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Conteúdo não encontrado</p>
        <Button className="mt-4" onClick={() => navigate('/blog')}>
          Voltar para o Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/blog')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative h-96 rounded-lg overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {post.blog_categories && (
            <Badge
              style={{
                backgroundColor: post.blog_categories.color + '20',
                color: post.blog_categories.color,
                borderColor: post.blog_categories.color,
              }}
            >
              {post.blog_categories.name}
            </Badge>
          )}
          {post.content_type !== 'article' && (
            <Badge variant="outline">{post.content_type}</Badge>
          )}
        </div>

        <h1 className="text-4xl font-bold">{post.title}</h1>

        {post.excerpt && (
          <p className="text-xl text-muted-foreground">{post.excerpt}</p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {post.published_at && (
            <span>
              {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
          )}
          {post.reading_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{post.reading_time} min de leitura</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{post.views_count} visualizações</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={isSaved ? 'default' : 'outline'}
            onClick={() => toggleSave.mutate({ postId: post.id, isSaved: !isSaved })}
            className={isSaved ? 'bg-turquoise hover:bg-turquoise/80' : ''}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 mr-2" />
                Salvo
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Media Content */}
      {post.media_url && post.content_type === 'video' && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={post.media_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {post.media_url && post.content_type === 'podcast' && (
        <audio controls className="w-full">
          <source src={post.media_url} />
          Seu navegador não suporta o elemento de áudio.
        </audio>
      )}

      {/* Content */}
      <div 
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
