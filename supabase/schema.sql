-- =====================================================================
--  FIVE₅ COFFEE — SOUQ YARD
--  Supabase schema: tables, RLS, and the two RPCs the public site calls.
--
--  HOW TO RUN
--  1. Supabase dashboard → SQL Editor → New query
--  2. Paste this whole file → Run
--  3. Authentication → Users → Add user  (this is your admin login)
--
--  SECURITY MODEL
--  - Anonymous visitors can READ the menu, zones, tables and settings.
--  - Anonymous visitors can NEVER read the bookings table (names, phones).
--  - Availability reaches the site through availability_for(), which returns
--    only "which table ids are taken" — no personal data at all.
--  - A booking is created through book_table(), which re-checks the table is
--    free inside the transaction, so two people clicking the same table at
--    the same second cannot both get it.
-- =====================================================================

-- ---------- clean re-run -------------------------------------------------
drop function if exists public.book_table(text,text,date,int,int,text,uuid,text) cascade;
drop function if exists public.availability_for(date,int);
drop function if exists public.day_load(date);
drop table if exists public.bookings cascade;
drop table if exists public.tables cascade;
drop table if exists public.zones cascade;
drop table if exists public.menu_items cascade;
drop table if exists public.settings cascade;
drop type if exists public.booking_status;

create type public.booking_status as enum ('pending','confirmed','seated','cancelled','no_show');

-- ---------- zones --------------------------------------------------------
create table public.zones (
  id        text primary key,
  name_ar   text not null,
  name_en   text not null,
  blurb_ar  text default '',
  blurb_en  text default '',
  sort      int  not null default 0
);

-- ---------- tables (the floor map) --------------------------------------
-- x / y are percentages (0-100) of the floor-plan box, so the map is responsive.
create table public.tables (
  id       uuid primary key default gen_random_uuid(),
  zone_id  text not null references public.zones(id) on delete cascade,
  label    text not null,
  seats    int  not null check (seats between 1 and 20),
  x        numeric(5,2) not null check (x between 0 and 100),
  y        numeric(5,2) not null check (y between 0 and 100),
  shape    text not null default 'round' check (shape in ('round','square','booth')),
  active   boolean not null default true,
  sort     int not null default 0
);
create index tables_zone_idx on public.tables(zone_id);

-- ---------- menu ---------------------------------------------------------
create table public.menu_items (
  id        uuid primary key default gen_random_uuid(),
  cat       text not null,
  name_ar   text not null,
  name_en   text not null,
  desc_ar   text default '',
  desc_en   text default '',
  price     numeric(6,2),                 -- null = price hidden on the site
  mood      text[] not null default '{}', -- used by the mood finder
  featured  boolean not null default false,
  active    boolean not null default true,
  sort      int not null default 0
);
create index menu_cat_idx on public.menu_items(cat) where active;

-- ---------- settings (single row) ---------------------------------------
create table public.settings (
  id          int primary key default 1 check (id = 1),
  open_min    int  not null default 600,   -- 10:00
  close_min   int  not null default 1500,  -- 01:00 next day (24*60 + 60)
  slot_min    int  not null default 30,
  hold_min    int  not null default 90,    -- how long a table is held
  max_party   int  not null default 12,
  phone       text not null default '0792225059',
  whatsapp    text not null default '962792225059',
  instagram   text not null default 'five5coffee',
  address_ar  text not null default 'شارع الأميرة ثروت، عمّان',
  address_en  text not null default 'Princess Tharwat St, Amman',
  plus_code   text not null default 'XR8V+VR Amman',
  updated_at  timestamptz not null default now()
);

-- ---------- bookings -----------------------------------------------------
create table public.bookings (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name       text not null check (char_length(trim(name)) between 2 and 80),
  phone      text not null check (phone ~ '^07[0-9]{8}$'),
  book_date  date not null,
  time_min   int  not null check (time_min between 0 and 1560),
  party      int  not null check (party between 1 and 20),
  zone_id    text not null references public.zones(id),
  table_id   uuid references public.tables(id) on delete set null,
  notes      text default '',
  status     public.booking_status not null default 'pending',
  source     text not null default 'web',
  created_at timestamptz not null default now()
);
create index bookings_date_idx  on public.bookings(book_date);
create index bookings_table_idx on public.bookings(table_id, book_date);
create index bookings_live_idx  on public.bookings(book_date, time_min)
  where status <> 'cancelled';

