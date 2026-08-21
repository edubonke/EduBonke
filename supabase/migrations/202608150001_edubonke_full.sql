-- EduBonke v1.0 — Supabase/PostgreSQL schema for the R0 prototype.
-- Run this once in a new Supabase project through SQL Editor.
-- Synthetic test information only until the production-readiness gates are completed.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_number text,
  institution_type text not null default 'private_college',
  email text,
  phone text,
  address text,
  logo_url text,
  invite_code text unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  responsible_party_name text,
  information_officer_name text,
  retention_policy_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institution_memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('college_admin','academic_manager','lecturer','assessor','moderator','finance_officer','student','workplace_supervisor')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, profile_id)
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null, code text not null, address text, status text not null default 'active',
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (institution_id, code)
);

create table public.academic_periods (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null, start_date date not null, end_date date not null, status text not null default 'active',
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_date >= start_date), unique (institution_id, name)
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  code text not null, title text not null, nqf_level text not null, saqa_id text, credits integer not null default 0,
  delivery_mode text not null check (delivery_mode in ('classroom','blended','online','workplace')),
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (institution_id, code)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade, code text not null, title text not null,
  unit_standard_reference text, credits integer not null default 0, status text not null default 'active',
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (institution_id, code)
);

create table public.programme_modules (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade, sequence_number integer not null default 1,
  is_compulsory boolean not null default true, created_at timestamptz not null default now(),
  unique (programme_id, module_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null, programme_id uuid not null references public.programmes(id), campus_id uuid references public.campuses(id),
  academic_period_id uuid references public.academic_periods(id), facilitator_id uuid references public.profiles(id),
  capacity integer, status text not null default 'active', created_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  reference_number text not null, first_name text not null, last_name text not null, email text not null, phone text,
  programme_id uuid not null references public.programmes(id), intake_date date not null,
  status text not null default 'received' check (status in ('received','reviewing','accepted','declined','waitlisted')),
  notes text, submitted_at timestamptz not null default now(), reviewed_by uuid references public.profiles(id),
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (institution_id, reference_number)
);

create table public.students (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  auth_user_id uuid references public.profiles(id), student_number text not null, identity_reference text,
  first_name text not null, last_name text not null, email text not null, phone text,
  date_of_birth date, nationality text default 'South African', emergency_contact text,
  status text not null default 'active' check (status in ('active','inactive','graduated','withdrawn')),
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (institution_id, student_number), unique (institution_id, auth_user_id)
);

create table public.student_status_history (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade, previous_status text, new_status text not null,
  reason text, changed_by uuid default auth.uid(), created_at timestamptz not null default now()
);

create table public.student_documents (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade, document_type text not null, title text not null,
  file_name text not null, storage_path text not null unique, content_type text not null, size_bytes bigint not null,
  verification_status text not null default 'received', uploaded_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.enrolments (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade, programme_id uuid not null references public.programmes(id),
  academic_period_id uuid references public.academic_periods(id), class_id uuid references public.classes(id),
  start_date date not null, expected_end_date date not null,
  status text not null default 'active' check (status in ('planned','active','completed','withdrawn')),
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (student_id, programme_id, start_date)
);

create table public.workplace_placements (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  supervisor_profile_id uuid not null references public.profiles(id), employer_name text not null,
  start_date date not null, end_date date, status text not null default 'active' check (status in ('planned','active','completed','cancelled')),
  notes text, created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (student_id, supervisor_profile_id, start_date)
);

create table public.timetable_entries (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade, module_id uuid references public.modules(id),
  title text not null, session_date date not null, start_time time not null, end_time time not null,
  venue text not null, facilitator_id uuid references public.profiles(id),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade, timetable_entry_id uuid references public.timetable_entries(id),
  session_date date not null, topic text not null, status text not null default 'open' check (status in ('open','closed','cancelled')),
  opened_by uuid default auth.uid(), closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('present','absent','late','excused')), note text,
  recorded_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (attendance_session_id, student_id)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  programme_id uuid not null references public.programmes(id), module_id uuid references public.modules(id),
  title text not null, assessment_type text not null check (assessment_type in ('formative','summative','practical','poe','workplace')),
  maximum_marks numeric(8,2) not null default 100, due_date date not null,
  status text not null default 'published' check (status in ('draft','published','closed')),
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.assessment_results (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  outcome text not null check (outcome in ('not_started','submitted','competent','not_yet_competent')),
  score numeric(8,2), feedback text, assessor_id uuid default auth.uid(),
  moderation_status text not null default 'not_required' check (moderation_status in ('not_required','pending','upheld','changed')),
  assessed_at timestamptz default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);

create table public.evidence_documents (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade, assessment_id uuid references public.assessments(id),
  evidence_type text not null check (evidence_type in ('poe','workplace','logbook','assessment_support')),
  title text not null, file_name text not null, storage_path text not null unique, content_type text not null, size_bytes bigint not null,
  status text not null default 'received' check (status in ('received','verified','returned','rejected')),
  uploaded_by uuid default auth.uid(), reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.moderation_records (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  assessment_result_id uuid not null references public.assessment_results(id) on delete cascade,
  moderator_id uuid default auth.uid(), decision text not null check (decision in ('pending','upheld','changed','returned')),
  comments text, moderated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id), invoice_number text not null, issue_date date not null, due_date date not null,
  description text, subtotal numeric(12,2) not null default 0, tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0, balance numeric(12,2) not null default 0,
  status text not null default 'issued' check (status in ('draft','issued','part_paid','paid','overdue','cancelled')),
  created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (institution_id, invoice_number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade, description text not null,
  quantity numeric(10,2) not null default 1, unit_price numeric(12,2) not null, line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id), student_id uuid not null references public.students(id),
  amount numeric(12,2) not null check (amount > 0), payment_date date not null,
  payment_method text not null check (payment_method in ('eft','cash','card','debit_order','bursary')),
  reference_number text not null, status text not null default 'confirmed' check (status in ('pending','confirmed','reversed')),
  recorded_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.funding_records (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id), funding_type text not null,
  provider_name text, reference_number text, approved_amount numeric(12,2) not null default 0,
  status text not null default 'pending', notes text, created_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null, body text not null, audience text not null check (audience in ('all','staff','students','finance')),
  status text not null default 'published', published_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade, title text not null, body text not null,
  link text, read_at timestamptz, created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  ticket_number text not null default ('TKT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  subject text not null, description text not null, category text not null, priority text not null default 'normal',
  status text not null default 'open' check (status in ('open','in_progress','waiting','resolved','closed')),
  created_by uuid default auth.uid(), assigned_to uuid references public.profiles(id), resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (institution_id, ticket_number)
);

create table public.support_ticket_comments (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade, body text not null,
  created_by uuid default auth.uid(), created_at timestamptz not null default now()
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  requester_reference text not null, request_type text not null check (request_type in ('access','correction','deletion','objection','restriction')),
  status text not null default 'open' check (status in ('open','reviewing','resolved','declined')),
  due_date date, notes text, outcome text, owner_id uuid references public.profiles(id),
  created_by uuid default auth.uid(), resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid references public.students(id), data_subject_reference text not null, purpose text not null,
  status text not null check (status in ('granted','withdrawn','not_required')),
  lawful_basis text default 'consent', captured_by uuid default auth.uid(), captured_at timestamptz not null default now(),
  withdrawn_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.data_incidents (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  reference_number text not null, severity text not null check (severity in ('low','medium','high','critical')),
  description text not null, discovered_at timestamptz not null, status text not null default 'reported',
  information_officer_notified_at timestamptz, regulator_notified_at timestamptz, data_subjects_notified_at timestamptz,
  resolution text, created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (institution_id, reference_number)
);

create table public.institution_invites (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  email text not null, role text not null check (role in ('college_admin','academic_manager','lecturer','assessor','moderator','finance_officer','student','workplace_supervisor')),
  code text not null unique, expires_at timestamptz not null, used_at timestamptz, used_by uuid references public.profiles(id),
  created_by uuid default auth.uid(), created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id) on delete cascade,
  plan_code text not null default 'prototype_free', status text not null default 'active',
  starts_at timestamptz not null default now(), ends_at timestamptz, external_reference text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (institution_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key, institution_id uuid not null references public.institutions(id) on delete cascade,
  actor_id uuid, actor_email text, action text not null, entity_type text not null, entity_id text,
  old_values jsonb, new_values jsonb, created_at timestamptz not null default now()
);

create index memberships_profile_idx on public.institution_memberships(profile_id, status);
create index students_institution_idx on public.students(institution_id, status);
create index applications_status_idx on public.applications(institution_id, status);
create index enrolments_student_idx on public.enrolments(institution_id, student_id);
create index placements_supervisor_idx on public.workplace_placements(institution_id, supervisor_profile_id);
create index timetable_date_idx on public.timetable_entries(institution_id, session_date);
create index attendance_student_idx on public.attendance_records(institution_id, student_id);
create index results_student_idx on public.assessment_results(institution_id, student_id);
create index evidence_student_idx on public.evidence_documents(institution_id, student_id);
create index invoices_student_idx on public.invoices(institution_id, student_id, status);
create index audit_institution_idx on public.audit_logs(institution_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','institutions','institution_memberships','campuses','academic_periods','programmes','modules','classes','applications','students','student_documents','enrolments','workplace_placements','timetable_entries','attendance_sessions','attendance_records','assessments','assessment_results','evidence_documents','moderation_records','invoices','payments','funding_records','announcements','support_tickets','privacy_requests','consent_records','data_incidents','subscriptions'] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name) values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_super_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.can_access_institution(p_institution_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or exists (
    select 1 from public.institution_memberships where institution_id = p_institution_id and profile_id = auth.uid() and status = 'active'
  )
$$;

create or replace function public.has_institution_role(p_institution_id uuid, p_roles text[]) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or exists (
    select 1 from public.institution_memberships where institution_id = p_institution_id and profile_id = auth.uid() and status = 'active' and role = any(p_roles)
  )
$$;

create or replace function public.can_read_student(p_institution_id uuid, p_student_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.has_institution_role(p_institution_id, array['college_admin','academic_manager','lecturer','assessor','moderator','finance_officer'])
    or exists (select 1 from public.students where id = p_student_id and institution_id = p_institution_id and auth_user_id = auth.uid())
    or exists (select 1 from public.workplace_placements where student_id = p_student_id and institution_id = p_institution_id and supervisor_profile_id = auth.uid() and status = 'active')
$$;

create or replace function public.can_read_learning_record(p_institution_id uuid, p_student_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.has_institution_role(p_institution_id, array['college_admin','academic_manager','lecturer','assessor','moderator'])
    or exists (select 1 from public.students where id = p_student_id and institution_id = p_institution_id and auth_user_id = auth.uid())
    or exists (select 1 from public.workplace_placements where student_id = p_student_id and institution_id = p_institution_id and supervisor_profile_id = auth.uid() and status = 'active')
$$;

create or replace function public.enforce_tenant_reference() returns trigger language plpgsql security definer set search_path = public as $$
declare reference_id uuid; reference_is_valid boolean;
begin
  reference_id := nullif(to_jsonb(new)->>tg_argv[0], '')::uuid;
  if reference_id is null then return new; end if;
  execute format('select exists(select 1 from public.%I where id = $1 and institution_id = $2)', tg_argv[1])
    into reference_is_valid using reference_id, new.institution_id;
  if not reference_is_valid then raise exception 'Referenced % record does not belong to this college', tg_argv[1]; end if;
  return new;
end; $$;

create or replace function public.enforce_tenant_member_reference() returns trigger language plpgsql security definer set search_path = public as $$
declare profile_reference uuid; member_is_valid boolean;
begin
  profile_reference := nullif(to_jsonb(new)->>tg_argv[0], '')::uuid;
  if profile_reference is null then return new; end if;
  select exists(select 1 from public.institution_memberships where institution_id = new.institution_id and profile_id = profile_reference and status = 'active' and role = any(string_to_array(tg_argv[1], ','))) into member_is_valid;
  if not member_is_valid then raise exception 'Referenced account is not an authorised member of this college'; end if;
  return new;
end; $$;

do $$ declare spec text; parts text[]; begin
  foreach spec in array array[
    'modules:programme_id:programmes','programme_modules:programme_id:programmes','programme_modules:module_id:modules',
    'classes:programme_id:programmes','classes:campus_id:campuses','classes:academic_period_id:academic_periods',
    'applications:programme_id:programmes','student_status_history:student_id:students','student_documents:student_id:students',
    'enrolments:student_id:students','enrolments:programme_id:programmes','enrolments:academic_period_id:academic_periods','enrolments:class_id:classes',
    'workplace_placements:student_id:students','timetable_entries:class_id:classes','timetable_entries:module_id:modules',
    'attendance_sessions:class_id:classes','attendance_sessions:timetable_entry_id:timetable_entries',
    'attendance_records:attendance_session_id:attendance_sessions','attendance_records:student_id:students',
    'assessments:programme_id:programmes','assessments:module_id:modules','assessment_results:assessment_id:assessments','assessment_results:student_id:students',
    'evidence_documents:student_id:students','evidence_documents:assessment_id:assessments','moderation_records:assessment_result_id:assessment_results',
    'invoices:student_id:students','invoice_items:invoice_id:invoices','payments:invoice_id:invoices','payments:student_id:students',
    'funding_records:student_id:students','support_ticket_comments:ticket_id:support_tickets','consent_records:student_id:students'
  ] loop
    parts := string_to_array(spec, ':');
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.enforce_tenant_reference(%L,%L)', 'tenant_' || parts[1] || '_' || parts[2], parts[1], parts[2], parts[3]);
  end loop;
end $$;

do $$ declare spec text; parts text[]; begin
  foreach spec in array array[
    'students:auth_user_id:student','workplace_placements:supervisor_profile_id:workplace_supervisor',
    'classes:facilitator_id:college_admin,academic_manager,lecturer','timetable_entries:facilitator_id:college_admin,academic_manager,lecturer',
    'applications:reviewed_by:college_admin,academic_manager','assessment_results:assessor_id:college_admin,academic_manager,assessor,moderator',
    'evidence_documents:reviewed_by:college_admin,academic_manager,lecturer,assessor,moderator','moderation_records:moderator_id:college_admin,moderator',
    'notifications:profile_id:college_admin,academic_manager,lecturer,assessor,moderator,finance_officer,student,workplace_supervisor'
  ] loop
    parts := string_to_array(spec, ':');
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.enforce_tenant_member_reference(%L,%L)', 'member_' || parts[1] || '_' || parts[2], parts[1], parts[2], parts[3]);
  end loop;
end $$;

create or replace function public.create_institution_with_owner(p_name text, p_registration_number text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(p_name)) < 3 then raise exception 'Enter a valid college name'; end if;
  insert into public.institutions(name, registration_number, created_by) values (trim(p_name), nullif(trim(p_registration_number),''), auth.uid()) returning id into new_id;
  insert into public.institution_memberships(institution_id, profile_id, role) values (new_id, auth.uid(), 'college_admin');
  insert into public.subscriptions(institution_id, plan_code, status) values (new_id, 'prototype_free', 'active');
  return new_id;
end; $$;

create or replace function public.join_institution_by_code(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare selected_invite public.institution_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into selected_invite from public.institution_invites where code = upper(trim(p_code)) and used_at is null and expires_at > now() for update;
  if selected_invite.id is null then raise exception 'Invite code is invalid, expired or already used'; end if;
  if lower(selected_invite.email) <> lower(coalesce(auth.jwt()->>'email','')) then raise exception 'This invite was issued to another email address'; end if;
  insert into public.institution_memberships(institution_id, profile_id, role) values (selected_invite.institution_id, auth.uid(), selected_invite.role)
  on conflict (institution_id, profile_id) do update set role = excluded.role, status = 'active', updated_at = now();
  update public.institution_invites set used_at = now(), used_by = auth.uid() where id = selected_invite.id;
  return selected_invite.institution_id;
end; $$;

create or replace function public.protect_last_college_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' and old.role = 'college_admin' and old.status = 'active' then
    if (select count(*) from public.institution_memberships where institution_id = old.institution_id and role = 'college_admin' and status = 'active' and id <> old.id) = 0 then
      raise exception 'Every college must retain at least one active college administrator';
    end if;
    return old;
  end if;
  if old.role = 'college_admin' and old.status = 'active' and (new.role <> 'college_admin' or new.status <> 'active') then
    if (select count(*) from public.institution_memberships where institution_id = old.institution_id and role = 'college_admin' and status = 'active' and id <> old.id) = 0 then
      raise exception 'Every college must retain at least one active college administrator';
    end if;
  end if;
  return new;
end; $$;
create trigger protect_last_college_admin before update or delete on public.institution_memberships for each row execute function public.protect_last_college_admin();

create or replace function public.track_student_status_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into public.student_status_history(institution_id, student_id, previous_status, new_status, changed_by)
    values (new.institution_id, new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end; $$;
create trigger track_student_status after update of status on public.students for each row execute function public.track_student_status_change();

create or replace function public.update_invoice_balance() returns trigger language plpgsql security definer set search_path = public as $$
declare target_invoice uuid; paid numeric(12,2);
begin
  if tg_op = 'DELETE' then target_invoice := old.invoice_id; else target_invoice := new.invoice_id; end if;
  select coalesce(sum(amount),0) into paid from public.payments where invoice_id = target_invoice and status = 'confirmed';
  update public.invoices set balance = greatest(total_amount - paid, 0), status = case when paid <= 0 then 'issued' when paid >= total_amount then 'paid' else 'part_paid' end where id = target_invoice;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;
create trigger payments_update_invoice after insert or update or delete on public.payments for each row execute function public.update_invoice_balance();

create or replace function public.set_initial_invoice_balance() returns trigger language plpgsql as $$
begin if new.balance = 0 then new.balance := new.total_amount; end if; return new; end; $$;
create trigger invoice_initial_balance before insert on public.invoices for each row execute function public.set_initial_invoice_balance();

create or replace function public.audit_row_change() returns trigger language plpgsql security definer set search_path = public as $$
declare record_json jsonb; old_clean jsonb; new_clean jsonb; institution uuid; record_id text;
begin
  if tg_op = 'DELETE' then record_json := to_jsonb(old); else record_json := to_jsonb(new); end if;
  if tg_op in ('UPDATE','DELETE') then old_clean := to_jsonb(old) - array['identity_reference','email','phone','date_of_birth','emergency_contact','description','notes','feedback','body']; end if;
  if tg_op in ('INSERT','UPDATE') then new_clean := to_jsonb(new) - array['identity_reference','email','phone','date_of_birth','emergency_contact','description','notes','feedback','body']; end if;
  institution := (record_json->>'institution_id')::uuid;
  record_id := record_json->>'id';
  insert into public.audit_logs(institution_id, actor_id, actor_email, action, entity_type, entity_id, old_values, new_values)
  values (institution, auth.uid(), coalesce(auth.jwt()->>'email','system'), lower(tg_op), tg_table_name, record_id,
    old_clean, new_clean);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;

do $$ declare table_name text; begin
  foreach table_name in array array['campuses','academic_periods','programmes','modules','classes','applications','students','student_documents','enrolments','workplace_placements','timetable_entries','attendance_sessions','attendance_records','assessments','assessment_results','evidence_documents','moderation_records','invoices','payments','funding_records','announcements','support_tickets','privacy_requests','consent_records','data_incidents','institution_invites'] loop
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row_change()', table_name, table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','institutions','institution_memberships','campuses','academic_periods','programmes','modules','programme_modules','classes','applications','students','student_status_history','student_documents','enrolments','workplace_placements','timetable_entries','attendance_sessions','attendance_records','assessments','assessment_results','evidence_documents','moderation_records','invoices','invoice_items','payments','funding_records','announcements','notifications','support_tickets','support_ticket_comments','privacy_requests','consent_records','data_incidents','institution_invites','subscriptions','audit_logs'] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_super_admin() or exists (
    select 1 from public.institution_memberships mine join public.institution_memberships theirs on theirs.institution_id = mine.institution_id
    where mine.profile_id = auth.uid() and mine.status = 'active' and mine.role in ('college_admin','academic_manager','finance_officer') and theirs.profile_id = profiles.id
  )
);
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy institutions_read on public.institutions for select to authenticated using (public.can_access_institution(id));
create policy institutions_update on public.institutions for update to authenticated using (public.has_institution_role(id, array['college_admin'])) with check (public.has_institution_role(id, array['college_admin']));
create policy memberships_read on public.institution_memberships for select to authenticated using (profile_id = auth.uid() or public.has_institution_role(institution_id, array['college_admin','academic_manager','finance_officer']));
create policy memberships_manage on public.institution_memberships for all to authenticated using (public.has_institution_role(institution_id, array['college_admin'])) with check (public.has_institution_role(institution_id, array['college_admin']));

do $$ declare table_name text; begin
  foreach table_name in array array['campuses','academic_periods','programmes','modules','programme_modules','classes','timetable_entries','attendance_sessions','assessments'] loop
    execute format('create policy %I_read on public.%I for select to authenticated using (public.can_access_institution(institution_id))', table_name, table_name);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.has_institution_role(institution_id, array[''college_admin'',''academic_manager'',''lecturer'',''assessor'',''moderator''])) with check (public.has_institution_role(institution_id, array[''college_admin'',''academic_manager'',''lecturer'',''assessor'',''moderator'']))', table_name, table_name);
  end loop;
end $$;

create policy announcements_read on public.announcements for select to authenticated using (
  public.can_access_institution(institution_id) and (
    audience = 'all'
    or (audience = 'staff' and public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer','assessor','moderator','finance_officer']))
    or (audience = 'students' and public.has_institution_role(institution_id, array['college_admin','academic_manager','student']))
    or (audience = 'finance' and public.has_institution_role(institution_id, array['college_admin','finance_officer']))
  )
);
create policy announcements_write on public.announcements for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer','assessor','moderator','finance_officer'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer','assessor','moderator','finance_officer']));

create policy applications_read on public.applications for select to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer']));
create policy applications_write on public.applications for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy students_read on public.students for select to authenticated using (public.can_read_student(institution_id, id));
create policy students_write on public.students for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy student_history_read on public.student_status_history for select to authenticated using (public.can_read_student(institution_id, student_id));
create policy student_history_write on public.student_status_history for insert to authenticated with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy student_documents_read on public.student_documents for select to authenticated using (public.can_read_learning_record(institution_id, student_id));
create policy student_documents_write on public.student_documents for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer']));
create policy enrolments_read on public.enrolments for select to authenticated using (public.can_read_student(institution_id, student_id));
create policy enrolments_write on public.enrolments for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy placements_read on public.workplace_placements for select to authenticated using (public.can_read_learning_record(institution_id, student_id));
create policy placements_write on public.workplace_placements for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy attendance_read on public.attendance_records for select to authenticated using (public.can_read_learning_record(institution_id, student_id));
create policy attendance_write on public.attendance_records for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer']));
create policy results_read on public.assessment_results for select to authenticated using (public.can_read_learning_record(institution_id, student_id));
create policy results_write on public.assessment_results for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager','assessor','moderator'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager','assessor','moderator']));
create policy evidence_read on public.evidence_documents for select to authenticated using (public.can_read_learning_record(institution_id, student_id));
create policy evidence_write on public.evidence_documents for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer','assessor','moderator'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager','lecturer','assessor','moderator']));
create policy moderation_read on public.moderation_records for select to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager','assessor','moderator']));
create policy moderation_write on public.moderation_records for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','moderator'])) with check (public.has_institution_role(institution_id, array['college_admin','moderator']));

