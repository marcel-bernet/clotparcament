-- clotparcament: invitations, admin role, recommendations, keep-alive ping
-- Run once in Supabase → SQL Editor, after 001_schema.sql.

-- 1. ADMIN ROLE -----------------------------------------------------------

alter table public.group_members
  add column role text not null default 'member' check (role in ('member', 'admin'));

create function public.is_group_admin(gid uuid)
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
      and role = 'admin'
  );
$$;

revoke execute on function public.is_group_admin(uuid) from public, anon;
grant execute on function public.is_group_admin(uuid) to authenticated;

-- 2. INVITATIONS ----------------------------------------------------------
-- An admin adds an email here. Only invited emails can create an account.
-- Deleting the invite removes that person from the group.

create table public.group_invites (
  group_id   uuid not null references public.groups(id) on delete cascade,
  email      text not null check (email = lower(trim(email)) and email like '%_@_%'),
  invited_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (group_id, email)
);

revoke all on public.group_invites from anon;
revoke update, truncate on public.group_invites from authenticated;
revoke insert on public.group_invites from authenticated;
grant insert (group_id, email) on public.group_invites to authenticated;

alter table public.group_invites enable row level security;

create policy "admins can see their group's invites"
  on public.group_invites for select to authenticated
  using (public.is_group_admin(group_id));

create policy "admins can invite to their group"
  on public.group_invites for insert to authenticated
  with check (public.is_group_admin(group_id));

create policy "admins can remove invites from their group"
  on public.group_invites for delete to authenticated
  using (public.is_group_admin(group_id));

-- 3. AUTOMATIC MEMBERSHIP -------------------------------------------------

-- 3a. Block account creation for emails that are not invited.
--     (Runs before Supabase creates the user, so no email is sent.)
create function public.only_invited_users()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.group_invites where email = lower(trim(new.email))
  ) then
    raise exception 'not invited';
  end if;
  return new;
end;
$$;

create trigger only_invited_users
  before insert on auth.users
  for each row execute function public.only_invited_users();

-- 3b. When an invited person creates their account, add them to the group(s).
create function public.join_invited_groups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id)
  select group_id, new.id
  from public.group_invites
  where email = lower(trim(new.email))
  on conflict (group_id, user_id) do update set status = 'active';
  return new;
end;
$$;

create trigger join_invited_groups
  after insert on auth.users
  for each row execute function public.join_invited_groups();

-- 3c. Inviting someone who already has an account adds them straight away.
create function public.invite_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id)
  select new.group_id, u.id
  from auth.users u
  where lower(u.email) = new.email
  on conflict (group_id, user_id) do update set status = 'active';
  return new;
end;
$$;

create trigger invite_added
  after insert on public.group_invites
  for each row execute function public.invite_added();

-- 3d. Removing an invite removes the person from the group (admins are never removed).
create function public.invite_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.group_members m
  using auth.users u
  where m.user_id = u.id
    and m.group_id = old.group_id
    and lower(u.email) = old.email
    and m.role <> 'admin';
  return old;
end;
$$;

create trigger invite_removed
  after delete on public.group_invites
  for each row execute function public.invite_removed();

revoke execute on function public.only_invited_users() from public, anon, authenticated;
revoke execute on function public.join_invited_groups() from public, anon, authenticated;
revoke execute on function public.invite_added() from public, anon, authenticated;
revoke execute on function public.invite_removed() from public, anon, authenticated;

