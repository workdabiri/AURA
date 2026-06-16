-- AURA-102 — Initial migration: core MVP tables.
--
-- Authority: docs/DATA_MODEL.md, docs/DECISION_LOG.md, docs/TASKS_Project.md (AURA-102).
-- Scope: 11 MVP tables, native enum types, JSONB/i18n fields, the indexing/uniqueness
--        contract (DATA_MODEL §"Indexing and Uniqueness Contract"), the shared
--        set_updated_at() trigger, and RLS ENABLE on every table.
--
-- NOT in scope (enforced by AURA-102 task spec):
--   * RLS POLICIES            -> AURA-103
--   * Auth flow / seed users  -> AURA-104
--   * Storage bucket policies -> AURA-105
--   * rate_limits cleanup job / pg_cron -> AURA-106 (this migration creates the
--     rate_limits table + expires_at column ONLY; no scheduled cleanup here)
--   * seed data of any kind
--
-- Merge-blocker invariants honoured here:
--   * D-05  : no `clients` table, no `client_id` column, no tenant model.
--   * D-18  : whatsapp_clicks stores NO ip / phone / email / user_agent / PII.
--   * D-51  : rate_limits stores key_hash only — NEVER a raw IP.
--   * audit_logs stores NO raw IP.
--   * D-12  : legal_pages.content is structured JSONB (Markdown / controlled rich
--             text) — there is NO raw-HTML column/affordance.
--   * D-16  : property_stakeholders.visibility defaults to internal_only.
--
-- ---------------------------------------------------------------------------------
-- ROLLBACK (down) PATH — run in this order to fully revert this migration:
--
--   -- 1. Drop tables (children before parents; CASCADE clears FKs, indexes, triggers):
--   DROP TABLE IF EXISTS public.rate_limits         CASCADE;
--   DROP TABLE IF EXISTS public.audit_logs          CASCADE;
--   DROP TABLE IF EXISTS public.legal_pages         CASCADE;
--   DROP TABLE IF EXISTS public.settings            CASCADE;
--   DROP TABLE IF EXISTS public.whatsapp_clicks     CASCADE;
--   DROP TABLE IF EXISTS public.leads               CASCADE;
--   DROP TABLE IF EXISTS public.property_stakeholders CASCADE;
--   DROP TABLE IF EXISTS public.property_media      CASCADE;
--   DROP TABLE IF EXISTS public.properties          CASCADE;
--   DROP TABLE IF EXISTS public.areas               CASCADE;
--   DROP TABLE IF EXISTS public.user_profiles       CASCADE;
--   -- 2. Drop the trigger function:
--   DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
--   -- 3. Drop enum types:
--   DROP TYPE IF EXISTS public.legal_page_status        ;
--   DROP TYPE IF EXISTS public.preferred_contact_method ;
--   DROP TYPE IF EXISTS public.lead_priority            ;
--   DROP TYPE IF EXISTS public.lead_source              ;
--   DROP TYPE IF EXISTS public.lead_status              ;
--   DROP TYPE IF EXISTS public.stakeholder_visibility   ;
--   DROP TYPE IF EXISTS public.stakeholder_type         ;
--   DROP TYPE IF EXISTS public.property_media_type      ;
--   DROP TYPE IF EXISTS public.price_visibility         ;
--   DROP TYPE IF EXISTS public.furnishing_status        ;
--   DROP TYPE IF EXISTS public.rental_period            ;
--   DROP TYPE IF EXISTS public.availability_status      ;
--   DROP TYPE IF EXISTS public.property_type            ;
--   DROP TYPE IF EXISTS public.market_type              ;
--   DROP TYPE IF EXISTS public.transaction_type         ;
--   DROP TYPE IF EXISTS public.publish_status           ;
--   DROP TYPE IF EXISTS public.user_role                ;
-- ---------------------------------------------------------------------------------

begin;

-- =================================================================================
-- 1. ENUM TYPES (native PostgreSQL enums — D-36 / D-37: never overload `status`)
-- =================================================================================

create type public.user_role as enum ('super_admin', 'client_admin');

create type public.publish_status as enum ('draft', 'published', 'archived');

create type public.transaction_type as enum ('sale', 'rent');

create type public.market_type as enum ('ready', 'off_plan');

create type public.property_type as enum (
  'apartment', 'villa', 'townhouse', 'penthouse',
  'office', 'plot', 'retail', 'warehouse'
);

create type public.availability_status as enum (
  'available', 'reserved', 'sold', 'rented', 'unavailable'
);

