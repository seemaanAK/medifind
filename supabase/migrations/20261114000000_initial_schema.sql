-- MediFind Production Schema Migration
-- Migration: 20261114000000_initial_schema.sql
-- Enables UUID extension if not already available
create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    phone_e164 text,
    country_code text not null default '+91',
    country text not null default 'IN',
    preferred_state text,
    preferred_city text,
    preferred_language text not null default 'en',
    notification_preferences jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint profiles_country_code_check
        check (country_code = '+91'),

    constraint profiles_country_check
        check (country = 'IN'),

    constraint profiles_display_name_length
        check (
            display_name is null
            or char_length(display_name) <= 100
        ),

    constraint profiles_phone_format
        check (
            phone_e164 is null
            or phone_e164 ~ '^\+91[6-9][0-9]{9}$'
        )
);

create index if not exists idx_profiles_preferred_state
    on public.profiles(preferred_state);

-- 2. MEDICINES CATALOG
create table if not exists public.medicines (
    id uuid primary key default gen_random_uuid(),
    external_source text not null,
    external_id text,
    name text not null,
    normalized_name text not null,
    manufacturer text,
    active_ingredients jsonb,
    approved_uses text,
    precautions text,
    warnings text,
    storage_information text,
    source_name text not null,
    source_url text,
    verification_status text not null default 'unverified',
    verified_at timestamptz,
    source_updated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint medicines_verification_status_check
        check (
            verification_status in (
                'verified',
                'unverified',
                'incomplete',
                'withdrawn'
            )
        ),

    constraint medicines_name_length
        check (
            char_length(name) between 1 and 200
        ),

    constraint medicines_source_name_length
        check (
            char_length(source_name) between 1 and 200
        ),

    constraint medicines_verified_metadata_check
        check (
            verification_status <> 'verified'
            or (
                source_url is not null
                and verified_at is not null
            )
        )
);

create unique index if not exists idx_medicines_source_external_id
    on public.medicines(external_source, external_id)
    where external_id is not null;

create index if not exists idx_medicines_normalized_name
    on public.medicines(normalized_name);

create index if not exists idx_medicines_verification_status
    on public.medicines(verification_status);

-- 3. PHARMACIES
create table if not exists public.pharmacies (
    id uuid primary key default gen_random_uuid(),
    external_source text not null,
    external_id text,
    name text not null,
    address text,
    state text,
    city text,
    area text,
    pin_code text,
    latitude double precision,
    longitude double precision,
    phone text,
    operating_hours jsonb,
    source_url text,
    verification_status text not null default 'unverified',
    verified_at timestamptz,
    source_updated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pharmacies_pin_code_check
        check (
            pin_code is null
            or pin_code ~ '^[1-9][0-9]{5}$'
        ),

    constraint pharmacies_latitude_check
        check (
            latitude is null
            or latitude between -90 and 90
        ),

    constraint pharmacies_longitude_check
        check (
            longitude is null
            or longitude between -180 and 180
        ),

    constraint pharmacies_verification_status_check
        check (
            verification_status in (
                'verified',
                'unverified',
                'incomplete',
                'withdrawn'
            )
        )
);

create unique index if not exists idx_pharmacies_source_external_id
    on public.pharmacies(external_source, external_id)
    where external_id is not null;

create index if not exists idx_pharmacies_location
    on public.pharmacies(state, city, pin_code);

create index if not exists idx_pharmacies_name
    on public.pharmacies(name);

-- 4. PHARMACY INVENTORY AVAILABILITY
create table if not exists public.pharmacy_inventory (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid not null
        references public.pharmacies(id) on delete cascade,
    medicine_id uuid not null
        references public.medicines(id) on delete restrict,
    availability_status text not null,
    price_inr numeric(12,2),
    currency text not null default 'INR',
    source_name text not null,
    source_updated_at timestamptz,
    verified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pharmacy_inventory_status_check
        check (
            availability_status in (
                'in_stock',
                'out_of_stock',
                'unknown'
            )
        ),

    constraint pharmacy_inventory_price_check
        check (
            price_inr is null
            or price_inr >= 0
        ),

    constraint pharmacy_inventory_currency_check
        check (currency = 'INR')
);

