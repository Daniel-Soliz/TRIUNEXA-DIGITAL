-- TRIUNEXA Site Studio 3.0
-- Additive migration: SiteSpec V2, version history and real generation runs.

alter table public.truinexa_site_projects
  add column if not exists spec_version smallint not null default 1,
  add column if not exists briefing jsonb not null default '{}'::jsonb,
  add column if not exists design_direction jsonb not null default '{}'::jsonb,
  add column if not exists quality_report jsonb not null default '{}'::jsonb;

create table if not exists public.truinexa_site_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.truinexa_site_projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  spec_version smallint not null default 2 check (spec_version in (1,2)),
  site_spec jsonb not null,
  briefing jsonb not null default '{}'::jsonb,
  design_direction jsonb not null default '{}'::jsonb,
  quality_report jsonb not null default '{}'::jsonb,
  change_instruction text not null default '',
  generation_mode text not null default 'design_engine'
    check (generation_mode in ('design_engine','openai','legacy')),
  model_name text,
  created_by uuid not null references public.truinexa_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, version_number)
);

create index if not exists truinexa_site_versions_project_idx
  on public.truinexa_site_versions(project_id, version_number desc);

create table if not exists public.truinexa_site_generation_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.truinexa_site_projects(id) on delete cascade,
  requested_by uuid not null references public.truinexa_profiles(id) on delete cascade,
  action text not null default 'generate'
    check (action in ('generate','regenerate','refine','restore')),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','cancelled')),
  current_stage text not null default 'queued',
  progress smallint not null default 0 check (progress between 0 and 100),
  stages jsonb not null default '[]'::jsonb,
  research jsonb not null default '{}'::jsonb,
  briefing jsonb not null default '{}'::jsonb,
  strategy jsonb not null default '{}'::jsonb,
  directions jsonb not null default '[]'::jsonb,
  selected_direction jsonb not null default '{}'::jsonb,
  quality_report jsonb not null default '{}'::jsonb,
  input jsonb not null default '{}'::jsonb,
  error_message text,
  retry_count smallint not null default 0,
  result_version_id uuid references public.truinexa_site_versions(id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists truinexa_site_runs_project_idx
  on public.truinexa_site_generation_runs(project_id, created_at desc);

alter table public.truinexa_site_projects
  add column if not exists active_version_id uuid references public.truinexa_site_versions(id) on delete set null,
  add column if not exists generation_run_id uuid references public.truinexa_site_generation_runs(id) on delete set null;

alter table public.truinexa_site_versions enable row level security;
alter table public.truinexa_site_generation_runs enable row level security;

drop policy if exists site_versions_read_allowed on public.truinexa_site_versions;
create policy site_versions_read_allowed
on public.truinexa_site_versions
for select to authenticated
using (
  truinexa_private.is_active_user()
  and exists (
    select 1
    from public.truinexa_site_projects p
    left join public.truinexa_leads l on l.id = p.lead_id
    where p.id = project_id
      and (
        p.created_by = (select auth.uid())
        or truinexa_private.is_admin()
        or l.responsible_id = (select auth.uid())
        or l.responsible_id is null
      )
  )
);

drop policy if exists site_versions_delete_owner_or_admin on public.truinexa_site_versions;
create policy site_versions_delete_owner_or_admin
on public.truinexa_site_versions
for delete to authenticated
using (
  truinexa_private.is_active_user()
  and exists (
    select 1
    from public.truinexa_site_projects p
    where p.id = project_id
      and (p.created_by = (select auth.uid()) or truinexa_private.is_admin())
  )
);

drop policy if exists site_runs_read_allowed on public.truinexa_site_generation_runs;
create policy site_runs_read_allowed
on public.truinexa_site_generation_runs
for select to authenticated
using (
  truinexa_private.is_active_user()
  and exists (
    select 1
    from public.truinexa_site_projects p
    left join public.truinexa_leads l on l.id = p.lead_id
    where p.id = project_id
      and (
        p.created_by = (select auth.uid())
        or truinexa_private.is_admin()
        or l.responsible_id = (select auth.uid())
        or l.responsible_id is null
      )
  )
);

revoke all on table public.truinexa_site_versions from anon;
revoke all on table public.truinexa_site_generation_runs from anon;
grant select,delete on public.truinexa_site_versions to authenticated;
grant select on public.truinexa_site_generation_runs to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='truinexa_site_generation_runs'
  ) then
    alter publication supabase_realtime
      add table public.truinexa_site_generation_runs;
  end if;
end $$;

create or replace function public.truinexa_site_project_touch()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
