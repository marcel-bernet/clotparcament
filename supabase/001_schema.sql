-- clotparcament: tables + security (RLS)
-- Run once in Supabase → SQL Editor.

-- 1. TABLES ---------------------------------------------------------------

create table public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.parking_events (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  result      text not null check (result in ('success', 'fail')),
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index parking_events_group_time on public.parking_events (group_id, occurred_at desc);

-- 2. HELPER: "is the logged-in user an active member of this group?" -----
-- security definer so it can read group_members without RLS recursion.

create function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

revoke execute on function public.is_group_member(uuid) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;

-- 3. TABLE PERMISSIONS (first layer) -------------------------------------
-- Anonymous visitors: nothing at all.
revoke all on public.groups, public.group_members, public.parking_events from anon;

-- Logged-in users: read-only on groups and memberships.
revoke insert, update, delete, truncate on public.groups, public.group_members from authenticated;

-- Logged-in users on events: never update. Insert only these 4 columns,
-- so user_id is always auth.uid() and occurred_at is always the server clock.
revoke insert, update, truncate on public.parking_events from authenticated;
grant insert (group_id, result, latitude, longitude) on public.parking_events to authenticated;

-- 4. ROW LEVEL SECURITY (second layer) -----------------------------------

alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.parking_events enable row level security;

create policy "members can see their groups"
  on public.groups for select to authenticated
  using (public.is_group_member(id));

create policy "users can see their own memberships"
  on public.group_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "members can read their group's events"
  on public.parking_events for select to authenticated
  using (public.is_group_member(group_id));

create policy "members can add their own events"
  on public.parking_events for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(group_id));

-- "Undo": a user can delete only their OWN event, only within 15 minutes.
create policy "users can undo their own recent events"
  on public.parking_events for delete to authenticated
  using (user_id = (select auth.uid()) and created_at > now() - interval '15 minutes');

-- 5. THE GROUP ------------------------------------------------------------

insert into public.groups (name) values ('Clot');
