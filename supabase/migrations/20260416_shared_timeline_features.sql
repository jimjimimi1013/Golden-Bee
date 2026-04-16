alter table public.tasks
add column if not exists is_important boolean not null default false;

alter table public.tasks
add column if not exists deleted_at timestamptz;

create table if not exists public.timeline_state (
  id text primary key,
  memo text not null default '',
  phase_order text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_custom_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

insert into public.timeline_state (id, memo, phase_order)
values ('main', '', '{}')
on conflict (id) do nothing;
