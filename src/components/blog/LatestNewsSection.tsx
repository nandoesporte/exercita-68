import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight, Clock, Eye } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const LatestNewsSection = () => {
  const { data: posts, isLoading } = useBlogPosts();

  // Get only the 5 most recent published posts
  const latestPosts = posts?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            ILIVI Conecta
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[200px] rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!latestPosts.length) return null;

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          ILIVI Conecta
        </h2>
        <Link to="/blog" className="text-primary text-sm flex items-center gap-1 hover:underline">
          <span>Ver todas</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="py-2">
          {latestPosts.map((post) => (
            <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3">
              <Link to={`/blog/${post.slug}`}>
                <Card className="h-full group hover:shadow-lg transition-all duration-300 border-border overflow-hidden">
                  <CardContent className="p-0">
                    {/* Featured Image */}
                    {post.featured_image && (
                      <div className="h-40 overflow-hidden relative">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      {/* Category Badge */}
                      {post.blog_categories && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: post.blog_categories.color + '20',
                            borderColor: post.blog_categories.color,
                          }}
                        >
                          {post.blog_categories.name}
                        </Badge>
                      )}

                      {/* Title */}
                      <h3 className="font-bold text-base line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                        {post.reading_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time} min
                          </span>
                        )}
                        {post.views_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      {/* CTA Button */}
      <div className="mt-4 text-center">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link to="/blog" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Explorar Blog Completo
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default LatestNewsSection;
