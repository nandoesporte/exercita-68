import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/types/blog';
import { Clock, Bookmark, BookmarkCheck, Play, Image, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToggleSavePost, useUserBlogInteractions } from '@/hooks/useBlogPosts';

interface BlogPostCardProps {
  post: BlogPost;
}

const contentTypeIcons = {
  article: null,
  video: Play,
  infographic: Image,
  podcast: Mic,
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  const navigate = useNavigate();
  const toggleSave = useToggleSavePost();
  const { data: interactions } = useUserBlogInteractions();
  
  const interaction = interactions?.find(i => i.post_id === post.id);
  const isSaved = interaction?.is_saved || false;

  const ContentIcon = contentTypeIcons[post.content_type];

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave.mutate({ postId: post.id, isSaved: !isSaved });
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-card/50 backdrop-blur border-border/50"
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      {post.featured_image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {ContentIcon && (
            <div className="absolute top-3 right-3 bg-turquoise/90 text-white p-2 rounded-full">
              <ContentIcon className="w-5 h-5" />
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            {post.blog_categories && (
              <Badge 
                className="mb-2"
                style={{ 
                  backgroundColor: post.blog_categories.color + '20',
                  color: post.blog_categories.color,
                  borderColor: post.blog_categories.color
                }}
              >
                {post.blog_categories.name}
              </Badge>
            )}
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-turquoise transition-colors">
              {post.title}
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSaveToggle}
            className="shrink-0"
          >
            {isSaved ? (
              <BookmarkCheck className="w-5 h-5 text-turquoise fill-turquoise" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </Button>
        </div>

        {post.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {post.reading_time && post.content_type === 'article' && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{post.reading_time} min</span>
            </div>
          )}
          {post.media_duration && post.content_type !== 'article' && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.floor(post.media_duration / 60)} min</span>
            </div>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {post.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
