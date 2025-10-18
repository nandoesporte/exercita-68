import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { useBlogPosts, useSavedPosts } from '@/hooks/useBlogPosts';
import { Loader2, BookmarkCheck, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: posts = [], isLoading } = useBlogPosts(
    selectedCategory || undefined,
    selectedContentType || undefined,
    searchQuery || undefined
  );

  const { data: savedPosts = [] } = useSavedPosts();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-turquoise" />
          <h1 className="text-3xl font-bold">Conteúdo Educacional</h1>
        </div>
        <p className="text-muted-foreground">
          Artigos, vídeos e podcasts sobre saúde, fitness e bem-estar
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="all">
            Explorar
          </TabsTrigger>
          <TabsTrigger value="saved">
            <BookmarkCheck className="w-4 h-4 mr-2" />
            Salvos ({savedPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <BlogFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedContentType={selectedContentType}
            onContentTypeChange={setSelectedContentType}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-turquoise" />
            </div>
          ) : posts.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum conteúdo encontrado com os filtros selecionados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          {savedPosts.length === 0 ? (
            <Alert>
              <AlertDescription>
                Você ainda não salvou nenhum conteúdo. Comece explorando a aba "Explorar"!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