do $$ declare table_name text; begin
  foreach table_name in array array['invoices','payments','funding_records'] loop
    execute format('create policy %I_staff_read on public.%I for select to authenticated using (public.has_institution_role(institution_id, array[''college_admin'',''finance_officer'']) or public.can_read_student(institution_id, student_id))', table_name, table_name);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.has_institution_role(institution_id, array[''college_admin'',''finance_officer''])) with check (public.has_institution_role(institution_id, array[''college_admin'',''finance_officer'']))', table_name, table_name);
  end loop;
end $$;
create policy invoice_items_read on public.invoice_items for select to authenticated using (public.has_institution_role(institution_id, array['college_admin','finance_officer']));
create policy invoice_items_write on public.invoice_items for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','finance_officer'])) with check (public.has_institution_role(institution_id, array['college_admin','finance_officer']));

create policy notifications_read on public.notifications for select to authenticated using (profile_id = auth.uid() or public.has_institution_role(institution_id, array['college_admin']));
create policy notifications_update on public.notifications for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy notifications_insert on public.notifications for insert to authenticated with check (public.has_institution_role(institution_id, array['college_admin','academic_manager','finance_officer']));
create policy tickets_read on public.support_tickets for select to authenticated using (created_by = auth.uid() or public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy tickets_insert on public.support_tickets for insert to authenticated with check (public.can_access_institution(institution_id));
create policy tickets_update on public.support_tickets for update to authenticated using (created_by = auth.uid() or public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.can_access_institution(institution_id));
create policy ticket_comments_read on public.support_ticket_comments for select to authenticated using (exists (select 1 from public.support_tickets where id = support_ticket_comments.ticket_id and (created_by = auth.uid() or public.has_institution_role(institution_id, array['college_admin','academic_manager']))));
create policy ticket_comments_insert on public.support_ticket_comments for insert to authenticated with check (exists (select 1 from public.support_tickets where id = support_ticket_comments.ticket_id and (created_by = auth.uid() or public.has_institution_role(institution_id, array['college_admin','academic_manager']))));
create policy privacy_read on public.privacy_requests for select to authenticated using (created_by = auth.uid() or public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy privacy_write on public.privacy_requests for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy consent_read on public.consent_records for select to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager']) or exists (select 1 from public.students where id = consent_records.student_id and institution_id = consent_records.institution_id and auth_user_id = auth.uid()));
create policy consent_write on public.consent_records for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy incidents_manage on public.data_incidents for all to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager'])) with check (public.has_institution_role(institution_id, array['college_admin','academic_manager']));
create policy invites_manage on public.institution_invites for all to authenticated using (public.has_institution_role(institution_id, array['college_admin'])) with check (public.has_institution_role(institution_id, array['college_admin']));
create policy subscriptions_read on public.subscriptions for select to authenticated using (public.can_access_institution(institution_id));
create policy subscriptions_manage on public.subscriptions for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy audit_read on public.audit_logs for select to authenticated using (public.has_institution_role(institution_id, array['college_admin','academic_manager']) or public.is_super_admin());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('college-documents','college-documents',false,10485760,array['application/pdf','image/png','image/jpeg','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy college_documents_read on storage.objects for select to authenticated using (
  bucket_id = 'college-documents' and array_length(storage.foldername(name),1) >= 2 and
  public.can_read_learning_record((storage.foldername(name))[1]::uuid, (storage.foldername(name))[2]::uuid)
);
create policy college_documents_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'college-documents' and public.has_institution_role((storage.foldername(name))[1]::uuid, array['college_admin','academic_manager','lecturer','assessor','moderator'])
);
create policy college_documents_update on storage.objects for update to authenticated using (
  bucket_id = 'college-documents' and public.has_institution_role((storage.foldername(name))[1]::uuid, array['college_admin','academic_manager'])
);
create policy college_documents_delete on storage.objects for delete to authenticated using (
  bucket_id = 'college-documents' and public.has_institution_role((storage.foldername(name))[1]::uuid, array['college_admin','academic_manager'])
);

grant execute on function public.create_institution_with_owner(text,text) to authenticated;
grant execute on function public.join_institution_by_code(text) to authenticated;

create or replace function public.seed_demo_workspace(p_institution_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare campus_id uuid; period_id uuid; programme_id uuid; module_id uuid; class_id uuid; student_one uuid; student_two uuid; assessment_id uuid; invoice_id uuid;
begin
  if not public.has_institution_role(p_institution_id, array['college_admin']) then raise exception 'College administrator access required'; end if;
  if exists (select 1 from public.students where institution_id = p_institution_id) then raise exception 'Demo data can only be loaded into an empty workspace'; end if;
  insert into public.campuses(institution_id,name,code,address) values (p_institution_id,'Johannesburg Test Campus','JHB-TEST','Synthetic address — Johannesburg') returning id into campus_id;
  insert into public.academic_periods(institution_id,name,start_date,end_date) values (p_institution_id,'2026 Test Academic Year','2026-01-12','2026-12-10') returning id into period_id;
  insert into public.programmes(institution_id,code,title,nqf_level,saqa_id,credits,delivery_mode) values (p_institution_id,'TS-NQF4-TEST','Technical Support NQF Level 4 — TEST','4','TEST-78964',163,'blended') returning id into programme_id;
  insert into public.modules(institution_id,programme_id,code,title,unit_standard_reference,credits) values (p_institution_id,programme_id,'HARDWARE-TEST','Computer Hardware Support — TEST','TEST-US-14913',12) returning id into module_id;
  insert into public.classes(institution_id,name,programme_id,campus_id,academic_period_id,capacity) values (p_institution_id,'TS4 Test Class A',programme_id,campus_id,period_id,20) returning id into class_id;
  insert into public.students(institution_id,student_number,first_name,last_name,email,phone,status) values (p_institution_id,'TEST-001','Nomsa','Dlamini','nomsa.test@example.invalid','0000000000','active') returning id into student_one;
  insert into public.students(institution_id,student_number,first_name,last_name,email,phone,status) values (p_institution_id,'TEST-002','Thabo','Mokoena','thabo.test@example.invalid','0000000000','active') returning id into student_two;
  insert into public.enrolments(institution_id,student_id,programme_id,academic_period_id,class_id,start_date,expected_end_date,status) values
    (p_institution_id,student_one,programme_id,period_id,class_id,'2026-01-12','2026-12-10','active'),
    (p_institution_id,student_two,programme_id,period_id,class_id,'2026-01-12','2026-12-10','active');
  insert into public.applications(institution_id,reference_number,first_name,last_name,email,phone,programme_id,intake_date,status,notes) values
    (p_institution_id,'TEST-APP-001','Ayanda','Nkosi','ayanda.test@example.invalid','0000000000',programme_id,'2026-09-01','reviewing','Synthetic application'),
    (p_institution_id,'TEST-APP-002','Kagiso','Molefe','kagiso.test@example.invalid','0000000000',programme_id,'2026-09-01','received','Synthetic application');
  insert into public.timetable_entries(institution_id,class_id,module_id,title,session_date,start_time,end_time,venue) values (p_institution_id,class_id,module_id,'Hardware troubleshooting practical — TEST',current_date + 1,'09:00','12:00','Lab 1 — TEST');
  insert into public.assessments(institution_id,programme_id,module_id,title,assessment_type,maximum_marks,due_date) values (p_institution_id,programme_id,module_id,'Formative hardware assessment — TEST','formative',100,current_date + 14) returning id into assessment_id;
  insert into public.assessment_results(institution_id,assessment_id,student_id,outcome,score,feedback) values
    (p_institution_id,assessment_id,student_one,'competent',82,'Synthetic competent outcome'),
    (p_institution_id,assessment_id,student_two,'submitted',null,'Awaiting assessment — synthetic');
  insert into public.invoices(institution_id,student_id,invoice_number,issue_date,due_date,description,total_amount,status) values (p_institution_id,student_one,'TEST-INV-001',current_date,current_date + 30,'Synthetic tuition invoice',2500,'issued') returning id into invoice_id;
  insert into public.payments(institution_id,invoice_id,student_id,amount,payment_date,payment_method,reference_number) values (p_institution_id,invoice_id,student_one,500,current_date,'eft','TEST-PAYMENT-001');
  insert into public.funding_records(institution_id,student_id,funding_type,provider_name,reference_number,approved_amount,status) values (p_institution_id,student_two,'employer','Synthetic Employer','TEST-FUND-001',5000,'approved');
  insert into public.announcements(institution_id,title,body,audience) values (p_institution_id,'Welcome to the EduBonke test workspace','Every record in this workspace is synthetic and must not be used as official learner evidence.','all');
end; $$;
grant execute on function public.seed_demo_workspace(uuid) to authenticated;
