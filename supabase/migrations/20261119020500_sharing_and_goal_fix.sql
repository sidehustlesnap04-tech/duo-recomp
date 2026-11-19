-- Decision 2: partners see each other's agreed fitness progress, with consent per metric.
-- Private tables stay private. A trigger derives only the metrics a person has switched on.

create table if not exists public.sharing_prefs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  duo_id uuid not null references public.duos(id) on delete cascade,
  metric_key text not null check (metric_key in
    ('weight','body_fat','waist','steps','sleep','calories','protein','workout_volume')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, duo_id, metric_key)
);

create table if not exists public.shared_metrics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  duo_id uuid not null references public.duos(id) on delete cascade,
  metric_date date not null,
  metric_key text not null,
  value numeric(10,2) not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, metric_date, metric_key)
);
create index if not exists shared_metrics_duo_idx on public.shared_metrics(duo_id, metric_key, metric_date);

create or replace function public.metric_enabled(p_user uuid, p_duo uuid, p_key text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select enabled from public.sharing_prefs
                   where user_id = p_user and duo_id = p_duo and metric_key = p_key), false);
$$;

-- Recomputes one person's shared metrics for one day, honouring their switches.
create or replace function public.sync_shared_metrics(p_user uuid, p_date date)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_duo uuid;
  v_vals jsonb := '{}'::jsonb;
  k text;
begin
  select duo_id into v_duo from public.duo_members where user_id = p_user limit 1;
  if v_duo is null then return; end if;

  select coalesce(jsonb_object_agg(key, val), '{}'::jsonb) into v_vals from (
    select 'weight' as key, weight_kg as val from public.body_measurements
      where user_id = p_user and taken_on = p_date and weight_kg is not null
    union all
    select 'body_fat', body_fat_pct from public.body_measurements
      where user_id = p_user and taken_on = p_date and body_fat_pct is not null
    union all
    select 'waist', waist_cm from public.body_measurements
      where user_id = p_user and taken_on = p_date and waist_cm is not null
    union all
    select 'steps', steps from public.day_logs
      where user_id = p_user and log_date = p_date and steps is not null
    union all
    select 'sleep', sleep_h from public.day_logs
      where user_id = p_user and log_date = p_date and sleep_h is not null
    union all
    select 'calories', sum(kcal) from public.food_entries
      where user_id = p_user and log_date = p_date having sum(kcal) > 0
    union all
    select 'protein', sum(protein_g) from public.food_entries
      where user_id = p_user and log_date = p_date having sum(protein_g) > 0
    union all
    select 'workout_volume', sum(coalesce(weight_kg,0) * coalesce(reps,0)) from public.workout_sets
      where user_id = p_user and log_date = p_date having sum(coalesce(weight_kg,0) * coalesce(reps,0)) > 0
  ) s;

  foreach k in array array['weight','body_fat','waist','steps','sleep','calories','protein','workout_volume'] loop
    if public.metric_enabled(p_user, v_duo, k) and v_vals ? k then
      insert into public.shared_metrics (user_id, duo_id, metric_date, metric_key, value, updated_at)
      values (p_user, v_duo, p_date, k, (v_vals ->> k)::numeric, now())
      on conflict (user_id, metric_date, metric_key)
        do update set value = excluded.value, duo_id = excluded.duo_id, updated_at = now();
    else
      delete from public.shared_metrics
       where user_id = p_user and metric_date = p_date and metric_key = k;
    end if;
  end loop;
end; $$;

create or replace function public.trg_sync_metrics()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid; v_date date;
begin
  if tg_op = 'DELETE' then
    v_user := old.user_id;
    v_date := coalesce(to_jsonb(old) ->> 'log_date', to_jsonb(old) ->> 'taken_on')::date;
  else
    v_user := new.user_id;
    v_date := coalesce(to_jsonb(new) ->> 'log_date', to_jsonb(new) ->> 'taken_on')::date;
  end if;
  perform public.sync_shared_metrics(v_user, v_date);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;

drop trigger if exists body_measurements_share on public.body_measurements;
create trigger body_measurements_share after insert or update or delete on public.body_measurements
for each row execute function public.trg_sync_metrics();

drop trigger if exists day_logs_share on public.day_logs;
create trigger day_logs_share after insert or update or delete on public.day_logs
for each row execute function public.trg_sync_metrics();

drop trigger if exists food_entries_share on public.food_entries;
create trigger food_entries_share after insert or update or delete on public.food_entries
for each row execute function public.trg_sync_metrics();

drop trigger if exists workout_sets_share on public.workout_sets;
create trigger workout_sets_share after insert or update or delete on public.workout_sets
for each row execute function public.trg_sync_metrics();

-- Flipping a switch backfills history, or removes it. Consent is retroactive both ways.
create or replace function public.trg_sharing_pref_changed()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare d date;
begin
  if new.enabled then
    for d in
      select distinct dt from (
        select taken_on as dt from public.body_measurements where user_id = new.user_id
        union select log_date from public.day_logs where user_id = new.user_id
        union select log_date from public.food_entries where user_id = new.user_id
        union select log_date from public.workout_sets where user_id = new.user_id
      ) x
    loop
      perform public.sync_shared_metrics(new.user_id, d);
    end loop;
  else
    delete from public.shared_metrics
     where user_id = new.user_id and metric_key = new.metric_key;
  end if;
  return new;
end; $$;

drop trigger if exists sharing_prefs_changed on public.sharing_prefs;
create trigger sharing_prefs_changed after insert or update of enabled on public.sharing_prefs
for each row execute function public.trg_sharing_pref_changed();

alter table public.sharing_prefs enable row level security;
drop policy if exists sharing_prefs_own on public.sharing_prefs;
create policy sharing_prefs_own on public.sharing_prefs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_duo_member(duo_id));
drop policy if exists sharing_prefs_partner_read on public.sharing_prefs;
create policy sharing_prefs_partner_read on public.sharing_prefs for select
  using (public.is_duo_member(duo_id));

alter table public.shared_metrics enable row level security;
drop policy if exists shared_metrics_select on public.shared_metrics;
create policy shared_metrics_select on public.shared_metrics for select
  using (public.is_duo_member(duo_id));
-- No write policy: only the trigger writes this table.

-- Fix: either partner may now tick off or edit a goal the other created.
drop policy if exists shared_goals_all on public.shared_goals;
create policy shared_goals_select on public.shared_goals for select using (public.is_duo_member(duo_id));
create policy shared_goals_insert on public.shared_goals for insert
  with check (public.is_duo_member(duo_id) and created_by = auth.uid());
create policy shared_goals_update on public.shared_goals for update
  using (public.is_duo_member(duo_id)) with check (public.is_duo_member(duo_id));
create policy shared_goals_delete on public.shared_goals for delete
  using (public.is_duo_member(duo_id) and created_by = auth.uid());

revoke execute on function public.sync_shared_metrics(uuid, date) from public, anon, authenticated;
revoke execute on function public.trg_sync_metrics() from public, anon, authenticated;
revoke execute on function public.trg_sharing_pref_changed() from public, anon, authenticated;
revoke execute on function public.metric_enabled(uuid, uuid, text) from public, anon;
grant execute on function public.metric_enabled(uuid, uuid, text) to authenticated;
