-- Create blog categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#9333ea',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL DEFAULT 'article' CHECK (content_type IN ('article', 'video', 'infographic', 'podcast')),
  media_url TEXT,
  media_duration INTEGER,
  reading_time INTEGER,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  admin_id UUID,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user blog interactions table
CREATE TABLE public.user_blog_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  saved_at TIMESTAMP WITH TIME ZONE,
  reading_progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create blog recommendations table
CREATE TABLE public.blog_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blog_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Everyone can view blog categories"
  ON public.blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage blog categories"
  ON public.blog_categories FOR ALL
  USING (is_admin());

-- RLS Policies for blog_posts
CREATE POLICY "Everyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = true OR is_admin());

CREATE POLICY "Only admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (is_admin());

-- RLS Policies for user_blog_interactions
CREATE POLICY "Users can view their own interactions"
  ON public.user_blog_interactions FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own interactions"
  ON public.user_blog_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON public.user_blog_interactions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for blog_recommendations
CREATE POLICY "Users can view their own recommendations"
  ON public.blog_recommendations FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "System can create recommendations"
  ON public.blog_recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all recommendations"
  ON public.blog_recommendations FOR ALL
  USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_content_type ON public.blog_posts(content_type);
CREATE INDEX idx_user_interactions_user ON public.user_blog_interactions(user_id);
CREATE INDEX idx_user_interactions_post ON public.user_blog_interactions(post_id);
CREATE INDEX idx_user_interactions_saved ON public.user_blog_interactions(user_id, is_saved) WHERE is_saved = true;
CREATE INDEX idx_blog_recommendations_user ON public.blog_recommendations(user_id, score DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_blog_interactions_updated_at
  BEFORE UPDATE ON public.user_blog_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default blog categories
INSERT INTO public.blog_categories (name, slug, description, icon, color) VALUES
  ('Nutrição', 'nutricao', 'Dicas e informações sobre alimentação saudável', 'Apple', '#10b981'),
  ('Exercícios', 'exercicios', 'Guias e técnicas de treino', 'Dumbbell', '#9333ea'),
  ('Saúde Mental', 'saude-mental', 'Bem-estar emocional e mental', 'Brain', '#06b6d4'),
  ('Recuperação', 'recuperacao', 'Descanso e recuperação muscular', 'Moon', '#f59e0b'),
  ('Lifestyle', 'lifestyle', 'Estilo de vida saudável', 'Heart', '#ec4899');