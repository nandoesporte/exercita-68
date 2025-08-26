
-- Função para depuração de consultas de usuários
CREATE OR REPLACE FUNCTION public.debug_user_query()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN 'debug function created successfully';
END;
$$;
