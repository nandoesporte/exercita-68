export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  category_id: string | null;
  content_type: 'article' | 'video' | 'infographic' | 'podcast';
  media_url: string | null;
  media_duration: number | null;
  reading_time: number | null;
  author_id: string | null;
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  admin_id: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  blog_categories?: BlogCategory;
}

export interface UserBlogInteraction {
  id: string;
  user_id: string;
  post_id: string;
  is_read: boolean;
  is_saved: boolean;
  read_at: string | null;
  saved_at: string | null;
  reading_progress: number;
  created_at: string;
  updated_at: string;
}

export interface BlogRecommendation {
  id: string;
  user_id: string;
  post_id: string;
  score: number;
  reason: string | null;
  created_at: string;
  blog_posts?: BlogPost;
}
