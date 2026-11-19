-- One round trip for duo + members instead of three chained selects.
-- security invoker: RLS still applies, no privilege escalation.
create or replace function public.session_bootstrap()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with my as (
    select duo_id from duo_members where user_id = auth.uid() limit 1
  )
  select jsonb_build_object(
    'duo', (select to_jsonb(d) from duos d join my on my.duo_id = d.id),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', m.user_id,
        'role', m.role,
        'display_name', coalesce(p.display_name, 'Player'),
        'mascot', coalesce(p.mascot, 'fox')
      ) order by m.role)
      from duo_members m
      left join profiles p on p.id = m.user_id
      where m.duo_id = (select duo_id from my)
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.session_bootstrap() from public, anon;
grant execute on function public.session_bootstrap() to authenticated;
