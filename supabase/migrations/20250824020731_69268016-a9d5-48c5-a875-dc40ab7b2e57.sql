-- Alterar coluna kiwify_product_id para checkout_url na tabela subscription_plans
ALTER TABLE public.subscription_plans 
DROP COLUMN IF EXISTS kiwify_product_id;

ALTER TABLE public.subscription_plans 
ADD COLUMN checkout_url text;