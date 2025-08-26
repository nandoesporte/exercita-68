-- Check for triggers on workouts table and fix the issue
SELECT tgname, tgrelid::regclass, pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgrelid = 'public.workouts'::regclass 
AND NOT tgisinternal;

-- Also check what triggers are attached to tables that might be causing this error
SELECT 
    t.tgname AS trigger_name,
    t.tgrelid::regclass AS table_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
WHERE pg_get_triggerdef(t.oid) LIKE '%user_id%'
AND NOT t.tgisinternal;