-- Covering indexes for Site Studio 3.0 foreign keys.

create index if not exists truinexa_site_runs_requested_by_idx
  on public.truinexa_site_generation_runs(requested_by);

create index if not exists truinexa_site_runs_result_version_idx
  on public.truinexa_site_generation_runs(result_version_id)
  where result_version_id is not null;

create index if not exists truinexa_site_projects_active_version_idx
  on public.truinexa_site_projects(active_version_id)
  where active_version_id is not null;

create index if not exists truinexa_site_projects_created_by_idx
  on public.truinexa_site_projects(created_by);

create index if not exists truinexa_site_projects_generation_run_idx
  on public.truinexa_site_projects(generation_run_id)
  where generation_run_id is not null;

create index if not exists truinexa_site_versions_created_by_idx
  on public.truinexa_site_versions(created_by);
