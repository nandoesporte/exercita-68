
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean; // Make this a required field
  created_at?: string;
  updated_at?: string;
  sale_url?: string;
  category_id?: string | null;
  categories?: {
    name: string;
  } | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  sale_url: string;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean; // Make this a required field
}
