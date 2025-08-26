-- Update the admin_add_pix_key function to include admin_id
CREATE OR REPLACE FUNCTION public.admin_add_pix_key(
  key_type_val TEXT,
  key_value_val TEXT,
  recipient_name_val TEXT,
  is_primary_val BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key_id UUID;
  current_admin_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage PIX keys';
  END IF;

  -- Get the current admin's ID
  SELECT id INTO current_admin_id
  FROM public.admins
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin record not found for user';
  END IF;

  -- Create new PIX key
  INSERT INTO public.pix_keys (
    key_type,
    key_value,
    recipient_name,
    is_primary,
    admin_id
  ) VALUES (
    key_type_val,
    key_value_val,
    recipient_name_val,
    is_primary_val,
    current_admin_id
  )
  RETURNING id INTO new_key_id;
  
  -- If this is set as primary, make sure other keys from the same admin are not primary
  IF is_primary_val THEN
    UPDATE public.pix_keys
    SET is_primary = FALSE
    WHERE id != new_key_id AND admin_id = current_admin_id;
  END IF;

  RETURN new_key_id;
END;
$$;

-- Update the admin_set_primary_pix_key function to include admin_id check
CREATE OR REPLACE FUNCTION public.admin_set_primary_pix_key(
  key_id_val UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage PIX keys';
  END IF;

  -- Get the current admin's ID
  SELECT id INTO current_admin_id
  FROM public.admins
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin record not found for user';
  END IF;

  -- First, set all keys from this admin to not primary
  UPDATE public.pix_keys
  SET is_primary = FALSE
  WHERE admin_id = current_admin_id;
  
  -- Then set the selected key as primary (if it belongs to this admin)
  UPDATE public.pix_keys
  SET is_primary = TRUE
  WHERE id = key_id_val AND admin_id = current_admin_id;
END;
$$;

-- Update the admin_delete_pix_key function to include admin_id check
CREATE OR REPLACE FUNCTION public.admin_delete_pix_key(
  key_id_val UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  was_primary BOOLEAN;
  next_key_id UUID;
  current_admin_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage PIX keys';
  END IF;

  -- Get the current admin's ID
  SELECT id INTO current_admin_id
  FROM public.admins
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin record not found for user';
  END IF;

  -- Check if the key to delete is primary and belongs to this admin
  SELECT is_primary INTO was_primary
  FROM public.pix_keys
  WHERE id = key_id_val AND admin_id = current_admin_id;
  
  -- Delete the key (only if it belongs to this admin)
  DELETE FROM public.pix_keys
  WHERE id = key_id_val AND admin_id = current_admin_id;
  
  -- If we deleted the primary key, set a new one if available
  IF was_primary THEN
    SELECT id INTO next_key_id
    FROM public.pix_keys
    WHERE admin_id = current_admin_id
    LIMIT 1;
    
    IF next_key_id IS NOT NULL THEN
      UPDATE public.pix_keys
      SET is_primary = TRUE
      WHERE id = next_key_id;
    END IF;
  END IF;
END;
$$;

-- Update the admin_save_payment_settings function to include admin_id
CREATE OR REPLACE FUNCTION public.admin_save_payment_settings(
  accept_card_payments_val BOOLEAN,
  accept_pix_payments_val BOOLEAN,
  accept_monthly_fee_val BOOLEAN,
  monthly_fee_amount_val NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings_id UUID;
  current_admin_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage payment settings';
  END IF;

  -- Get the current admin's ID
  SELECT id INTO current_admin_id
  FROM public.admins
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin record not found for user';
  END IF;

  -- Check if settings exist for this admin
  SELECT id INTO settings_id
  FROM public.payment_settings
  WHERE admin_id = current_admin_id
  LIMIT 1;
  
  IF settings_id IS NULL THEN
    -- Insert new settings
    INSERT INTO public.payment_settings (
      accept_card_payments,
      accept_pix_payments,
      accept_monthly_fee,
      monthly_fee_amount,
      admin_id
    ) VALUES (
      accept_card_payments_val,
      accept_pix_payments_val,
      accept_monthly_fee_val,
      monthly_fee_amount_val,
      current_admin_id
    );
  ELSE
    -- Update existing settings
    UPDATE public.payment_settings
    SET 
      accept_card_payments = accept_card_payments_val,
      accept_pix_payments = accept_pix_payments_val,
      accept_monthly_fee = accept_monthly_fee_val,
      monthly_fee_amount = monthly_fee_amount_val,
      updated_at = NOW()
    WHERE id = settings_id;
  END IF;
END;
$$;