create type public.rental_period as enum ('yearly', 'monthly', 'weekly', 'daily');

create type public.furnishing_status as enum (
  'furnished', 'semi_furnished', 'unfurnished', 'unknown'
);

create type public.price_visibility as enum ('visible', 'price_on_application');

create type public.property_media_type as enum ('image', 'floorplan');

create type public.stakeholder_type as enum (
  'developer', 'owner', 'seller', 'landlord', 'sales_partner', 'exclusive_agent'
);

create type public.stakeholder_visibility as enum ('internal_only', 'public');

create type public.lead_status as enum (
  'new', 'contacted', 'qualified', 'unqualified', 'won', 'lost', 'archived'
);

create type public.lead_source as enum (
  'homepage', 'listing', 'property_detail', 'contact_page', 'whatsapp_cta', 'sales_demo'
);

create type public.lead_priority as enum ('low', 'normal', 'high');

create type public.preferred_contact_method as enum ('phone', 'whatsapp', 'email');

create type public.legal_page_status as enum ('draft', 'published', 'archived');

-- =================================================================================
-- 2. SHARED updated_at TRIGGER FUNCTION
-- =================================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =================================================================================
-- 3. TABLES
-- =================================================================================

-- ---- user_profiles --------------------------------------------------------------
create table public.user_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- areas ----------------------------------------------------------------------
create table public.areas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  image_url   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- properties -----------------------------------------------------------------
create table public.properties (
  id                   uuid primary key default gen_random_uuid(),
  reference_number     text not null unique,
  slug                 text not null unique,
  title                jsonb not null default '{}'::jsonb,
  description          jsonb not null default '{}'::jsonb,
  -- Generated, stored projection of the English title for search/sort (DATA_MODEL contract).
  title_en             text generated always as (title ->> 'en') stored,
  price                numeric,
  currency             text not null default 'AED',
  price_visibility     public.price_visibility not null default 'visible',
  transaction_type     public.transaction_type not null,
  market_type          public.market_type not null,
  property_type        public.property_type not null,
  availability_status  public.availability_status not null default 'available',
  rental_period        public.rental_period,
  publish_status       public.publish_status not null default 'draft',
  area_id              uuid references public.areas (id) on delete set null,
  community            text,
  sub_community        text,
  building_name        text,
  location_label       text not null,
  address              text,
  external_map_url     text,
  bedrooms             integer,
  bathrooms            integer,
  parking              integer,
  size_sqft            numeric not null,
  size_sqm             numeric,
  furnishing_status    public.furnishing_status not null default 'unknown',
  amenities            jsonb not null default '[]'::jsonb,
  rera_number          text,
  permit_number        text,
  agent_name           text,
  agent_phone          text,
  agent_whatsapp       text,
  agent_email          text,
  developer_name       text,
  handover_date        date,
  completion_percentage integer,
  down_payment_amount  numeric,
  payment_plan_summary text,
  is_featured          boolean not null default false,
  views_count          integer,
  created_by           uuid references public.user_profiles (id) on delete set null,
  updated_by           uuid references public.user_profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  published_at         timestamptz,
  archived_at          timestamptz
);

-- ---- property_media -------------------------------------------------------------
create table public.property_media (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties (id) on delete cascade,
  url          text not null,
  -- UUID-based storage path to prevent enumeration (media-path rule).
  storage_path text not null,
  media_type   public.property_media_type not null,
  order_index  integer not null default 0,
  is_cover     boolean not null default false,
  alt_text     text not null default '',
  width        integer,
  height       integer,
  size_bytes   integer not null check (size_bytes >= 0),
  created_at   timestamptz not null default now()
);

