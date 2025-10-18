import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BlogPost, BlogCategory } from '@/types/blog';
import { useAdminBlogCategories } from '@/hooks/useAdminBlogPosts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

interface BlogPostFormProps {
  onSubmit: (data: Partial<BlogPost>) => void;
  isLoading: boolean;
  initialData?: BlogPost;
}

const BlogPostForm: React.FC<BlogPostFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const { categories } = useAdminBlogCategories();
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    featured_image: initialData?.featured_image || '',
    category_id: initialData?.category_id || '',
    content_type: initialData?.content_type || 'article',
    media_url: initialData?.media_url || '',
    reading_time: initialData?.reading_time || 5,
    is_published: initialData?.is_published || false,
    tags: initialData?.tags?.join(', ') || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !initialData) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, featured_image: publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tagsArray = formData.tags
      ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    onSubmit({
      ...formData,
      tags: tagsArray,
      reading_time: Number(formData.reading_time),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug (URL) *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => handleChange('slug', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="excerpt">Resumo</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt || ''}
          onChange={(e) => handleChange('excerpt', e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          rows={10}
          required
        />
      </div>

      <div>
        <Label htmlFor="featured_image">Imagem Destacada</Label>
        <div className="flex gap-2">
          <Input
            id="featured_image"
            value={formData.featured_image || ''}
            onChange={(e) => handleChange('featured_image', e.target.value)}
            placeholder="URL da imagem ou faça upload"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        {formData.featured_image && (
          <img src={formData.featured_image} alt="Preview" className="mt-2 h-32 w-full object-cover rounded" />
        )}
      </div>

      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select value={formData.category_id || ''} onValueChange={(value) => handleChange('category_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="content_type">Tipo de Conteúdo</Label>
        <Select value={formData.content_type} onValueChange={(value) => handleChange('content_type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="article">Artigo</SelectItem>
            <SelectItem value="video">Vídeo</SelectItem>
            <SelectItem value="infographic">Infográfico</SelectItem>
            <SelectItem value="podcast">Podcast</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(formData.content_type === 'video' || formData.content_type === 'podcast') && (
        <div>
          <Label htmlFor="media_url">URL da Mídia</Label>
          <Input
            id="media_url"
            value={formData.media_url || ''}
            onChange={(e) => handleChange('media_url', e.target.value)}
            placeholder="URL do vídeo ou podcast"
          />
        </div>
      )}

      <div>
        <Label htmlFor="reading_time">Tempo de Leitura (minutos)</Label>
        <Input
          id="reading_time"
          type="number"
          value={formData.reading_time}
          onChange={(e) => handleChange('reading_time', e.target.value)}
          min="1"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="fitness, nutrição, treino"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked) => handleChange('is_published', checked)}
        />
        <Label htmlFor="is_published">Publicar</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {initialData ? 'Atualizar Post' : 'Criar Post'}
      </Button>
    </form>
  );
};

export default BlogPostForm;
