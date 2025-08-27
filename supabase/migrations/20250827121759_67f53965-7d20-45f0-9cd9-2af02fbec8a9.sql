-- Ensure 'exercises' bucket exists and allows GIF uploads
insert into storage.buckets (id, name, public)
values ('exercises', 'exercises', true)
on conflict (id) do update set public = true;

-- Allow GIF and common media types in this bucket
update storage.buckets
set allowed_mime_types = ARRAY['image/gif','image/png','image/jpeg','video/mp4','video/webm']::text[]
where id = 'exercises';