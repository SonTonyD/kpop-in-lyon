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
  image_path text,
  dominant_color text not null default '#ff6ec7',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.event_requests enable row level security;
alter table public.participant_reviews enable row level security;
alter table public.managed_events enable row level security;

alter table public.managed_events
  add column if not exists image_path text;

alter table public.managed_events
  add column if not exists dominant_color text not null default '#ff6ec7';

insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true)
on conflict (id) do update set public = true;

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

drop policy if exists "Public can read event posters" on storage.objects;
create policy "Public can read event posters"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'event-posters');

drop policy if exists "Managers can upload event posters" on storage.objects;
create policy "Managers can upload event posters"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'event-posters');

drop policy if exists "Managers can update event posters" on storage.objects;
create policy "Managers can update event posters"
on storage.objects
for update
to authenticated
using (bucket_id = 'event-posters')
with check (bucket_id = 'event-posters');

drop policy if exists "Managers can delete event posters" on storage.objects;
create policy "Managers can delete event posters"
on storage.objects
for delete
to authenticated
using (bucket_id = 'event-posters');

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

create table if not exists public.fanpack_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  pack_content text not null,
  banner_image text,
  banner_image_path text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  complete_pack_price numeric(10, 2) check (complete_pack_price is null or complete_pack_price >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.fanpack_campaigns
  add column if not exists banner_image text;

alter table public.fanpack_campaigns
  add column if not exists banner_image_path text;

create table if not exists public.fanpack_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.fanpack_campaigns(id) on delete cascade,
  name text not null,
  stock integer not null default 0 check (stock >= 0),
  max_per_order integer not null default 5 check (max_per_order >= 1),
  display_order integer not null default 1 check (display_order >= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fanpack_orders (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.fanpack_campaigns(id) on delete cascade,
  campaign_name text not null,
  customer_email text not null,
  customer_full_name text not null,
  social_platform text not null check (social_platform in ('instagram', 'twitter')),
  social_username text not null,
  recovery_method text not null check (recovery_method in ('lyon', 'post', 'mondial_relay')),
  postal_address text,
  proof_path text not null,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  status text not null default 'proof_pending' check (
    status in ('proof_pending', 'processing', 'completed', 'rejected', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.fanpack_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.fanpack_orders(id) on delete cascade,
  member_id uuid references public.fanpack_members(id) on delete set null,
  member_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  is_complete_pack boolean not null default false
);

create index if not exists fanpack_members_campaign_id_idx on public.fanpack_members(campaign_id);
create index if not exists fanpack_orders_campaign_id_idx on public.fanpack_orders(campaign_id);
create index if not exists fanpack_order_items_order_id_idx on public.fanpack_order_items(order_id);

alter table public.fanpack_campaigns enable row level security;
alter table public.fanpack_members enable row level security;
alter table public.fanpack_orders enable row level security;
alter table public.fanpack_order_items enable row level security;

insert into storage.buckets (id, name, public)
values ('fanpack-payment-proofs', 'fanpack-payment-proofs', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('fanpack-banners', 'fanpack-banners', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read active fanpack campaigns" on public.fanpack_campaigns;
create policy "Public can read active fanpack campaigns"
on public.fanpack_campaigns
for select
to anon, authenticated
using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Managers can create fanpack campaigns" on public.fanpack_campaigns;
create policy "Managers can create fanpack campaigns"
on public.fanpack_campaigns
for insert
to authenticated
with check (true);

drop policy if exists "Managers can update fanpack campaigns" on public.fanpack_campaigns;
create policy "Managers can update fanpack campaigns"
on public.fanpack_campaigns
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Managers can delete fanpack campaigns" on public.fanpack_campaigns;
create policy "Managers can delete fanpack campaigns"
on public.fanpack_campaigns
for delete
to authenticated
using (true);

drop policy if exists "Public can read active fanpack members" on public.fanpack_members;
create policy "Public can read active fanpack members"
on public.fanpack_members
for select
to anon, authenticated
using (
  auth.role() = 'authenticated'
  or is_active = true
  and exists (
    select 1
    from public.fanpack_campaigns
    where fanpack_campaigns.id = fanpack_members.campaign_id
      and fanpack_campaigns.is_active = true
  )
);

drop policy if exists "Managers can create fanpack members" on public.fanpack_members;
create policy "Managers can create fanpack members"
on public.fanpack_members
for insert
to authenticated
with check (true);

drop policy if exists "Managers can update fanpack members" on public.fanpack_members;
create policy "Managers can update fanpack members"
on public.fanpack_members
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Managers can delete fanpack members" on public.fanpack_members;
create policy "Managers can delete fanpack members"
on public.fanpack_members
for delete
to authenticated
using (true);

drop policy if exists "Managers can read fanpack orders" on public.fanpack_orders;
create policy "Managers can read fanpack orders"
on public.fanpack_orders
for select
to authenticated
using (true);

drop policy if exists "Managers can update fanpack orders" on public.fanpack_orders;
create policy "Managers can update fanpack orders"
on public.fanpack_orders
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Managers can read fanpack order items" on public.fanpack_order_items;
create policy "Managers can read fanpack order items"
on public.fanpack_order_items
for select
to authenticated
using (true);

drop policy if exists "Public can upload fanpack payment proofs" on storage.objects;
create policy "Public can upload fanpack payment proofs"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'fanpack-payment-proofs');

drop policy if exists "Managers can read fanpack payment proofs" on storage.objects;
create policy "Managers can read fanpack payment proofs"
on storage.objects
for select
to authenticated
using (bucket_id = 'fanpack-payment-proofs');

drop policy if exists "Public can read fanpack banners" on storage.objects;
create policy "Public can read fanpack banners"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'fanpack-banners');

drop policy if exists "Managers can upload fanpack banners" on storage.objects;
create policy "Managers can upload fanpack banners"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'fanpack-banners');

drop policy if exists "Managers can update fanpack banners" on storage.objects;
create policy "Managers can update fanpack banners"
on storage.objects
for update
to authenticated
using (bucket_id = 'fanpack-banners')
with check (bucket_id = 'fanpack-banners');

drop policy if exists "Managers can delete fanpack banners" on storage.objects;
create policy "Managers can delete fanpack banners"
on storage.objects
for delete
to authenticated
using (bucket_id = 'fanpack-banners');

create or replace function public.submit_fanpack_order(
  p_campaign_id uuid,
  p_customer_email text,
  p_customer_full_name text,
  p_social_platform text,
  p_social_username text,
  p_recovery_method text,
  p_postal_address text,
  p_proof_path text,
  p_complete_pack_quantity integer,
  p_member_quantities jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.fanpack_campaigns%rowtype;
  v_order_id uuid;
  v_complete_pack_quantity integer := greatest(coalesce(p_complete_pack_quantity, 0), 0);
  v_member record;
  v_member_name text;
  v_quantity integer;
  v_total numeric(10, 2) := 0;
  v_complete_pack_max integer;
begin
  select *
  into v_campaign
  from public.fanpack_campaigns
  where id = p_campaign_id and is_active = true
  for update;

  if not found then
    raise exception 'Fanpack campaign is unavailable';
  end if;

  if p_recovery_method = 'post' and nullif(trim(coalesce(p_postal_address, '')), '') is null then
    raise exception 'Postal address is required';
  end if;

  if nullif(trim(coalesce(p_customer_email, '')), '') is null
    or nullif(trim(coalesce(p_customer_full_name, '')), '') is null
    or nullif(trim(coalesce(p_social_username, '')), '') is null
    or nullif(trim(coalesce(p_proof_path, '')), '') is null then
    raise exception 'Required customer fields are missing';
  end if;

  if p_social_platform not in ('instagram', 'twitter') then
    raise exception 'Invalid social platform';
  end if;

  if p_recovery_method not in ('lyon', 'post', 'mondial_relay') then
    raise exception 'Invalid recovery method';
  end if;

  select coalesce(min(stock), 0)
  into v_complete_pack_max
  from public.fanpack_members
  where campaign_id = p_campaign_id and is_active = true;

  if v_complete_pack_quantity > 0 then
    if v_campaign.complete_pack_price is null then
      raise exception 'Complete pack is not available';
    end if;

    if v_complete_pack_quantity > coalesce(v_complete_pack_max, 0) then
      raise exception 'Not enough stock for complete packs';
    end if;

    update public.fanpack_members
    set stock = stock - v_complete_pack_quantity
    where campaign_id = p_campaign_id and is_active = true;

    v_total := v_total + (v_complete_pack_quantity * v_campaign.complete_pack_price);
  end if;

  for v_member in
    select member_id, quantity
    from jsonb_to_recordset(coalesce(p_member_quantities, '[]'::jsonb)) as items(member_id uuid, quantity integer)
  loop
    v_quantity := greatest(coalesce(v_member.quantity, 0), 0);

    if v_quantity = 0 then
      continue;
    end if;

    update public.fanpack_members
    set stock = stock - v_quantity
    where id = v_member.member_id
      and campaign_id = p_campaign_id
      and is_active = true
      and stock >= v_quantity
      and max_per_order >= v_quantity
    returning name into v_member_name;

    if not found then
      raise exception 'Not enough stock for member %', v_member.member_id;
    end if;

    v_total := v_total + (v_quantity * v_campaign.unit_price);
  end loop;

  if v_total <= 0 then
    raise exception 'Order must contain at least one fanpack';
  end if;

  insert into public.fanpack_orders (
    campaign_id,
    campaign_name,
    customer_email,
    customer_full_name,
    social_platform,
    social_username,
    recovery_method,
    postal_address,
    proof_path,
    total_amount,
    status
  )
  values (
    p_campaign_id,
    v_campaign.name,
    trim(p_customer_email),
    trim(p_customer_full_name),
    p_social_platform,
    trim(p_social_username),
    p_recovery_method,
    case when p_recovery_method = 'post' then trim(p_postal_address) else null end,
    trim(p_proof_path),
    v_total,
    'proof_pending'
  )
  returning id into v_order_id;

  if v_complete_pack_quantity > 0 then
    insert into public.fanpack_order_items (
      order_id,
      member_id,
      member_name,
      quantity,
      unit_price,
      line_total,
      is_complete_pack
    )
    values (
      v_order_id,
      null,
      'Pack complet',
      v_complete_pack_quantity,
      v_campaign.complete_pack_price,
      v_complete_pack_quantity * v_campaign.complete_pack_price,
      true
    );
  end if;

  for v_member in
    select member_id, quantity
    from jsonb_to_recordset(coalesce(p_member_quantities, '[]'::jsonb)) as items(member_id uuid, quantity integer)
  loop
    v_quantity := greatest(coalesce(v_member.quantity, 0), 0);

    if v_quantity = 0 then
      continue;
    end if;

    insert into public.fanpack_order_items (
      order_id,
      member_id,
      member_name,
      quantity,
      unit_price,
      line_total,
      is_complete_pack
    )
    select
      v_order_id,
      fanpack_members.id,
      fanpack_members.name,
      v_quantity,
      v_campaign.unit_price,
      v_quantity * v_campaign.unit_price,
      false
    from public.fanpack_members
    where fanpack_members.id = v_member.member_id;
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.submit_fanpack_order(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  jsonb
) to anon, authenticated;
