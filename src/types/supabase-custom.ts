// Custom types to handle the gap between our new functions and the auto-generated types
import { Database } from '@/integrations/supabase/types';

// Extended database type with our new functions
export type ExtendedDatabase = Database & {
  public: Database['public'] & {
    Functions: Database['public']['Functions'] & {
      debug_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: any[]
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: any[]
      }
      toggle_user_admin_status: {
        Args: {
          user_id: string
          make_admin: boolean
        }
        Returns: { success: boolean; message: string }
      }
      toggle_user_active_status: {
        Args: {
          user_id: string
        }
        Returns: { success: boolean; message: string }
      }
      admin_create_user: {
        Args: {
          user_data: any
        }
        Returns: { success: boolean; message: string }
      }
      admin_delete_user: {
        Args: {
          user_id: string
        }
        Returns: { success: boolean; message: string }
      }
      clone_workout_for_user: {
        Args: {
          workout_id: string
          target_user_id: string
        }
        Returns: { success: boolean; message: string }
      }
      admin_add_pix_key: {
        Args: {
          p_key_type: string
          p_key_value: string
          p_recipient_name: string
          p_is_primary?: boolean
        }
        Returns: { success: boolean; message: string }
      }
      admin_set_primary_pix_key: {
        Args: {
          p_pix_key_id: string
        }
        Returns: { success: boolean; message: string }
      }
      admin_delete_pix_key: {
        Args: {
          p_pix_key_id: string
        }
        Returns: { success: boolean; message: string }
      }
      admin_save_payment_settings: {
        Args: {
          p_accept_card: boolean
          p_accept_pix: boolean
          p_accept_monthly_fee: boolean
          p_monthly_fee_amount: number
        }
        Returns: { success: boolean; message: string }
      }
      get_tables_without_rls: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          table_name: string
          rls_enabled: boolean
        }>
      }
      admin_enable_rls: {
        Args: {
          p_table_name: string
        }
        Returns: { success: boolean; message: string }
      }
    }
    Enums: Database['public']['Enums'] & {
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
    }
  }
}

export type UserPermission = ExtendedDatabase['public']['Enums']['user_permission'];