-- Corrigir as functions críticas que ainda não têm search_path definido

-- Corrigir admin_add_pix_key
CREATE OR REPLACE FUNCTION public.admin_add_pix_key(p_key_type text, p_key_value text, p_recipient_name text, p_is_primary boolean DEFAULT false)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Corrigir admin_delete_pix_key
CREATE OR REPLACE FUNCTION public.admin_delete_pix_key(p_pix_key_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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