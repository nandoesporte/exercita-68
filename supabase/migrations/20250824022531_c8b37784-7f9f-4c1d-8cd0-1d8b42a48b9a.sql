-- Atualizar trigger para personal_trainers para definir admin_id automaticamente

-- Verificar se existe trigger para personal_trainers
DROP TRIGGER IF EXISTS set_admin_id_on_personal_trainers_insert ON public.personal_trainers;

-- Criar trigger específico para personal_trainers
CREATE OR REPLACE FUNCTION public.set_admin_id_on_personal_trainers_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Se admin_id não foi definido, tentar obter do admin atual
    IF NEW.admin_id IS NULL THEN
        -- Se o usuário é admin (não super admin), usar seu admin_id
        IF is_admin() AND NOT is_super_admin() THEN
            NEW.admin_id = get_current_admin_id();
        END IF;
        -- Se for super admin, admin_id pode ficar NULL (dados globais)
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para INSERT e UPDATE
CREATE TRIGGER set_admin_id_on_personal_trainers_insert
    BEFORE INSERT OR UPDATE ON public.personal_trainers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_id_on_personal_trainers_insert();