-- EduBonke authenticated QR attendance check-in.
--
-- Students must already be signed in, linked to an active student record and
-- actively enrolled in the class attached to the open attendance session.
-- The raw QR token is returned once to authorised staff and is never stored.

alter table public.attendance_sessions
  add column if not exists check_in_token_hash text,
  add column if not exists check_in_enabled boolean not null default false,
  add column if not exists check_in_started_at timestamptz,
  add column if not exists check_in_expires_at timestamptz,
  add column if not exists check_in_started_by uuid references public.profiles(id);

alter table public.attendance_records
  add column if not exists check_in_method text not null default 'manual',
  add column if not exists checked_in_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'attendance_records_check_in_method_check'
      and conrelid = 'public.attendance_records'::regclass
  ) then
    alter table public.attendance_records
      add constraint attendance_records_check_in_method_check
      check (check_in_method in ('manual', 'qr'));
  end if;
end $$;

create unique index if not exists attendance_sessions_qr_token_hash_idx
  on public.attendance_sessions(check_in_token_hash)
  where check_in_token_hash is not null;

drop policy if exists attendance_sessions_read on public.attendance_sessions;
create policy attendance_sessions_read on public.attendance_sessions
for select to authenticated using (
  public.has_institution_role(
    institution_id,
    array['college_admin','academic_manager','lecturer','assessor','moderator']
  )
  or exists (
    select 1
    from public.students s
    join public.enrolments e
      on e.student_id = s.id
     and e.institution_id = s.institution_id
     and e.class_id = attendance_sessions.class_id
     and e.status = 'active'
    where s.institution_id = attendance_sessions.institution_id
      and s.auth_user_id = auth.uid()
      and s.status = 'active'
  )
);

drop policy if exists attendance_sessions_write on public.attendance_sessions;
create policy attendance_sessions_write on public.attendance_sessions
for all to authenticated
using (
  public.has_institution_role(
    institution_id,
    array['college_admin','academic_manager','lecturer']
  )
)
with check (
  public.has_institution_role(
    institution_id,
    array['college_admin','academic_manager','lecturer']
  )
);

create or replace function public.start_attendance_qr(
  p_session_id uuid,
  p_valid_minutes integer default 5
)
returns table (
  check_in_token text,
  check_in_expires_at timestamptz,
  session_topic text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  selected_session public.attendance_sessions%rowtype;
  raw_token text;
  expiry timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Sign in before starting QR attendance';
  end if;

  if p_valid_minutes < 1 or p_valid_minutes > 10 then
    raise exception 'QR validity must be between 1 and 10 minutes';
  end if;

  select * into selected_session
  from public.attendance_sessions
  where id = p_session_id
  for update;

  if selected_session.id is null then
    raise exception 'Attendance session not found';
  end if;

  if selected_session.status <> 'open' then
    raise exception 'Only an open attendance session can display a QR code';
  end if;

  if not public.has_institution_role(
    selected_session.institution_id,
    array['college_admin','academic_manager','lecturer']
  ) then
    raise exception 'Lecturer or attendance administrator access required';
  end if;

  raw_token := encode(gen_random_bytes(24), 'hex');
  expiry := clock_timestamp() + make_interval(mins => p_valid_minutes);

  update public.attendance_sessions
  set check_in_token_hash = encode(digest(raw_token, 'sha256'), 'hex'),
      check_in_enabled = true,
      check_in_started_at = clock_timestamp(),
      check_in_expires_at = expiry,
      check_in_started_by = auth.uid(),
      updated_at = clock_timestamp()
  where id = selected_session.id;

  return query
  select raw_token, expiry, selected_session.topic;
end;
$$;

create or replace function public.stop_attendance_qr(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_session public.attendance_sessions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into selected_session
  from public.attendance_sessions
  where id = p_session_id
  for update;

  if selected_session.id is null then
    raise exception 'Attendance session not found';
  end if;

  if not public.has_institution_role(
    selected_session.institution_id,
    array['college_admin','academic_manager','lecturer']
  ) then
    raise exception 'Lecturer or attendance administrator access required';
  end if;

  update public.attendance_sessions
  set check_in_token_hash = null,
      check_in_enabled = false,
      check_in_expires_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = selected_session.id;
end;
$$;

create or replace function public.check_in_attendance(p_token text)
returns table (
  attendance_record_id uuid,
  attendance_session_id uuid,
  attendance_status text,
  session_topic text,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  selected_session public.attendance_sessions%rowtype;
  selected_student_id uuid;
  existing_record_id uuid;
  existing_status text;
  existing_checked_in_at timestamptz;
  supplied_hash text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in before scanning the attendance QR';
  end if;

  if p_token is null or p_token !~ '^[0-9a-fA-F]{48}$' then
    raise exception 'The attendance QR is invalid';
  end if;

  supplied_hash := encode(digest(lower(p_token), 'sha256'), 'hex');

  select * into selected_session
  from public.attendance_sessions
  where check_in_token_hash = supplied_hash
    and check_in_enabled = true
    and check_in_expires_at >= clock_timestamp()
    and status = 'open'
  order by check_in_started_at desc
  limit 1
  for update;

  if selected_session.id is null then
    raise exception 'This attendance QR has expired or the register is closed';
  end if;

  select s.id into selected_student_id
  from public.students s
  join public.institution_memberships membership
    on membership.institution_id = s.institution_id
   and membership.profile_id = auth.uid()
   and membership.role = 'student'
   and membership.status = 'active'
  where s.institution_id = selected_session.institution_id
    and s.auth_user_id = auth.uid()
    and s.status = 'active'
  limit 1;

  if selected_student_id is null then
    raise exception 'Your signed-in account is not linked to an active student record for this college';
  end if;

  if not exists (
    select 1
    from public.enrolments enrolment
    where enrolment.institution_id = selected_session.institution_id
      and enrolment.student_id = selected_student_id
      and enrolment.class_id = selected_session.class_id
      and enrolment.status = 'active'
  ) then
    raise exception 'You are not actively enrolled in the class for this register';
  end if;

  insert into public.attendance_records (
    institution_id,
    attendance_session_id,
    student_id,
    status,
    note,
    recorded_by,
    check_in_method,
    checked_in_at
  ) values (
    selected_session.institution_id,
    selected_session.id,
    selected_student_id,
    'present',
    'Authenticated student QR check-in',
    auth.uid(),
    'qr',
    clock_timestamp()
  )
  on conflict (attendance_session_id, student_id) do nothing
  returning id, status, public.attendance_records.checked_in_at
  into existing_record_id, existing_status, existing_checked_in_at;

  if existing_record_id is null then
    select id, status, coalesce(public.attendance_records.checked_in_at, created_at)
    into existing_record_id, existing_status, existing_checked_in_at
    from public.attendance_records
    where public.attendance_records.attendance_session_id = selected_session.id
      and student_id = selected_student_id;
  end if;

  return query
  select
    existing_record_id,
    selected_session.id,
    existing_status,
    selected_session.topic,
    existing_checked_in_at;
end;
$$;

revoke all on function public.start_attendance_qr(uuid, integer) from public, anon;
revoke all on function public.stop_attendance_qr(uuid) from public, anon;
revoke all on function public.check_in_attendance(text) from public, anon;

grant execute on function public.start_attendance_qr(uuid, integer) to authenticated;
grant execute on function public.stop_attendance_qr(uuid) to authenticated;
grant execute on function public.check_in_attendance(text) to authenticated;
