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
  rating integer check (rating between 1 and 5),
  comment text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.managed_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  date_label text not null, 
  time_label text not null,
  location text not null,
  country text not null,
  format text not null,
  capacity text not null,
  image text not null default 'assets/event-hero.svg',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.event_requests enable row level security;
alter table public.participant_reviews enable row level security;
alter table public.managed_events enable row level security;

alter table public.participant_reviews
  alter column rating drop not null;

alter table public.participant_reviews
  drop constraint if exists participant_reviews_comment_length;

alter table public.participant_reviews
  add constraint participant_reviews_comment_length
  check (char_length(comment) between 10 and 220);

update public.participant_reviews
set rating = 5
where rating is null;

alter table public.participant_reviews
  alter column rating set not null;

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

drop policy if exists "Managers can delete event requests" on public.event_requests;
create policy "Managers can delete event requests"
on public.event_requests
for delete
to authenticated
using (true);

drop policy if exists "Public can read published reviews" on public.participant_reviews;
create policy "Public can read published reviews"
on public.participant_reviews
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Public can create pending reviews" on public.participant_reviews;
create policy "Public can create pending reviews"
on public.participant_reviews
for insert
to anon, authenticated
with check (is_published = false and rating between 1 and 5);

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

drop policy if exists "Managers can delete reviews" on public.participant_reviews;
create policy "Managers can delete reviews"
on public.participant_reviews
for delete
to authenticated
using (true);

drop policy if exists "Public can read active managed events" on public.managed_events;
create policy "Public can read active managed events"
on public.managed_events
for select
to anon, authenticated
using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Managers can create managed events" on public.managed_events;
create policy "Managers can create managed events"
on public.managed_events
for insert
to authenticated
with check (true);

drop policy if exists "Managers can update managed events" on public.managed_events;
create policy "Managers can update managed events"
on public.managed_events
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Managers can delete managed events" on public.managed_events;
create policy "Managers can delete managed events"
on public.managed_events
for delete
to authenticated
using (true);

insert into public.managed_events (
  title,
  description,
  starts_at,
  date_label,
  time_label,
  location,
  country,
  format,
  capacity,
  image,
  is_active
)
values (
  'SEVENTEEN ÉVÈNEMENT',
  'Un évènement fan dédié à SEVENTEEN, pensé pour rassembler les fans autour de leur univers.',
  '2026-05-19T19:00:00+02:00',
  '19 mai 2026',
  '19:00',
  'Lyon',
  'France',
  'Évènement fan',
  'Capacité 250 personnes',
  'assets/event-hero.svg',
  true
)
on conflict do nothing;

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
    'La playlist, les cadeaux et les espaces photo étaient incroyables. L’expérience était vraiment immersive.',
    true
  ),
  (
    'WonwooLens',
    'Projet fan showcase',
    4,
    'Mise en place très élégante et équipe adorable. J’aimerais simplement une salle encore plus grande la prochaine fois.',
    true
  )
on conflict do nothing;