-- =====================================================================
--  ROW LEVEL SECURITY
-- =====================================================================
alter table public.zones      enable row level security;
alter table public.tables     enable row level security;
alter table public.menu_items enable row level security;
alter table public.settings   enable row level security;
alter table public.bookings   enable row level security;

-- public reference data: readable by everyone, writable only when signed in
create policy "zones readable"  on public.zones      for select using (true);
create policy "tables readable" on public.tables     for select using (true);
create policy "menu readable"   on public.menu_items for select using (active or auth.role() = 'authenticated');
create policy "settings read"   on public.settings   for select using (true);

create policy "zones admin"    on public.zones      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "tables admin"   on public.tables     for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "menu admin"     on public.menu_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "settings admin" on public.settings   for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- bookings: staff only. The public never touches this table directly —
-- it goes through book_table(), which is SECURITY DEFINER.
create policy "bookings admin" on public.bookings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Table-level GRANTs. RLS decides *which rows*; GRANT decides *which tables* a
-- role may touch at all. Both are needed. Note `anon` gets nothing on bookings.
grant select on public.zones, public.tables, public.menu_items, public.settings
  to anon, authenticated;
grant select, insert, update, delete
  on public.zones, public.tables, public.menu_items, public.settings, public.bookings
  to authenticated;

-- =====================================================================
--  RPC 1 — availability_for(date, time)
--  Returns one row per table: is it taken at that moment, and by how many.
--  No name, no phone, nothing personal. Safe for anonymous callers.
-- =====================================================================
create or replace function public.availability_for(p_date date, p_time int)
returns table (table_id uuid, zone_id text, seats int, taken boolean)
language sql
security definer
set search_path = public
stable
as $$
  select t.id,
         t.zone_id,
         t.seats,
         exists (
           select 1
           from public.bookings b, public.settings s
           where s.id = 1
             and b.table_id  = t.id
             and b.book_date = p_date
             and b.status not in ('cancelled','no_show')
             -- [b.start, b.start+hold) overlaps [p_time, p_time+hold)
             and b.time_min < p_time + s.hold_min
             and p_time     < b.time_min + s.hold_min
         ) as taken
  from public.tables t
  where t.active
  order by t.zone_id, t.sort, t.label;
$$;

-- =====================================================================
--  RPC 1b — day_load(date)
--  How many tables are still free at each bookable time of one day.
--  Lets the site grey out busy slots without exposing any booking.
-- =====================================================================
create or replace function public.day_load(p_date date)
returns table (time_min int, free_tables int)
language sql
security definer
set search_path = public
stable
as $$
  with s as (select * from public.settings where id = 1),
       slots as (select generate_series(s.open_min, s.close_min - 60, s.slot_min) as tm from s),
       total as (select count(*)::int as n from public.tables where active)
  select sl.tm::int,
         (total.n - coalesce(busy.n, 0))::int
  from slots sl
  cross join total
  cross join s
  left join lateral (
    select count(distinct b.table_id)::int as n
    from public.bookings b
    where b.book_date = p_date
      and b.status not in ('cancelled','no_show')
      and b.table_id is not null
      and b.time_min < sl.tm + s.hold_min
      and sl.tm     < b.time_min + s.hold_min
  ) busy on true
  order by sl.tm;
$$;

grant execute on function public.day_load(date) to anon, authenticated;

-- =====================================================================
--  RPC 2 — book_table(...)
--  Validates, re-checks the table inside the transaction, inserts, and
--  returns the booking code. Raises a readable error otherwise.
-- =====================================================================
create or replace function public.book_table(
  p_name    text,
  p_phone   text,
  p_date    date,
  p_time    int,
  p_party   int,
  p_zone    text,
  p_table   uuid default null,
  p_notes   text default ''
)
returns jsonb            -- {code, table_label, id} — a single value, so no
                         -- OUT-parameter name can collide with a column name
