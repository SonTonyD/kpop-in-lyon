create extension if not exists "pgcrypto";

create table if not exists public.event_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  fanbase_name text not null,
  email text not null,
  social_links text,
  artist text not null,
  city text not null,
  period text not null,
  collaboration_types text[] not null default '{}',
  decoration_types text[] not null default '{}',
  details text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.participant_reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.event_requests enable row level security;
alter table public.participant_reviews enable row level security;

drop policy if exists "Public can create event requests" on public.event_requests;
create policy "Public can create event requests"
on public.event_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Managers can read event requests" on public.event_requests;
create policy "Managers can read event requests"
on public.event_requests
for select
to authenticated
using (true);

drop policy if exists "Managers can update event requests" on public.event_requests;
create policy "Managers can update event requests"
on public.event_requests
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read published reviews" on public.participant_reviews;
create policy "Public can read published reviews"
on public.participant_reviews
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Managers can read all reviews" on public.participant_reviews;
create policy "Managers can read all reviews"
on public.participant_reviews
for select
to authenticated
using (true);

drop policy if exists "Managers can update reviews" on public.participant_reviews;
create policy "Managers can update reviews"
on public.participant_reviews
for update
to authenticated
using (true)
with check (true);

insert into public.participant_reviews (name, event, rating, comment, is_published)
values
  (
    'Mina92',
    'Cupsleeve SEVENTEEN',
    5,
    'Décoration magnifique, organisation fluide et ambiance chaleureuse du début à la fin.',
    true
  ),
  (
    'HoshiVibes',
    'Carat Night Lyon',
    5,
    'La playlist, les freebies et les espaces photo étaient incroyables. L’expérience était vraiment immersive.',
    true
  ),
  (
    'WonwooLens',
    'Showcase Fan Project',
    4,
    'Mise en place très élégante et équipe adorable. J’aimerais simplement une salle encore plus grande la prochaine fois.',
    true
  )
on conflict do nothing;
