
-- Function to add a new PIX key as admin
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
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage PIX keys';
  END IF;

  -- Create new PIX key
  INSERT INTO public.pix_keys (
    key_type,
    key_value,
    recipient_name,
    is_primary
  ) VALUES (
    key_type_val,
    key_value_val,
    recipient_name_val,
    is_primary_val
  )
  RETURNING id INTO new_key_id;
  
  -- If this is set as primary, make sure other keys are not primary
  IF is_primary_val THEN
    UPDATE public.pix_keys
    SET is_primary = FALSE
    WHERE id != new_key_id;
  END IF;

  RETURN new_key_id;
END;
$$;

-- Function to set a PIX key as primary
CREATE OR REPLACE FUNCTION public.admin_set_primary_pix_key(
  key_id_val UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage PIX keys';
  END IF;

  -- First, set all keys to not primary
  UPDATE public.pix_keys
  SET is_primary = FALSE;
  
  -- Then set the selected key as primary
  UPDATE public.pix_keys
  SET is_primary = TRUE
  WHERE id = key_id_val;
END;
$$;

-- Function to delete a PIX key
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
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage PIX keys';
  END IF;

  -- Check if the key to delete is primary
  SELECT is_primary INTO was_primary
  FROM public.pix_keys
  WHERE id = key_id_val;
  
  -- Delete the key
  DELETE FROM public.pix_keys
  WHERE id = key_id_val;
  
  -- If we deleted the primary key, set a new one if available
  IF was_primary THEN
    SELECT id INTO next_key_id
    FROM public.pix_keys
    LIMIT 1;
    
    IF next_key_id IS NOT NULL THEN
      UPDATE public.pix_keys
      SET is_primary = TRUE
      WHERE id = next_key_id;
    END IF;
  END IF;
END;
$$;

-- Function to save payment settings
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
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can manage payment settings';
  END IF;

  -- Check if settings exist
  SELECT id INTO settings_id
  FROM public.payment_settings
  LIMIT 1;
  
  IF settings_id IS NULL THEN
    -- Insert new settings
    INSERT INTO public.payment_settings (
      accept_card_payments,
      accept_pix_payments,
      accept_monthly_fee,
      monthly_fee_amount
    ) VALUES (
      accept_card_payments_val,
      accept_pix_payments_val,
      accept_monthly_fee_val,
      monthly_fee_amount_val
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
