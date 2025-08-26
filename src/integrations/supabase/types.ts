export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          admin_id: string
          created_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["user_permission"]
        }
        Insert: {
          admin_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["user_permission"]
        }
        Update: {
          admin_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["user_permission"]
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_subscriptions: {
        Row: {
          admin_id: string
          created_at: string | null
          end_date: string | null
          id: string
          kiwify_customer_id: string | null
          kiwify_order_id: string | null
          payment_url: string | null
          plan_id: string
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          kiwify_customer_id?: string | null
          kiwify_order_id?: string | null
          payment_url?: string | null
          plan_id: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          kiwify_customer_id?: string | null
          kiwify_order_id?: string | null
          payment_url?: string | null
          plan_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_subscriptions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          admin_id: string | null
          appointment_date: string
          created_at: string | null
          description: string | null
          duration: number
          id: string
          status: string
          title: string
          trainer_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          appointment_date: string
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          status?: string
          title: string
          trainer_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          appointment_date?: string
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          status?: string
          title?: string
          trainer_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_based_workouts: {
        Row: {
          admin_id: string | null
          available_time: number | null
          created_at: string
          equipment_list: Json | null
          fitness_goal: string | null
          fitness_level: string | null
          id: string
          photo_analysis_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          available_time?: number | null
          created_at?: string
          equipment_list?: Json | null
          fitness_goal?: string | null
          fitness_level?: string | null
          id?: string
          photo_analysis_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          available_time?: number | null
          created_at?: string
          equipment_list?: Json | null
          fitness_goal?: string | null
          fitness_level?: string | null
          id?: string
          photo_analysis_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_based_workouts_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_based_workouts_photo_analysis_id_fkey"
            columns: ["photo_analysis_id"]
            isOneToOne: false
            referencedRelation: "gym_photo_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          admin_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          admin_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          admin_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "workout_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_photo_analysis: {
        Row: {
          analysis_date: string
          equipment_detected: Json | null
          id: string
          photo_id: string
        }
        Insert: {
          analysis_date?: string
          equipment_detected?: Json | null
          id?: string
          photo_id: string
        }
        Update: {
          analysis_date?: string
          equipment_detected?: Json | null
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_photo_analysis_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "user_gym_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      kiwify_webhook_logs: {
        Row: {
          admin_subscription_id: string | null
          customer_id: string | null
          event_type: string
          id: string
          order_id: string | null
          payload: Json
          processed_at: string | null
          status: string | null
        }
        Insert: {
          admin_subscription_id?: string | null
          customer_id?: string | null
          event_type: string
          id?: string
          order_id?: string | null
          payload: Json
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          admin_subscription_id?: string | null
          customer_id?: string | null
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kiwify_webhook_logs_admin_subscription_id_fkey"
            columns: ["admin_subscription_id"]
            isOneToOne: false
            referencedRelation: "admin_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          kiwify_order_id: string | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          kiwify_order_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          kiwify_order_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          accept_card_payments: boolean | null
          accept_monthly_fee: boolean | null
          accept_pix_payments: boolean | null
          admin_id: string | null
          created_at: string | null
          id: string
          monthly_fee_amount: number | null
          updated_at: string | null
        }
        Insert: {
          accept_card_payments?: boolean | null
          accept_monthly_fee?: boolean | null
          accept_pix_payments?: boolean | null
          admin_id?: string | null
          created_at?: string | null
          id?: string
          monthly_fee_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          accept_card_payments?: boolean | null
          accept_monthly_fee?: boolean | null
          accept_pix_payments?: boolean | null
          admin_id?: string | null
          created_at?: string | null
          id?: string
          monthly_fee_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_settings_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_trainers: {
        Row: {
          admin_id: string | null
          bio: string | null
          created_at: string | null
          credentials: string | null
          id: string
          is_primary: boolean | null
          name: string
          photo_url: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          admin_id?: string | null
          bio?: string | null
          created_at?: string | null
          credentials?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          photo_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          admin_id?: string | null
          bio?: string | null
          created_at?: string | null
          credentials?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          photo_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_trainers_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_keys: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          key_type: string
          key_value: string
          recipient_name: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          key_type: string
          key_value: string
          recipient_name: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          key_type?: string
          key_value?: string
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_keys_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          admin_id: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          sale_url: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          sale_url?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          sale_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_id: string | null
          avatar_url: string | null
          birthdate: string | null
          created_at: string | null
          first_name: string | null
          fitness_goal: string | null
          gender: string | null
          height: number | null
          id: string
          instance_id: string | null
          is_admin: boolean | null
          last_name: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          admin_id?: string | null
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string | null
          first_name?: string | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          id: string
          instance_id?: string | null
          is_admin?: boolean | null
          last_name?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          admin_id?: string | null
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string | null
          first_name?: string | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          instance_id?: string | null
          is_admin?: boolean | null
          last_name?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          checkout_url: string | null
          created_at: string | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          checkout_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gym_photos: {
        Row: {
          admin_id: string | null
          approved: boolean | null
          created_at: string | null
          description: string | null
          id: string
          photo_url: string
          processed_by_ai: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          approved?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          photo_url: string
          processed_by_ai?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          approved?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          photo_url?: string
          processed_by_ai?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gym_photos_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workout_history: {
        Row: {
          admin_id: string | null
          calories_burned: number | null
          completed_at: string | null
          created_at: string | null
          duration: number | null
          id: string
          notes: string | null
          rating: number | null
          updated_at: string | null
          user_id: string | null
          workout_id: string | null
        }
        Insert: {
          admin_id?: string | null
          calories_burned?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Update: {
          admin_id?: string | null
          calories_burned?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workout_history_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_history_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_categories: {
        Row: {
          admin_id: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_categories_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_clone_history: {
        Row: {
          cloned_by_user_id: string | null
          cloned_workout_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          source_workout_id: string
          status: string
          target_user_id: string
        }
        Insert: {
          cloned_by_user_id?: string | null
          cloned_workout_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          source_workout_id: string
          status?: string
          target_user_id: string
        }
        Update: {
          cloned_by_user_id?: string | null
          cloned_workout_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          source_workout_id?: string
          status?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_clone_history_cloned_workout_id_fkey"
            columns: ["cloned_workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_clone_history_source_workout_id_fkey"
            columns: ["source_workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          created_at: string | null
          day_of_week: string
          id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          id?: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          day_of_week: string | null
          duration: number | null
          exercise_id: string | null
          id: string
          is_title_section: boolean | null
          order_position: number
          reps: number | null
          rest: number | null
          section_title: string | null
          sets: number | null
          updated_at: string | null
          weight: number | null
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: string | null
          duration?: number | null
          exercise_id?: string | null
          id?: string
          is_title_section?: boolean | null
          order_position: number
          reps?: number | null
          rest?: number | null
          section_title?: string | null
          sets?: number | null
          updated_at?: string | null
          weight?: number | null
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string | null
          duration?: number | null
          exercise_id?: string | null
          id?: string
          is_title_section?: boolean | null
          order_position?: number
          reps?: number | null
          rest?: number | null
          section_title?: string | null
          sets?: number | null
          updated_at?: string | null
          weight?: number | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_recommendations: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
          workout_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          workout_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_recommendations_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_recommendations_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          admin_id: string | null
          calories: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_recommended: boolean | null
          level: Database["public"]["Enums"]["workout_level"]
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_recommended?: boolean | null
          level: Database["public"]["Enums"]["workout_level"]
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_recommended?: boolean | null
          level?: Database["public"]["Enums"]["workout_level"]
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "workout_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_pix_key: {
        Args: {
          p_is_primary?: boolean
          p_key_type: string
          p_key_value: string
          p_recipient_name: string
        }
        Returns: Json
      }
      admin_create_user: {
        Args: { user_data: Json }
        Returns: boolean
      }
      admin_delete_pix_key: {
        Args: { p_pix_key_id: string }
        Returns: Json
      }
      admin_delete_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      admin_enable_rls: {
        Args: { p_table_name: string }
        Returns: Json
      }
      admin_save_payment_settings: {
        Args: {
          p_accept_card: boolean
          p_accept_monthly_fee: boolean
          p_accept_pix: boolean
          p_monthly_fee_amount: number
        }
        Returns: Json
      }
      admin_set_primary_pix_key: {
        Args: { p_pix_key_id: string }
        Returns: Json
      }
      clone_workout_for_user: {
        Args: { target_user_id: string; workout_id: string }
        Returns: boolean
      }
      debug_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_tables_without_rls: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      toggle_user_active_status: {
        Args: { user_id: string }
        Returns: boolean
      }
      toggle_user_admin_status: {
        Args: { make_admin: boolean; target_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      user_permission:
        | "manage_users"
        | "manage_workouts"
        | "manage_exercises"
        | "manage_products"
        | "manage_payments"
        | "view_analytics"
        | "manage_categories"
        | "manage_store"
        | "manage_gym_photos"
        | "manage_schedule"
        | "manage_appointments"
        | "manage_payment_methods"
      user_role: "admin" | "trainer" | "user"
      workout_level: "beginner" | "intermediate" | "advanced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_permission: [
        "manage_users",
        "manage_workouts",
        "manage_exercises",
        "manage_products",
        "manage_payments",
        "view_analytics",
        "manage_categories",
        "manage_store",
        "manage_gym_photos",
        "manage_schedule",
        "manage_appointments",
        "manage_payment_methods",
      ],
      user_role: ["admin", "trainer", "user"],
      workout_level: ["beginner", "intermediate", "advanced"],
    },
  },
} as const