-- 4. RECOMMENDATIONS ------------------------------------------------------
-- Fully explained in README.md → "Recommendation algorithm".
-- security invoker: runs with the caller's permissions, so RLS decides
-- which events are visible (only the caller's own groups).

create function public.recommend_parking(p_group_id uuid, p_at timestamptz default now())
returns table (
  latitude          double precision,
  longitude         double precision,
  successes         int,
  failures          int,
  similar_successes int,
  similar_failures  int,
  score             double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with now_local as (
    -- Current time in Barcelona. Day of week uses a 04:00 day boundary,
    -- so 00:10 on Wednesday still counts as "Tuesday night".
    select
      extract(hour from p_at at time zone 'Europe/Madrid') * 60
        + extract(minute from p_at at time zone 'Europe/Madrid')             as minute_of_day,
      extract(isodow from (p_at at time zone 'Europe/Madrid') - interval '4 hours') as dow  -- 1 = Mon … 7 = Sun
  ),
  events as (
    select
      e.result,
      e.latitude,
      e.longitude,
      -- Geographic grid of ~50 m × 50 m squares.
      floor(e.latitude * 111320 / 50)                                       as cell_y,
      floor(e.longitude * 111320 * cos(radians(e.latitude)) / 50)           as cell_x,
      extract(hour from e.occurred_at at time zone 'Europe/Madrid') * 60
        + extract(minute from e.occurred_at at time zone 'Europe/Madrid')   as minute_of_day,
      extract(isodow from (e.occurred_at at time zone 'Europe/Madrid') - interval '4 hours') as dow
    from public.parking_events e
    where e.group_id = p_group_id
  ),
  weighted as (
    select
      ev.*,
      -- Circular time distance in minutes (23:50 vs 00:10 = 20 min).
      least(abs(ev.minute_of_day - n.minute_of_day),
            1440 - abs(ev.minute_of_day - n.minute_of_day))                 as minutes_apart,
      case
        when ev.dow = n.dow                  then 1.0  -- same day of the week
        when (ev.dow >= 6) = (n.dow >= 6)    then 0.6  -- both weekdays, or both weekend
        else 0.2                                        -- weekday vs weekend
      end                                                                    as day_weight
    from events ev, now_local n
  ),
  scored as (
    select
      w.*,
      -- Time weight: 1.0 at the same time, falling to 0.1 at 3 hours or more apart.
      (0.1 + 0.9 * greatest(0, 1 - w.minutes_apart / 180.0)) * w.day_weight as weight,
      (w.minutes_apart <= 90 and w.day_weight >= 0.6)                        as is_similar
    from weighted w
  ),
  cells as (
    -- Per 50 m square: counts and weighted sums.
    select
      s.cell_y,
      s.cell_x,
      count(*) filter (where s.result = 'success')                       as n_s,
      count(*) filter (where s.result = 'fail')                          as n_f,
      count(*) filter (where s.result = 'success' and s.is_similar)      as n_ss,
      count(*) filter (where s.result = 'fail' and s.is_similar)         as n_sf,
      coalesce(sum(s.weight) filter (where s.result = 'success'), 0)     as ws,
      coalesce(sum(s.weight) filter (where s.result = 'fail'), 0)        as wf,
      coalesce(sum(s.latitude) filter (where s.result = 'success'), 0)   as sum_lat,
      coalesce(sum(s.longitude) filter (where s.result = 'success'), 0)  as sum_lng
    from scored s
    group by s.cell_y, s.cell_x
  ),
  areas as (
    -- An "area" = a square plus its 8 neighbours (3 × 3 squares ≈ 150 m × 150 m).
    select
      c.cell_y,
      c.cell_x,
      sum(nb.n_s)::int   as successes,
      sum(nb.n_f)::int   as failures,
      sum(nb.n_ss)::int  as similar_successes,
      sum(nb.n_sf)::int  as similar_failures,
      sum(nb.ws)         as ws,
      sum(nb.wf)         as wf,
      sum(nb.sum_lat) / nullif(sum(nb.n_s), 0) as latitude,   -- average position of successful parkings
      sum(nb.sum_lng) / nullif(sum(nb.n_s), 0) as longitude
    from cells c
    join cells nb
      on abs(nb.cell_y - c.cell_y) <= 1 and abs(nb.cell_x - c.cell_x) <= 1
    group by c.cell_y, c.cell_x
  ),
  area_scores as (
    select
      a.*,
      -- score = success rate, as if every area started with 2 failed searches
      a.ws / (a.ws + a.wf + 2) as score
    from areas a
    where a.successes > 0
  )
  -- Keep only areas that beat all overlapping neighbours, so the
  -- 3 recommendations are always different places.
  select a.latitude, a.longitude, a.successes, a.failures,
         a.similar_successes, a.similar_failures, a.score
  from area_scores a
  where not exists (
    select 1 from area_scores b
    where abs(b.cell_y - a.cell_y) <= 2 and abs(b.cell_x - a.cell_x) <= 2
      and (b.cell_y, b.cell_x) <> (a.cell_y, a.cell_x)
      and (b.score > a.score
           or (b.score = a.score and (b.cell_y, b.cell_x) < (a.cell_y, a.cell_x)))
  )
  order by a.score desc
  limit 3;
$$;

revoke execute on function public.recommend_parking(uuid, timestamptz) from public, anon;
grant execute on function public.recommend_parking(uuid, timestamptz) to authenticated;

-- 5. KEEP-ALIVE -----------------------------------------------------------
-- Free Supabase projects pause after ~7 days without activity.
-- A scheduled GitHub Action calls this every few days. It returns 1 and reads no data.

create function public.ping()
returns int
language sql
stable
set search_path = ''
as $$ select 1 $$;

grant execute on function public.ping() to anon, authenticated;

-- 6. MAKE THE OWNER ADMIN -------------------------------------------------
-- At this point the only member is the project owner (added by hand in step 5).
update public.group_members set role = 'admin';
