
-- This function creates a profile entry when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  user_instance_id uuid;
begin
  -- Extract instance_id from user metadata or use a new UUID if not found
  if new.raw_user_meta_data->>'instance_id' is not null then
    user_instance_id := (new.raw_user_meta_data->>'instance_id')::uuid;
  else
    user_instance_id := gen_random_uuid();
    
    -- Update the user with the new instance_id
    update auth.users
    set raw_user_meta_data = 
      jsonb_set(raw_user_meta_data, '{instance_id}', to_jsonb(user_instance_id::text))
    where id = new.id;
  end if;
  
  insert into public.profiles (
    id, 
    first_name, 
    last_name, 
    avatar_url,
    instance_id
  )
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url',
    user_instance_id
  );
  return new;
end;
$$;

-- Make sure we have a trigger set up
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
