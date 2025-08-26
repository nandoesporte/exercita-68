-- Add missing permission values to user_permission enum
ALTER TYPE user_permission ADD VALUE IF NOT EXISTS 'manage_categories';
ALTER TYPE user_permission ADD VALUE IF NOT EXISTS 'manage_store';
ALTER TYPE user_permission ADD VALUE IF NOT EXISTS 'manage_gym_photos';
ALTER TYPE user_permission ADD VALUE IF NOT EXISTS 'manage_schedule';
ALTER TYPE user_permission ADD VALUE IF NOT EXISTS 'manage_appointments';
ALTER TYPE user_permission ADD VALUE IF NOT EXISTS 'manage_payment_methods';

-- Add missing RPC functions for admin operations
CREATE OR REPLACE FUNCTION admin_add_pix_key(
  p_key_type text,
  p_key_value text,
  p_recipient_name text,
  p_is_primary boolean DEFAULT false
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  -- Insert PIX key
  INSERT INTO public.pix_keys (key_type, key_value, recipient_name, is_primary, admin_id)
  VALUES (p_key_type, p_key_value, p_recipient_name, p_is_primary, 
          (SELECT id FROM public.admins WHERE user_id = auth.uid() LIMIT 1));

  RETURN json_build_object('success', true, 'message', 'PIX key added successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_primary_pix_key(
  p_pix_key_id uuid
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  -- Set all keys to non-primary first
  UPDATE public.pix_keys SET is_primary = false 
  WHERE admin_id = (SELECT id FROM public.admins WHERE user_id = auth.uid() LIMIT 1);

  -- Set the selected key as primary
  UPDATE public.pix_keys SET is_primary = true WHERE id = p_pix_key_id;

  RETURN json_build_object('success', true, 'message', 'Primary PIX key updated');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_pix_key(
  p_pix_key_id uuid
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  -- Delete PIX key
  DELETE FROM public.pix_keys WHERE id = p_pix_key_id
  AND admin_id = (SELECT id FROM public.admins WHERE user_id = auth.uid() LIMIT 1);

  RETURN json_build_object('success', true, 'message', 'PIX key deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION admin_save_payment_settings(
  p_accept_card boolean,
  p_accept_pix boolean,
  p_accept_monthly_fee boolean,
  p_monthly_fee_amount numeric
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  -- Insert or update payment settings
  INSERT INTO public.payment_settings (
    accept_card_payments, accept_pix_payments, accept_monthly_fee, 
    monthly_fee_amount, admin_id
  )
  VALUES (
    p_accept_card, p_accept_pix, p_accept_monthly_fee, p_monthly_fee_amount,
    (SELECT id FROM public.admins WHERE user_id = auth.uid() LIMIT 1)
  )
  ON CONFLICT (admin_id) DO UPDATE SET
    accept_card_payments = p_accept_card,
    accept_pix_payments = p_accept_pix,
    accept_monthly_fee = p_accept_monthly_fee,
    monthly_fee_amount = p_monthly_fee_amount,
    updated_at = now();

  RETURN json_build_object('success', true, 'message', 'Payment settings saved');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION get_tables_without_rls()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  SELECT json_agg(
    json_build_object(
      'table_name', schemaname || '.' || tablename,
      'rls_enabled', rowsecurity
    )
  )
  INTO result
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
  AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL);

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION admin_enable_rls(
  p_table_name text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  -- Enable RLS on the table
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);

  RETURN json_build_object('success', true, 'message', 'RLS enabled for ' || p_table_name);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;