language plpgsql
security definer
set search_path = public
as $$
declare
  s           public.settings%rowtype;
  chosen      public.tables%rowtype;
  new_code    text;
  new_id      uuid;
  clean_phone text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
begin
  select * into s from public.settings st where st.id = 1;

  -- ---- validation ------------------------------------------------------
  if char_length(trim(coalesce(p_name,''))) < 2 then
    raise exception 'INVALID_NAME';
  end if;
  if clean_phone !~ '^07[0-9]{8}$' then
    raise exception 'INVALID_PHONE';
  end if;
  if p_date < (now() at time zone 'Asia/Amman')::date then
    raise exception 'INVALID_DATE';
  end if;
  if p_date > (now() at time zone 'Asia/Amman')::date + 60 then
    raise exception 'DATE_TOO_FAR';
  end if;
  if p_party < 1 or p_party > s.max_party then
    raise exception 'INVALID_PARTY';
  end if;
  if p_time < s.open_min or p_time > s.close_min - 60 then
    raise exception 'CLOSED_AT_THAT_TIME';
  end if;

  -- ---- pick the table --------------------------------------------------
  if p_table is not null then
    select t.* into chosen from public.tables t
    where t.id = p_table and t.active for update;
    if not found then raise exception 'NO_SUCH_TABLE'; end if;
    if chosen.seats < p_party then raise exception 'TABLE_TOO_SMALL'; end if;
  else
    -- smallest table in the zone that fits the party AND is still free
    select t.* into chosen
    from public.tables t
    where t.active and t.zone_id = p_zone and t.seats >= p_party
      and not exists (
        select 1 from public.bookings b
        where b.table_id  = t.id
          and b.book_date = p_date
          and b.status not in ('cancelled','no_show')
          and b.time_min < p_time + s.hold_min
          and p_time     < b.time_min + s.hold_min
      )
    order by t.seats asc, t.sort asc
    limit 1
    for update;
    if not found then raise exception 'NO_TABLE_FITS'; end if;
  end if;

  -- ---- the race-safe part ---------------------------------------------
  if exists (
    select 1 from public.bookings b
    where b.table_id  = chosen.id
      and b.book_date = p_date
      and b.status not in ('cancelled','no_show')
      and b.time_min < p_time + s.hold_min
      and p_time     < b.time_min + s.hold_min
  ) then
    raise exception 'TABLE_TAKEN';
  end if;

  -- ---- insert ----------------------------------------------------------
  new_code := 'FV-' || to_char(p_date,'MMDD') || '-' ||
              upper(substr(md5(gen_random_uuid()::text), 1, 4));

  insert into public.bookings (code,name,phone,book_date,time_min,party,zone_id,table_id,notes)
  values (new_code, trim(p_name), clean_phone, p_date, p_time, p_party,
          chosen.zone_id, chosen.id, left(coalesce(p_notes,''), 300))
  returning bookings.id into new_id;

  return jsonb_build_object(
    'code', new_code,
    'table_label', chosen.label,
    'zone_id', chosen.zone_id,
    'id', new_id
  );
end;
$$;

revoke all on function public.book_table(text,text,date,int,int,text,uuid,text) from public;
grant execute on function public.availability_for(date,int) to anon, authenticated;
grant execute on function public.book_table(text,text,date,int,int,text,uuid,text) to anon, authenticated;

-- =====================================================================
--  SEED
--  Replace the menu, capacities and coordinates with the real ones —
--  everything here is editable from the admin dashboard afterwards.
-- =====================================================================
insert into public.settings (id) values (1);

insert into public.zones (id, name_ar, name_en, blurb_ar, blurb_en, sort) values
 ('inside',  'جلسة داخلية', 'Indoor',        'هدوء وإضاءة دافية وإنترنت',       'Warm light, low volume, working Wi-Fi', 1),
 ('terrace', 'تراس خارجي',  'Terrace',       'برّا تحت الهوا',                   'Outside, under the sky',                2),
 ('shisha',  'ركن الشيشة',  'Shisha corner', 'ركن الشيشة على التراس',            'The shisha corner on the terrace',      3);