create index if not exists idx_pharmacy_inventory_medicine
    on public.pharmacy_inventory(medicine_id);

create index if not exists idx_pharmacy_inventory_pharmacy
    on public.pharmacy_inventory(pharmacy_id);

create index if not exists idx_pharmacy_inventory_freshness
    on public.pharmacy_inventory(source_updated_at);

-- 5. PRESCRIPTION SCHEDULES
create table if not exists public.prescription_schedules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null
        references auth.users(id) on delete cascade,
    medicine_id uuid
        references public.medicines(id) on delete set null,
    medicine_name text not null,
    prescribed_dosage text not null,
    prescribed_times jsonb not null,
    start_date date,
    end_date date,
    prescribed_duration_text text,
    prescription_reference text,
    clinician_name text,
    notes text,
    reminder_enabled boolean not null default false,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint prescription_schedules_name_length
        check (
            char_length(medicine_name) between 1 and 200
        ),

    constraint prescription_schedules_dosage_length
        check (
            char_length(prescribed_dosage) between 1 and 500
        ),

    constraint prescription_schedules_times_array
        check (
            jsonb_typeof(prescribed_times) = 'array'
            and jsonb_array_length(prescribed_times) between 1 and 24
        ),

    constraint prescription_schedules_date_order
        check (
            start_date is null
            or end_date is null
            or end_date >= start_date
        ),

    constraint prescription_schedules_status_check
        check (
            status in (
                'active',
                'paused',
                'completed',
                'cancelled'
            )
        )
);

create index if not exists idx_prescription_schedules_user
    on public.prescription_schedules(user_id);

create index if not exists idx_prescription_schedules_user_status
    on public.prescription_schedules(user_id, status);

-- 6. DOSE EVENTS
create table if not exists public.dose_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null
        references auth.users(id) on delete cascade,
    schedule_id uuid not null
        references public.prescription_schedules(id) on delete cascade,
    scheduled_at timestamptz not null,
    status text not null default 'pending',
    recorded_at timestamptz,
    created_at timestamptz not null default now(),

    constraint dose_events_status_check
        check (
            status in (
                'pending',
                'taken',
                'skipped'
            )
        ),

    constraint dose_events_recorded_at_check
        check (
            status = 'pending'
            or recorded_at is not null
        )
);

create index if not exists idx_dose_events_user_schedule
    on public.dose_events(user_id, schedule_id);

create index if not exists idx_dose_events_scheduled_at
    on public.dose_events(user_id, scheduled_at);

-- 7. FIRST AID ITEMS
create table if not exists public.first_aid_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null
        references auth.users(id) on delete cascade,
    item_name text not null,
    quantity numeric(12,3) not null default 1,
    unit text not null default 'item',
    expiry_date date,
    storage_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint first_aid_item_name_length
        check (
            char_length(item_name) between 1 and 200
        ),

    constraint first_aid_quantity_check
        check (quantity >= 0),

    constraint first_aid_unit_length
        check (
            char_length(unit) between 1 and 40
        )
);

create index if not exists idx_first_aid_items_user
    on public.first_aid_items(user_id);

create index if not exists idx_first_aid_items_expiry
    on public.first_aid_items(user_id, expiry_date);

-- 8. EMERGENCY CONTACTS
create table if not exists public.emergency_contacts (
    id uuid primary key default gen_random_uuid(),
    display_name text not null,
    phone_number text not null,
    service_type text not null,
    country_code text not null default 'IN',
    state_code text,
    region_name text,
    coverage_type text not null,
    verification_status text not null default 'unverified',
    verification_source_name text,
    verification_source_url text,
    last_checked_at timestamptz,
    notes text,
    is_active boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint emergency_contacts_country_check
        check (country_code = 'IN'),

    constraint emergency_contacts_coverage_check
        check (
            coverage_type in (
                'nationwide',
                'state',
                'region'
            )
        ),

    constraint emergency_contacts_verification_check
        check (
            verification_status in (
                'verified',
                'unverified',
                'expired',
                'withdrawn'
            )
        ),

    constraint emergency_contacts_verified_metadata_check
        check (
            verification_status <> 'verified'
            or (
                verification_source_name is not null
                and verification_source_url is not null
                and last_checked_at is not null
            )
        )
);