-- ---- property_stakeholders ------------------------------------------------------
create table public.property_stakeholders (
  id                      uuid primary key default gen_random_uuid(),
  property_id             uuid not null references public.properties (id) on delete cascade,
  name                    text not null,
  type                    public.stakeholder_type not null,
  phone                   text,
  email                   text,
  whatsapp                text,
  registration_or_license text,
  internal_notes          text,
  -- D-16: internal by default; public exposure must be explicit.
  visibility              public.stakeholder_visibility not null default 'internal_only',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ---- leads ----------------------------------------------------------------------
create table public.leads (
  id                       uuid primary key default gen_random_uuid(),
  property_id              uuid references public.properties (id) on delete set null,
  name                     text not null,
  phone                    text not null,
  email                    text,
  message                  text,
  preferred_contact_method public.preferred_contact_method not null default 'phone',
  source                   public.lead_source not null,
  selected_goal            text,
  selected_area            text,
  selected_budget          text,
  selected_bedrooms        text,
  selected_property_type   text,
  language                 text not null default 'en',
  status                   public.lead_status not null default 'new',
  priority                 public.lead_priority not null default 'normal',
  notes                    text,
  archived_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---- whatsapp_clicks ------------------------------------------------------------
-- D-18: NO ip address, NO phone, NO email, NO personal data, NO user-agent fingerprint.
create table public.whatsapp_clicks (
  id                uuid primary key default gen_random_uuid(),
  source            text not null,
  property_id       uuid references public.properties (id) on delete set null,
  selected_goal     text,
  selected_area     text,
  selected_budget   text,
  selected_bedrooms text,
  language          text default 'en',
  created_at        timestamptz not null default now()
);

-- ---- settings -------------------------------------------------------------------
create table public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_by uuid references public.user_profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---- legal_pages ----------------------------------------------------------------
-- D-12: `content` is structured JSONB (Markdown / controlled rich text). There is
-- deliberately NO raw-HTML column or affordance.
create table public.legal_pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  title           jsonb not null default '{}'::jsonb,
  content         jsonb not null default '{}'::jsonb,
  version         integer not null default 1,
  effective_date  date not null,
  status          public.legal_page_status not null default 'draft',
  last_updated_by uuid references public.user_profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz
);

-- ---- audit_logs (append-only) ---------------------------------------------------
-- No raw IP stored.
create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   uuid references public.user_profiles (id) on delete set null,
  actor_role      text not null,
  action          text not null,
  entity_type     text not null,
  entity_id       text,
  before_snapshot jsonb,
  after_snapshot  jsonb,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- ---- rate_limits ----------------------------------------------------------------
-- D-51: key_hash = salted-hash(IP + route) computed server-side. Raw IP is NEVER
-- stored. 24h TTL via expires_at; the scheduled cleanup job is AURA-106 (not here).
create table public.rate_limits (
  key_hash     text primary key,
  route        text not null,
  count        integer not null default 0,
  window_start timestamptz not null default now(),
  expires_at   timestamptz not null
);

-- =================================================================================
-- 4. INDEXES + UNIQUENESS CONTRACT (DATA_MODEL §"Indexing and Uniqueness Contract")
--    (properties.slug / reference_number and areas.slug uniqueness are declared
--     inline above as UNIQUE constraints.)
-- =================================================================================

-- Partial unique: only one PUBLISHED legal page per slug.
create unique index legal_pages_slug_published_key
  on public.legal_pages (slug)
  where status = 'published';

-- Composite indexes on properties.
create index properties_publish_status_is_featured_idx
  on public.properties (publish_status, is_featured);

create index properties_publish_status_created_at_idx
  on public.properties (publish_status, created_at desc);

-- FK indexes.
create index property_media_property_id_idx
  on public.property_media (property_id);

create index property_stakeholders_property_id_idx
  on public.property_stakeholders (property_id);

create index leads_property_id_idx
  on public.leads (property_id);

create index whatsapp_clicks_property_id_idx
  on public.whatsapp_clicks (property_id);

create index audit_logs_entity_type_entity_id_idx
  on public.audit_logs (entity_type, entity_id);

-- Full-text search GIN index over the generated English title.
create index properties_title_en_fts_idx
  on public.properties
  using gin (to_tsvector('english', coalesce(title_en, '')));

-- =================================================================================
-- 5. updated_at TRIGGERS (only tables whose DATA_MODEL row marks updated_at "Auto")
-- =================================================================================

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create trigger areas_set_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create trigger property_stakeholders_set_updated_at
  before update on public.property_stakeholders
  for each row execute function public.set_updated_at();

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create trigger legal_pages_set_updated_at
  before update on public.legal_pages
  for each row execute function public.set_updated_at();

-- =================================================================================
-- 6. ROW-LEVEL SECURITY — ENABLE on every MVP table (default-deny).
--    Policies are authored in AURA-103. With RLS enabled and no policies, anon and
--    authenticated roles are denied by default; service_role bypasses RLS.
-- =================================================================================

alter table public.user_profiles        enable row level security;
alter table public.areas                 enable row level security;
alter table public.properties            enable row level security;
alter table public.property_media        enable row level security;
alter table public.property_stakeholders enable row level security;
alter table public.leads                 enable row level security;
alter table public.whatsapp_clicks       enable row level security;
alter table public.settings              enable row level security;
alter table public.legal_pages           enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.rate_limits           enable row level security;

commit;