insert into public.tables (zone_id, label, seats, x, y, shape, sort) values
 -- indoor · 40 seats
 ('inside','T1',2,12,16,'round',1),  ('inside','T2',2,30,16,'round',2),
 ('inside','T3',4,52,15,'square',3), ('inside','T4',4,74,15,'square',4),
 ('inside','T5',2,12,42,'round',5),  ('inside','T6',4,32,44,'square',6),
 ('inside','T7',4,54,44,'square',7), ('inside','T8',6,80,45,'booth',8),
 ('inside','T9',2,12,72,'round',9),  ('inside','T10',4,34,74,'square',10),
 ('inside','T11',4,58,74,'square',11),('inside','T12',4,82,75,'booth',12),
 -- terrace · 24 seats
 ('terrace','A1',2,14,20,'round',1), ('terrace','A2',2,36,18,'round',2),
 ('terrace','A3',4,60,20,'square',3),('terrace','A4',4,84,22,'square',4),
 ('terrace','A5',2,14,62,'round',5), ('terrace','A6',2,36,64,'round',6),
 ('terrace','A7',4,60,66,'square',7),('terrace','A8',4,84,64,'square',8),
 -- shisha · 18 seats
 ('shisha','S1',3,18,22,'booth',1),  ('shisha','S2',3,50,20,'booth',2),
 ('shisha','S3',3,82,24,'booth',3),  ('shisha','S4',3,18,68,'booth',4),
 ('shisha','S5',3,50,70,'booth',5),  ('shisha','S6',3,82,66,'booth',6);

insert into public.menu_items (cat,name_ar,name_en,desc_ar,desc_en,mood,featured,sort) values
 ('coffee','V60 درِپ','V60 Drip','تحضير يدوي على مهل — طعم صافي وحموضة مضبوطة','Hand-poured slowly — clean cup, balanced acidity','{calm,plain,hot}',true,1),
 ('coffee','كولد برو','Cold Brew','منقوع ١٨ ساعة — قوي وناعم وبارد','Steeped 18 hours — strong, smooth, cold','{awake,plain,cold}',false,2),
 ('coffee','كراميل ماكياتو','Caramel Macchiato','إسبريسو، حليب مبخّر، وطبقة كراميل','Espresso, steamed milk and a caramel layer','{sweet,hot,cozy}',true,3),
 ('coffee','قهوة أمريكية','American Coffee','إسبريسو مطوّل بالمي الساخن — سادة وصافي','Espresso lengthened with hot water','{awake,plain,hot}',false,4),
 ('coffee','فلات وايت','Flat White','إسبريسو مزدوج مع حليب مخملي','Double espresso, velvet milk','{awake,plain,hot}',false,5),
 ('coffee','آيس لاتيه','Iced Latte','لاتيه على ثلج — للأيام الحرّة','Latte over ice — for the hot days','{calm,sweet,cold}',false,6),
 ('tea','شاي بالنعنع','Mint Tea','شاي أحمر ونعنع طازة','Black tea with fresh mint','{calm,plain,hot}',false,7),
 ('tea','ماتشا لاتيه','Matcha Latte','ماتشا يابانية مع حليب','Japanese matcha with milk','{calm,sweet,hot}',false,8),
 ('bakery','فطيرة زعتر','Zaatar Fatira','طازة من الفرن، بتيجي مع القهوة الصبحية','Straight out of the oven','{plain,cozy}',true,9),
 ('bakery','كرواسون جبنة','Cheese Croissant','مقرمش من برّا وطري من جوّا','Crisp outside, soft inside','{cozy,sweet}',false,10),
 ('dessert','براوني','Brownie','شوكولا كثيفة وطرية — الزوّار بيوصوا فيها','Dense, soft chocolate — guests call it out by name','{sweet,cozy}',true,11),
 ('dessert','تشيز كيك','Cheesecake','قطعة كلاسيكية مع صوص التوت','A classic slice with berry sauce','{sweet,cozy}',false,12),
 ('food','سندويشة حلومي','Halloumi Sandwich','حلومي مشوي، زعتر وطماطم','Grilled halloumi, zaatar and tomato','{plain,cozy}',false,13),
 ('food','بولة أكاي','Acai Bowl','أكاي مع فواكه وجرانولا','Acai with fruit and granola','{calm,sweet,cold}',false,14);
