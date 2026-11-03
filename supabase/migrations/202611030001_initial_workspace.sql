create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Samin Studio',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'editor', 'client')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  instagram_handle text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name),
  unique (workspace_id, id)
);
create index if not exists clients_workspace_id_idx on public.clients(workspace_id);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  format text not null check (format in ('post', 'story', 'cover')),
  storage_path text not null unique,
  content_type text not null default 'image/png',
  created_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id)
);
create index if not exists media_assets_workspace_id_idx on public.media_assets(workspace_id);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid,
  media_asset_id uuid not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  client_name text not null,
  client_handle text not null default '',
  format text not null check (format in ('post', 'story', 'cover')),
  caption text not null default '',
  hashtags text not null default '',
  requested_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'scheduled', 'published', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id),
  foreign key (workspace_id, media_asset_id) references public.media_assets(workspace_id, id)
);
create index if not exists posts_workspace_created_idx on public.posts(workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace_id text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members as member
    where member.workspace_id::text = target_workspace_id and member.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_workspace_member(text) from public, anon;
grant execute on function public.is_workspace_member(text) to authenticated;

create or replace function public.provision_workspace_for_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare new_workspace_id uuid;
begin
  insert into public.workspaces (name, owner_id)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'workspace_name', ''), 'Samin Studio'), new.id)
  returning id into new_workspace_id;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_provision_workspace on auth.users;
create trigger on_auth_user_created_provision_workspace after insert on auth.users
  for each row execute function public.provision_workspace_for_new_user();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.media_assets enable row level security;
alter table public.posts enable row level security;
revoke all on public.workspaces, public.workspace_members, public.clients, public.media_assets, public.posts from public, anon;
grant select, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, insert, update, delete on public.clients, public.media_assets, public.posts to authenticated;

drop policy if exists workspace_read_member on public.workspaces;
create policy workspace_read_member on public.workspaces for select to authenticated
  using ((select public.is_workspace_member(id::text)));
drop policy if exists workspace_update_owner on public.workspaces;
create policy workspace_update_owner on public.workspaces for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists membership_read_member on public.workspace_members;
create policy membership_read_member on public.workspace_members for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_workspace_member(workspace_id::text)));
drop policy if exists clients_manage_member on public.clients;
create policy clients_manage_member on public.clients for all to authenticated
  using ((select public.is_workspace_member(workspace_id::text)))
  with check ((select public.is_workspace_member(workspace_id::text)));
drop policy if exists media_manage_member on public.media_assets;
create policy media_manage_member on public.media_assets for all to authenticated
  using ((select public.is_workspace_member(workspace_id::text)))
  with check ((select public.is_workspace_member(workspace_id::text)) and created_by = (select auth.uid()));
drop policy if exists posts_manage_member on public.posts;
create policy posts_manage_member on public.posts for all to authenticated
  using ((select public.is_workspace_member(workspace_id::text)))
  with check ((select public.is_workspace_member(workspace_id::text)) and created_by = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('samin-media', 'samin-media', false, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'video/mp4']::text[])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists workspace_read_private_media on storage.objects;
create policy workspace_read_private_media on storage.objects for select to authenticated
  using (bucket_id = 'samin-media' and (select public.is_workspace_member((storage.foldername(name))[1])));
drop policy if exists workspace_upload_private_media on storage.objects;
create policy workspace_upload_private_media on storage.objects for insert to authenticated
  with check (bucket_id = 'samin-media' and (select public.is_workspace_member((storage.foldername(name))[1])));
drop policy if exists workspace_update_private_media on storage.objects;
create policy workspace_update_private_media on storage.objects for update to authenticated
  using (bucket_id = 'samin-media' and (select public.is_workspace_member((storage.foldername(name))[1])))
  with check (bucket_id = 'samin-media' and (select public.is_workspace_member((storage.foldername(name))[1])));
drop policy if exists workspace_delete_private_media on storage.objects;
create policy workspace_delete_private_media on storage.objects for delete to authenticated
  using (bucket_id = 'samin-media' and (select public.is_workspace_member((storage.foldername(name))[1])));