create index if not exists idx_emergency_contacts_region
    on public.emergency_contacts(
        country_code,
        state_code,
        coverage_type
    );

create index if not exists idx_emergency_contacts_active
    on public.emergency_contacts(is_active, verification_status);

-- 9. FIRST AID ARTICLES
create table if not exists public.first_aid_articles (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    topic text not null,
    summary text,
    content text not null,
    source_name text not null,
    source_url text not null,
    verification_status text not null default 'unverified',
    verified_at timestamptz,
    is_published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint first_aid_articles_status_check
        check (
            verification_status in (
                'verified',
                'unverified',
                'withdrawn'
            )
        ),

    constraint first_aid_articles_verified_metadata_check
        check (
            verification_status <> 'verified'
            or verified_at is not null
        )
);

create index if not exists idx_first_aid_articles_topic
    on public.first_aid_articles(topic);

create index if not exists idx_first_aid_articles_published
    on public.first_aid_articles(is_published);

-- 10. ADMINISTRATIVE AUDIT LOG
create table if not exists public.admin_audit_log (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created_at
    on public.admin_audit_log(created_at desc);

create index if not exists idx_admin_audit_log_actor
    on public.admin_audit_log(actor_user_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.prescription_schedules enable row level security;
alter table public.first_aid_items enable row level security;
alter table public.dose_events enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.medicines enable row level security;
alter table public.pharmacies enable row level security;
alter table public.pharmacy_inventory enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.first_aid_articles enable row level security;

-- PROFILES RLS
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- PRESCRIPTION SCHEDULES RLS
create policy "Users can read their own schedules"
on public.prescription_schedules
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own schedules"
on public.prescription_schedules
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own schedules"
on public.prescription_schedules
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own schedules"
on public.prescription_schedules
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- DOSE EVENTS RLS
create policy "Users can read their own dose events"
on public.dose_events
for select
to authenticated
using (
    (select auth.uid()) = user_id
    and exists (
        select 1 from public.prescription_schedules s
        where s.id = dose_events.schedule_id and s.user_id = (select auth.uid())
    )
);

create policy "Users can insert their own dose events"
on public.dose_events
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
    and exists (
        select 1 from public.prescription_schedules s
        where s.id = dose_events.schedule_id and s.user_id = (select auth.uid())
    )
);

create policy "Users can update their own dose events"
on public.dose_events
for update
to authenticated
using (
    (select auth.uid()) = user_id
    and exists (
        select 1 from public.prescription_schedules s
        where s.id = dose_events.schedule_id and s.user_id = (select auth.uid())
    )
)
with check (
    (select auth.uid()) = user_id
    and exists (
        select 1 from public.prescription_schedules s
        where s.id = dose_events.schedule_id and s.user_id = (select auth.uid())
    )
);

create policy "Users can delete their own dose events"
on public.dose_events
for delete
to authenticated
using (
    (select auth.uid()) = user_id
    and exists (
        select 1 from public.prescription_schedules s
        where s.id = dose_events.schedule_id and s.user_id = (select auth.uid())
    )
);

-- FIRST AID ITEMS RLS
create policy "Users can read their own first aid items"
on public.first_aid_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own first aid items"
on public.first_aid_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own first aid items"
on public.first_aid_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own first aid items"
on public.first_aid_items
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- PUBLIC READ-ONLY POLICIES FOR CATALOGS & EMERGENCY
create policy "Public can read verified and incomplete medicines"
on public.medicines
for select
to anon, authenticated
using (verification_status in ('verified', 'incomplete'));

create policy "Public can read pharmacies"
on public.pharmacies
for select
to anon, authenticated
using (true);

create policy "Public can read pharmacy inventory"
on public.pharmacy_inventory
for select
to anon, authenticated
using (true);

create policy "Public can read active emergency contacts"
on public.emergency_contacts
for select
to anon, authenticated
using (is_active = true and verification_status = 'verified');

create policy "Public can read published first aid articles"
on public.first_aid_articles
for select
to anon, authenticated
using (is_published = true);

-- ADMIN AUDIT LOG: Only service role can read/insert by default
create policy "No direct user access to admin audit log"
on public.admin_audit_log
for all
to authenticated, anon
using (false);
