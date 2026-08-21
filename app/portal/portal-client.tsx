"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabase";
import { downloadCsv, formatDate, human, money, navigation, type InstitutionRole, type Membership, type WorkspaceData } from "../../lib/platform";
import { createDemoWorkspace, demoMemberships, demoUser } from "../../lib/demo-data";
import BrandLogo, { BrandMark } from "../brand";

type Row = Record<string, unknown>;
type Notice = { type: "success" | "error"; text: string } | null;

const workspaceTables = [
  "campuses", "academic_periods", "programmes", "modules", "programme_modules", "classes",
  "applications", "students", "student_status_history", "student_documents", "enrolments", "workplace_placements",
  "timetable_entries", "attendance_sessions", "attendance_records", "assessments", "assessment_results",
  "evidence_documents", "moderation_records", "invoices", "invoice_items", "payments", "funding_records",
  "announcements", "notifications", "support_tickets", "support_ticket_comments", "privacy_requests",
  "consent_records", "data_incidents", "institution_invites", "subscriptions", "audit_logs",
] as const;

const academicWriters = new Set<InstitutionRole>(["college_admin", "academic_manager", "lecturer", "assessor", "moderator"]);
const academicManagers = new Set<InstitutionRole>(["college_admin", "academic_manager"]);
const financeWriters = new Set<InstitutionRole>(["college_admin", "finance_officer"]);
const privacyManagers = new Set<InstitutionRole>(["college_admin", "academic_manager"]);

const demoStaffActors: Array<{ role: Exclude<InstitutionRole, "student" | "workplace_supervisor">; id: string; name: string; email: string }> = [
  { role: "college_admin", id: "profile-admin", name: "Nomsa Dlamini", email: "nomsa.admin@example.invalid" },
  { role: "academic_manager", id: "profile-manager", name: "Sipho Mthembu", email: "sipho.manager@example.invalid" },
  { role: "lecturer", id: "profile-lecturer", name: "Naledi Masilo", email: "naledi.lecturer@example.invalid" },
  { role: "assessor", id: "profile-assessor", name: "Mandla Ncube", email: "mandla.assessor@example.invalid" },
  { role: "moderator", id: "profile-moderator", name: "Palesa Motau", email: "palesa.moderator@example.invalid" },
  { role: "finance_officer", id: "profile-finance", name: "Bongani Zulu", email: "bongani.finance@example.invalid" },
];

const staffViews: Record<(typeof demoStaffActors)[number]["role"], ReadonlySet<(typeof navigation)[number][0]>> = {
  college_admin: new Set(navigation.map(([key]) => key)),
  academic_manager: new Set(["overview", "admissions", "students", "academics", "timetable", "attendance", "assessments", "evidence", "communications", "reports", "support", "privacy", "administration"]),
  lecturer: new Set(["overview", "students", "timetable", "attendance", "assessments", "evidence", "communications", "reports", "support"]),
  assessor: new Set(["overview", "students", "assessments", "evidence", "reports", "support"]),
  moderator: new Set(["overview", "students", "assessments", "evidence", "reports", "support"]),
  finance_officer: new Set(["overview", "students", "finance", "communications", "reports", "support"]),
};

export default function PortalClient({ demoMode = false, staffDemo = false }: { demoMode?: boolean; staffDemo?: boolean }) {
  const [user, setUser] = useState<User | null>(demoMode ? demoUser as unknown as User : null);
  const [memberships, setMemberships] = useState<Membership[]>(demoMode ? demoMemberships : []);
  const [membership, setMembership] = useState<Membership | null>(demoMode ? demoMemberships[0] : null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [data, setData] = useState<WorkspaceData>(() => demoMode ? createDemoWorkspace() : {});
  const [view, setView] = useState<(typeof navigation)[number][0]>("overview");
  const [loading, setLoading] = useState(!demoMode && isSupabaseConfigured);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [mobileNav, setMobileNav] = useState(false);

  function selectDemoStaffRole(role: (typeof demoStaffActors)[number]["role"]) {
    const actor = demoStaffActors.find((item) => item.role === role) ?? demoStaffActors[0];
    const nextMembership: Membership = {
      ...demoMemberships[0],
      id: `membership-${actor.role}`,
      profile_id: actor.id,
      role: actor.role,
    };
    setUser({ id: actor.id, email: actor.email, user_metadata: { full_name: actor.name } } as unknown as User);
    setMembership(nextMembership);
    setMemberships([nextMembership]);
    setView("overview");
    setNotice({ type: "success", text: `Now previewing the ${human(actor.role)} staff experience.` });
  }

  const loadMemberships = useCallback(async (currentUser: User) => {
    const supabase = getSupabase();
    const [membershipResult, profileResult] = await Promise.all([
      supabase.from("institution_memberships").select("id,institution_id,profile_id,role,status,institutions(id,name,registration_number,invite_code)").eq("profile_id", currentUser.id).eq("status", "active"),
      supabase.from("profiles").select("is_super_admin").eq("id", currentUser.id).maybeSingle(),
    ]);
    if (membershipResult.error) throw membershipResult.error;
    const available = (membershipResult.data ?? []) as unknown as Membership[];
    setMemberships(available);
    setMembership((previous) => available.find((item) => item.institution_id === previous?.institution_id) ?? available[0] ?? null);
    setIsSuperAdmin(Boolean(profileResult.data?.is_super_admin));
  }, []);

  const loadWorkspace = useCallback(async (active: Membership, superAdmin: boolean) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const results = await Promise.all(workspaceTables.map(async (table) => {
        const { data: rows, error } = await supabase.from(table).select("*").eq("institution_id", active.institution_id).limit(500);
        if (error) throw new Error(`${human(table)}: ${error.message}`);
        return [table, rows ?? []] as const;
      }));
      const memberResult = await supabase.from("institution_memberships").select("id,institution_id,profile_id,role,status,created_at,profiles(id,full_name,email)").eq("institution_id", active.institution_id).limit(200);
      if (memberResult.error) throw memberResult.error;
      const next: WorkspaceData = Object.fromEntries(results);
      next.members = (memberResult.data ?? []) as unknown as Row[];
      if (superAdmin) {
        const platformResult = await supabase.from("institutions").select("*").order("created_at", { ascending: false }).limit(200);
        if (!platformResult.error) next.platform_institutions = (platformResult.data ?? []) as unknown as Row[];
      }
      setData(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (demoMode || !isSupabaseConfigured) return;
    const supabase = getSupabase();
    supabase.auth.getUser().then(async ({ data: authData }) => {
      if (!authData.user) { location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login/`; return; }
      setUser(authData.user);
      try { await loadMemberships(authData.user); }
      catch (error) { setNotice({ type: "error", text: message(error) }); }
      finally { setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, [demoMode, loadMemberships]);

  useEffect(() => {
    if (demoMode || !membership) return;
    const timer = window.setTimeout(() => {
      void loadWorkspace(membership, isSuperAdmin).catch((error) => setNotice({ type: "error", text: message(error) }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [demoMode, membership, isSuperAdmin, loadWorkspace]);

  const run = useCallback(async (action: () => Promise<void>, success?: string) => {
    if (!membership) return;
    setBusy(true); setNotice(null);
    try {
      await action();
      if (!demoMode) await loadWorkspace(membership, isSuperAdmin);
      if (success) setNotice({ type: "success", text: success });
    } catch (error) { setNotice({ type: "error", text: message(error) }); }
    finally { setBusy(false); }
  }, [demoMode, membership, isSuperAdmin, loadWorkspace]);

  const actions = useMemo(() => {
    if (demoMode) {
      const tableKey = (table: string) => table === "institution_memberships" ? "members" : table;
      const audit = (table: string, action: string, entityId: unknown): Row => ({ id: crypto.randomUUID(), institution_id: membership?.institution_id, action, entity_type: table, entity_id: entityId, actor_id: user?.id ?? demoUser.id, actor_email: user?.email ?? demoUser.email, created_at: new Date().toISOString() });
      const insertLocal = (table: string, records: Row[]) => setData((current) => {
        const key = tableKey(table); const stamped = records.map((row) => ({ id: row.id ?? crypto.randomUUID(), institution_id: membership?.institution_id, created_at: row.created_at ?? new Date().toISOString(), ...row }));
        return { ...current, [key]: [...stamped, ...(current[key] ?? [])], audit_logs: [...stamped.map((row) => audit(table, "insert", row.id)), ...(current.audit_logs ?? [])] };
      });
      const upsertLocal = (table: string, records: Row[], conflict: string) => setData((current) => {
        const key = tableKey(table); const fields = conflict.split(",").map((field) => field.trim()).filter((field) => field !== "institution_id"); const next = [...(current[key] ?? [])];
        for (const values of records) { const found = next.findIndex((row) => fields.every((field) => row[field] === values[field])); if (found >= 0) next[found] = { ...next[found], ...values, updated_at: new Date().toISOString() }; else next.unshift({ id: crypto.randomUUID(), institution_id: membership?.institution_id, created_at: new Date().toISOString(), ...values }); }
        return { ...current, [key]: next, audit_logs: [audit(table, "upsert", "demo-batch"), ...(current.audit_logs ?? [])] };
      });
      return {
        insert: (table: string, values: Row, success: string) => run(async () => insertLocal(table, [values]), success),
        upsert: (table: string, values: Row, conflict: string, success: string) => run(async () => upsertLocal(table, [values], conflict), success),
        batchUpsert: (table: string, values: Row[], conflict: string, success: string) => run(async () => upsertLocal(table, values, conflict), success),
        update: (table: string, id: unknown, values: Row, success: string) => run(async () => setData((current) => { const key = tableKey(table); const previous = (current[key] ?? []).find((row) => row.id === id); const history = table === "students" && values.status && previous?.status !== values.status ? [{ id: crypto.randomUUID(), institution_id: membership?.institution_id, student_id: id, previous_status: previous?.status, new_status: values.status, created_at: new Date().toISOString() }, ...(current.student_status_history ?? [])] : current.student_status_history; return { ...current, [key]: (current[key] ?? []).map((row) => row.id === id ? { ...row, ...values, updated_at: new Date().toISOString() } : row), student_status_history: history ?? [], audit_logs: [audit(table, "update", id), ...(current.audit_logs ?? [])] }; }), success),
        remove: (table: string, id: unknown, success: string) => run(async () => setData((current) => { const key = tableKey(table); return { ...current, [key]: (current[key] ?? []).filter((row) => row.id !== id), audit_logs: [audit(table, "delete", id), ...(current.audit_logs ?? [])] }; }), success),
        custom: run,
        refresh: () => Promise.resolve(),
      };
    }
    return {
      insert: (table: string, values: Row, success: string) => run(async () => { const { error } = await getSupabase().from(table).insert({ ...values, institution_id: membership?.institution_id }); if (error) throw error; }, success),
      upsert: (table: string, values: Row, conflict: string, success: string) => run(async () => { const { error } = await getSupabase().from(table).upsert({ ...values, institution_id: membership?.institution_id }, { onConflict: conflict }); if (error) throw error; }, success),
      batchUpsert: (table: string, values: Row[], conflict: string, success: string) => run(async () => { const { error } = await getSupabase().from(table).upsert(values.map((row) => ({ ...row, institution_id: membership?.institution_id })), { onConflict: conflict }); if (error) throw error; }, success),
      update: (table: string, id: unknown, values: Row, success: string) => run(async () => { const { error } = await getSupabase().from(table).update(values).eq("id", id).eq("institution_id", membership?.institution_id); if (error) throw error; }, success),
      remove: (table: string, id: unknown, success: string) => run(async () => { const { error } = await getSupabase().from(table).delete().eq("id", id).eq("institution_id", membership?.institution_id); if (error) throw error; }, success),
      custom: run,
      refresh: () => membership ? loadWorkspace(membership, isSuperAdmin) : Promise.resolve(),
    };
  }, [demoMode, membership, isSuperAdmin, loadWorkspace, run, user]);

  async function signOut() {
    if (!demoMode && isSupabaseConfigured) await getSupabase().auth.signOut();
    location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
  }

  if (!demoMode && !isSupabaseConfigured) return <ConfigurationRequired />;
  if (loading && !user) return <LoadingScreen text="Checking your account…" />;
  if (!user) return null;
  if (!membership) return <Onboarding user={user} busy={busy} notice={notice} setBusy={setBusy} setNotice={setNotice} onComplete={() => loadMemberships(user)} onSignOut={signOut} />;

  const role = membership.role;
  const panelProps = { data, role, busy, actions, institutionId: membership.institution_id, user, demoMode };
  const visibleNavigation = staffDemo && role !== "student" && role !== "workplace_supervisor"
    ? navigation.filter(([key]) => staffViews[role].has(key))
    : navigation;

  return (
    <main className="portal-shell">
      <aside className={mobileNav ? "portal-sidebar open" : "portal-sidebar"}>
        <BrandLogo className="portal-brand" inverse subtitle={staffDemo ? "Staff Demo" : demoMode ? "Interactive Demo" : "College Management"} />
        <div className="workspace-card">
          <small>{staffDemo ? "STAFF ACCESS PREVIEW" : "ACTIVE COLLEGE"}</small><b>{membership.institutions.name}</b><span>{human(role)}</span>
          {staffDemo ? (
            <label className="role-preview-select">View as
              <select value={role} onChange={(event) => selectDemoStaffRole(event.target.value as (typeof demoStaffActors)[number]["role"])}>
                {demoStaffActors.map((actor) => <option key={actor.role} value={actor.role}>{human(actor.role)}</option>)}
              </select>
            </label>
          ) : memberships.length > 1 && <select value={membership.institution_id} onChange={(event) => setMembership(memberships.find((item) => item.institution_id === event.target.value) ?? membership)}>{memberships.map((item) => <option key={item.id} value={item.institution_id}>{item.institutions.name}</option>)}</select>}
        </div>
        <nav>{visibleNavigation.map(([key, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => { setView(key); setMobileNav(false); }}><span>{navIcon(key)}</span>{label}</button>)}</nav>
        <div className="sidebar-footer"><Link href="/privacy">Privacy notice</Link>{demoMode ? <button onClick={() => { setData(createDemoWorkspace()); setNotice({ type: "success", text: "Demo data reset to its original state." }); setView("overview"); }}>Reset demo</button> : <button onClick={signOut}>Sign out</button>}</div>
      </aside>
      <section className="portal-main">
        <header className="portal-topbar">
          <button className="mobile-menu" onClick={() => setMobileNav((value) => !value)} aria-label="Toggle navigation">☰</button>
          <div><small>{demoMode ? `Demo · ${human(view)}` : human(view)}</small><h1>{view === "overview" ? `Welcome, ${user.user_metadata?.full_name ?? user.email?.split("@")[0]}` : navigation.find(([key]) => key === view)?.[1]}</h1></div>
          <div className="account-chip"><span>{initials(user.user_metadata?.full_name ?? user.email ?? "User")}</span><div><b>{user.user_metadata?.full_name ?? "EduBonke user"}</b><small>{human(role)}</small></div></div>
        </header>
        {demoMode && <div className="demo-mode-banner"><b>{staffDemo ? "Staff and administrator demonstration" : "Interactive demonstration"}</b><span>{staffDemo ? `You are viewing the permissions and tools available to a ${human(role)}. ` : ""}Every person, college, amount and record is invented. Changes last only until this page is refreshed or reset.</span><Link href="/demo">Choose another demo</Link></div>}
        {notice && <div className={`portal-notice ${notice.type}`} role="status"><span>{notice.type === "success" ? "✓" : "!"}</span>{notice.text}<button onClick={() => setNotice(null)}>×</button></div>}
        {loading ? <LoadingScreen text="Loading college records…" compact /> : <Panel view={view} props={panelProps} isSuperAdmin={isSuperAdmin} />}
      </section>
    </main>
  );
}

type PanelProps = {
  data: WorkspaceData;
  role: InstitutionRole;
  busy: boolean;
  institutionId: string;
  user: User;
  demoMode: boolean;
  actions: {
    insert(table: string, values: Row, success: string): Promise<void>;
    upsert(table: string, values: Row, conflict: string, success: string): Promise<void>;
    batchUpsert(table: string, values: Row[], conflict: string, success: string): Promise<void>;
    update(table: string, id: unknown, values: Row, success: string): Promise<void>;
    remove(table: string, id: unknown, success: string): Promise<void>;
    custom(action: () => Promise<void>, success?: string): Promise<void>;
    refresh(): Promise<void>;
  };
};

function Panel({ view, props, isSuperAdmin }: { view: string; props: PanelProps; isSuperAdmin: boolean }) {
  if (view === "admissions") return <AdmissionsPanel {...props} />;
  if (view === "students") return <StudentsPanel {...props} />;
  if (view === "academics") return <AcademicsPanel {...props} />;
  if (view === "timetable") return <TimetablePanel {...props} />;
  if (view === "attendance") return <AttendancePanel {...props} />;
  if (view === "assessments") return <AssessmentsPanel {...props} />;
  if (view === "evidence") return <EvidencePanel {...props} />;
  if (view === "finance") return <FinancePanel {...props} />;
  if (view === "communications") return <CommunicationsPanel {...props} />;
  if (view === "reports") return <ReportsPanel {...props} />;
  if (view === "support") return <SupportPanel {...props} />;
  if (view === "privacy") return <PrivacyPanel {...props} />;
  if (view === "administration") return <AdministrationPanel {...props} isSuperAdmin={isSuperAdmin} />;
  return <OverviewPanel {...props} />;
}

function OverviewPanel({ data, role, demoMode }: PanelProps) {
  const students = getRows(data, "students"); const applications = getRows(data, "applications"); const results = getRows(data, "assessment_results"); const invoices = getRows(data, "invoices");
  const outstanding = invoices.reduce((sum, row) => sum + Number(row.balance ?? row.total_amount ?? 0), 0);
  return <div className="portal-content"><section className="metric-row"><Metric label="Active students" value={students.filter((row) => row.status === "active").length} note={`${students.length} total records`} /><Metric label="Admissions queue" value={applications.filter((row) => !["accepted", "declined"].includes(String(row.status))).length} note={`${applications.length} applications`} /><Metric label="Competent outcomes" value={results.filter((row) => row.outcome === "competent").length} note={`${results.length} captured outcomes`} /><Metric label="Outstanding fees" value={money(outstanding)} note="Prototype finance ledger" /></section><div className="dashboard-grid"><Card title="Upcoming classes" eyebrow="TIMETABLE"><RecordList rows={getRows(data, "timetable_entries").slice(0, 6)} empty="No classes have been scheduled." render={(row) => <><b>{text(row.title)}</b><small>{formatDate(row.session_date)} · {text(row.start_time)}–{text(row.end_time)} · {text(row.venue)}</small></>} /></Card><Card title="Latest announcements" eyebrow="COMMUNICATIONS"><RecordList rows={getRows(data, "announcements").slice(0, 6)} empty="No announcements have been published." render={(row) => <><b>{text(row.title)}</b><small>{text(row.audience)} · {formatDate(row.created_at)}</small><p>{text(row.body)}</p></>} /></Card></div><section className="scope-banner"><div><b>Current access: {human(role)}</b><p>{demoMode ? "Demo actions run only in this browser tab and do not test database security or shared-device access." : "Your visible records and available actions are controlled by your college membership and Supabase row-level security."}</p></div><span>{demoMode ? "Synthetic demo" : "R0 test environment"}</span></section></div>;
}

function AdmissionsPanel(props: PanelProps) {
  const programmes = getRows(props.data, "programmes"); const applications = getRows(props.data, "applications"); const canWrite = academicManagers.has(props.role);
  return <div className="portal-content two-column">{canWrite && <FormCard title="Capture an application" intro="Record applicant details and the requested programme."><form onSubmit={(event) => void formInsert(event, props.actions, "applications", { status: "received" }, "Application captured.")}><Pair><Field label="First name" name="first_name" /><Field label="Last name" name="last_name" /></Pair><Pair><Field label="Email" name="email" type="email" /><Field label="Mobile number" name="phone" /></Pair><SelectField label="Programme" name="programme_id" options={programmes} optionLabel={(row) => `${text(row.code)} · ${text(row.title)}`} /><Pair><Field label="Intake date" name="intake_date" type="date" /><Field label="Application reference" name="reference_number" placeholder="APP-2026-001" /></Pair><TextArea label="Notes" name="notes" /><Submit busy={props.busy}>Save application</Submit></form></FormCard>}<Card title="Application pipeline" eyebrow="ADMISSIONS REGISTER" wide={!canWrite}><div className="data-table"><div className="table-head columns-4"><span>Applicant</span><span>Programme</span><span>Intake</span><span>Status</span></div>{applications.map((row) => <div className="table-row columns-4" key={text(row.id)}><span><b>{text(row.first_name)} {text(row.last_name)}</b><small>{text(row.reference_number)}</small></span><span>{lookup(programmes, row.programme_id)}</span><span>{formatDate(row.intake_date)}</span><span>{canWrite ? <select value={text(row.status)} onChange={(event) => void props.actions.update("applications", row.id, { status: event.target.value }, "Application status updated.")}><option value="received">Received</option><option value="reviewing">Reviewing</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="waitlisted">Waitlisted</option></select> : <Status value={row.status} />}</span></div>)}</div>{!applications.length && <Empty text="No applications have been captured." />}</Card></div>;
}

function StudentsPanel(props: PanelProps) {
  const students = getRows(props.data, "students"); const history = getRows(props.data, "student_status_history"); const programmes = getRows(props.data, "programmes"); const periods = getRows(props.data, "academic_periods"); const classes = getRows(props.data, "classes"); const members = getRows(props.data, "members"); const placements = getRows(props.data, "workplace_placements"); const canWrite = academicManagers.has(props.role);
  const supervisors = members.filter((row) => row.role === "workplace_supervisor" && row.status === "active");
  async function importStudents(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    try {
      const file = new FormData(form).get("csv");
      if (!(file instanceof File) || !file.size) throw new Error("Choose a non-empty CSV file.");
      const parsed = parseCsv(await file.text());
      if (parsed.length > 200) throw new Error("The prototype accepts at most 200 student rows per import.");
      const required = ["student_number", "first_name", "last_name", "email"];
      if (!parsed.length || required.some((field) => !(field in parsed[0]))) throw new Error(`CSV headers must include: ${required.join(", ")}.`);
      const records = parsed.map((row) => ({ institution_id: props.institutionId, student_number: row.student_number?.trim().toUpperCase(), first_name: row.first_name?.trim(), last_name: row.last_name?.trim(), email: row.email?.trim().toLowerCase(), phone: row.phone?.trim() || null, status: row.status?.trim() || "active" }));
      if (records.some((row) => !row.student_number || !row.first_name || !row.last_name || !row.email)) throw new Error("Every row needs a student number, first name, last name and email address.");
      await props.actions.batchUpsert("students", records, "institution_id,student_number", `${records.length} student records imported.`); form.reset();
    } catch (error) {
      window.alert(message(error));
    }
  }
  function downloadTemplate() { const csv = "student_number,first_name,last_name,email,phone,status\nTEST-003,Lerato,Mthembu,lerato.test@example.invalid,0000000000,active\n"; const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "edubonke-student-import-template.csv"; link.click(); URL.revokeObjectURL(link.href); }
  return <div className="portal-content">{canWrite && <div className="feature-grid two"><FormCard title="Register a student" intro="Use a college-issued student number. Avoid unnecessary special personal information."><form onSubmit={(event) => void formInsert(event, props.actions, "students", { status: "active" }, "Student registered.")}><Pair><Field label="Student number" name="student_number" /><Field label="National ID / passport" name="identity_reference" optional /></Pair><Pair><Field label="First name" name="first_name" /><Field label="Last name" name="last_name" /></Pair><Pair><Field label="Email" name="email" type="email" /><Field label="Mobile number" name="phone" /></Pair><Pair><Field label="Date of birth" name="date_of_birth" type="date" optional /><SelectField label="Status" name="status" rawOptions={[["active", "Active"], ["inactive", "Inactive"], ["graduated", "Graduated"], ["withdrawn", "Withdrawn"]]} /></Pair><Submit busy={props.busy}>Register student</Submit></form></FormCard><FormCard title="Create an enrolment" intro="Link a registered student to a programme, period and optional class."><form onSubmit={(event) => void formInsert(event, props.actions, "enrolments", { status: "active" }, "Enrolment created.")}><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><SelectField label="Programme" name="programme_id" options={programmes} optionLabel={(row) => `${text(row.code)} · ${text(row.title)}`} /><Pair><SelectField label="Academic period" name="academic_period_id" options={periods} optionLabel={(row) => text(row.name)} /><SelectField label="Class (optional)" name="class_id" options={classes} optionLabel={(row) => text(row.name)} optional /></Pair><Pair><Field label="Start date" name="start_date" type="date" /><Field label="Expected end date" name="expected_end_date" type="date" /></Pair><Submit busy={props.busy}>Create enrolment</Submit></form></FormCard><FormCard title="Controlled CSV import" intro="Import up to 200 synthetic student records with duplicate student-number updates."><form onSubmit={(event) => void importStudents(event)}><label>CSV file<input name="csv" type="file" accept=".csv,text/csv" required /></label><Submit busy={props.busy}>Import students</Submit></form><button className="secondary-action" onClick={downloadTemplate}>Download CSV template</button></FormCard><FormCard title="Workplace placement" intro="Link a student to an approved workplace supervisor account."><form onSubmit={(event) => void formInsert(event, props.actions, "workplace_placements", { status: "active" }, "Workplace placement created.")}><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><SelectField label="Supervisor" name="supervisor_profile_id" options={supervisors} optionValue={(row) => text(row.profile_id)} optionLabel={(row) => { const profile = (row.profiles ?? {}) as Row; return `${text(profile.full_name)} · ${text(profile.email)}`; }} /><Field label="Employer" name="employer_name" /><Pair><Field label="Start date" name="start_date" type="date" /><Field label="End date" name="end_date" type="date" optional /></Pair><Submit busy={props.busy}>Create placement</Submit></form></FormCard></div>}<div className="dashboard-grid"><Card title="Student register" eyebrow="STUDENT INFORMATION SYSTEM"><div className="data-table"><div className="table-head columns-5"><span>Student</span><span>Contact</span><span>Status</span><span>Registered</span><span>Action</span></div>{students.map((row) => <div className="table-row columns-5" key={text(row.id)}><span><b>{text(row.first_name)} {text(row.last_name)}</b><small>{text(row.student_number)}</small></span><span><small>{text(row.email)}</small>{text(row.phone)}</span><span><Status value={row.status} /></span><span>{formatDate(row.created_at)}</span><span>{canWrite && <select value={text(row.status)} onChange={(event) => void props.actions.update("students", row.id, { status: event.target.value }, "Student status updated.")}><option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option><option value="withdrawn">Withdrawn</option></select>}</span></div>)}</div>{!students.length && <Empty text="No students have been registered." />}</Card><Card title="Workplace placements" eyebrow="EMPLOYER EVIDENCE"><RecordList rows={placements} empty="No workplace placements have been created." render={(row) => <><div className="record-between"><b>{lookupStudent(students, row.student_id)}</b><Status value={row.status} /></div><small>{text(row.employer_name)} · {formatDate(row.start_date)} to {formatDate(row.end_date)}</small></>} /></Card><Card title="Student status history" eyebrow="ACCOUNTABILITY"><RecordList rows={history.slice(0, 50)} empty="No student status changes have been recorded." render={(row) => <><b>{lookupStudent(students, row.student_id)}</b><small>{human(row.previous_status)} → {human(row.new_status)} · {formatDate(row.created_at)}</small></>} /></Card></div></div>;
}

function AcademicsPanel(props: PanelProps) {
  const campuses = getRows(props.data, "campuses"); const programmes = getRows(props.data, "programmes"); const modules = getRows(props.data, "modules"); const periods = getRows(props.data, "academic_periods"); const canWrite = academicManagers.has(props.role);
  return <div className="portal-content">{canWrite && <div className="feature-grid three"><FormCard title="Campus & period" intro="Configure delivery locations and academic cycles."><form onSubmit={(event) => void formInsert(event, props.actions, "campuses", { status: "active" }, "Campus created.")}><Field label="Campus name" name="name" /><Field label="Campus code" name="code" /><TextArea label="Address" name="address" /><Submit busy={props.busy}>Add campus</Submit></form><form className="nested-form" onSubmit={(event) => void formInsert(event, props.actions, "academic_periods", {}, "Academic period created.")}><Field label="Period name" name="name" placeholder="2026 Academic Year" /><Pair><Field label="Starts" name="start_date" type="date" /><Field label="Ends" name="end_date" type="date" /></Pair><Submit busy={props.busy}>Add period</Submit></form></FormCard><FormCard title="Programme" intro="Maintain college-verified qualification references."><form onSubmit={(event) => void formInsert(event, props.actions, "programmes", { status: "active", credits: 0 }, "Programme created.")}><Pair><Field label="Code" name="code" /><Field label="NQF level" name="nqf_level" /></Pair><Field label="Programme title" name="title" /><Pair><Field label="SAQA ID" name="saqa_id" optional /><Field label="Credits" name="credits" type="number" /></Pair><SelectField label="Delivery mode" name="delivery_mode" rawOptions={[["classroom", "Classroom"], ["blended", "Blended"], ["online", "Online"], ["workplace", "Workplace"]]} /><Submit busy={props.busy}>Add programme</Submit></form></FormCard><FormCard title="Module & class" intro="Create curriculum components and teaching groups."><form onSubmit={(event) => void formInsert(event, props.actions, "modules", { credits: 0 }, "Module created.")}><SelectField label="Programme" name="programme_id" options={programmes} optionLabel={(row) => text(row.title)} /><Pair><Field label="Module code" name="code" /><Field label="Credits" name="credits" type="number" /></Pair><Field label="Module title" name="title" /><Field label="Unit-standard reference" name="unit_standard_reference" optional /><Submit busy={props.busy}>Add module</Submit></form><form className="nested-form" onSubmit={(event) => void formInsert(event, props.actions, "classes", { status: "active" }, "Class created.")}><Field label="Class name" name="name" /><SelectField label="Programme" name="programme_id" options={programmes} optionLabel={(row) => text(row.title)} /><SelectField label="Campus" name="campus_id" options={campuses} optionLabel={(row) => text(row.name)} /><SelectField label="Academic period" name="academic_period_id" options={periods} optionLabel={(row) => text(row.name)} /><Submit busy={props.busy}>Add class</Submit></form></FormCard></div>}<div className="dashboard-grid"><Card title="Programmes" eyebrow="QUALIFICATION CATALOGUE"><RecordList rows={programmes} empty="No programmes configured." render={(row) => <><b>{text(row.code)} · {text(row.title)}</b><small>NQF {text(row.nqf_level)} · {text(row.credits)} credits · {human(row.delivery_mode)}</small></>} /></Card><Card title="Modules" eyebrow="CURRICULUM"><RecordList rows={modules} empty="No modules configured." render={(row) => <><b>{text(row.code)} · {text(row.title)}</b><small>{text(row.unit_standard_reference) || "No external reference"} · {text(row.credits)} credits</small></>} /></Card></div><p className="scope-note">NQF, SAQA and unit-standard fields are college-supplied references. EduBonke does not validate accreditation or submit regulatory returns.</p></div>;
}

function TimetablePanel(props: PanelProps) {
  const classes = getRows(props.data, "classes"); const modules = getRows(props.data, "modules"); const entries = getRows(props.data, "timetable_entries"); const canWrite = academicWriters.has(props.role);
  return <div className="portal-content two-column">{canWrite && <FormCard title="Schedule a class session" intro="Publish a shared timetable entry for authorised staff and students."><form onSubmit={(event) => void formInsert(event, props.actions, "timetable_entries", { status: "scheduled" }, "Timetable entry published.")}><SelectField label="Class" name="class_id" options={classes} optionLabel={(row) => text(row.name)} /><SelectField label="Module" name="module_id" options={modules} optionLabel={(row) => `${text(row.code)} · ${text(row.title)}`} optional /><Field label="Session title" name="title" /><Field label="Date" name="session_date" type="date" /><Pair><Field label="Start time" name="start_time" type="time" /><Field label="End time" name="end_time" type="time" /></Pair><Field label="Venue / link" name="venue" /><Submit busy={props.busy}>Publish session</Submit></form></FormCard>}<Card title="Shared timetable" eyebrow="UPCOMING SESSIONS" wide={!canWrite}><RecordList rows={entries} empty="No timetable entries have been published." render={(row) => <><div className="record-between"><b>{text(row.title)}</b><Status value={row.status ?? "scheduled"} /></div><small>{formatDate(row.session_date)} · {text(row.start_time)}–{text(row.end_time)}</small><p>{text(row.venue)}</p></>} /></Card></div>;
}

function AttendancePanel(props: PanelProps) {
  const sessions = getRows(props.data, "attendance_sessions"); const students = getRows(props.data, "students"); const records = getRows(props.data, "attendance_records"); const classes = getRows(props.data, "classes"); const timetable = getRows(props.data, "timetable_entries"); const canWrite = academicWriters.has(props.role);
  return <div className="portal-content">{canWrite && <div className="feature-grid two"><FormCard title="Open an attendance session" intro="Create the register for a class date."><form onSubmit={(event) => void formInsert(event, props.actions, "attendance_sessions", { status: "open" }, "Attendance session opened.")}><SelectField label="Class" name="class_id" options={classes} optionLabel={(row) => text(row.name)} /><SelectField label="Timetable entry (optional)" name="timetable_entry_id" options={timetable} optionLabel={(row) => `${formatDate(row.session_date)} · ${text(row.title)}`} optional /><Field label="Session date" name="session_date" type="date" /><Field label="Topic" name="topic" /><Submit busy={props.busy}>Open register</Submit></form></FormCard><FormCard title="Mark attendance" intro="Submitting the same student and session updates the record."><form onSubmit={(event) => void formUpsert(event, props.actions, "attendance_records", "attendance_session_id,student_id", "Attendance saved.")}><SelectField label="Attendance session" name="attendance_session_id" options={sessions} optionLabel={(row) => `${formatDate(row.session_date)} · ${text(row.topic)}`} /><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><SelectField label="Attendance status" name="status" rawOptions={[["present", "Present"], ["late", "Late"], ["absent", "Absent"], ["excused", "Excused"]]} /><TextArea label="Note" name="note" /><Submit busy={props.busy}>Save attendance</Submit></form></FormCard></div>}<Card title="Attendance records" eyebrow="REGISTER"><div className="status-summary">{["present", "late", "absent", "excused"].map((status) => <span key={status}><b>{records.filter((row) => row.status === status).length}</b>{human(status)}</span>)}</div><RecordList rows={records.slice(0, 40)} empty="No attendance has been captured." render={(row) => <><div className="record-between"><b>{lookupStudent(students, row.student_id)}</b><Status value={row.status} /></div><small>{lookup(sessions, row.attendance_session_id, "topic")} · {text(row.note)}</small></>} /></Card></div>;
}

function AssessmentsPanel(props: PanelProps) {
  const programmes = getRows(props.data, "programmes"); const modules = getRows(props.data, "modules"); const assessments = getRows(props.data, "assessments"); const students = getRows(props.data, "students"); const results = getRows(props.data, "assessment_results"); const canWrite = academicWriters.has(props.role);
  return <div className="portal-content">{canWrite && <div className="feature-grid two"><FormCard title="Create an assessment" intro="Plan formative, summative, practical, POE or workplace assessment activity."><form onSubmit={(event) => void formInsert(event, props.actions, "assessments", { status: "published" }, "Assessment created.")}><SelectField label="Programme" name="programme_id" options={programmes} optionLabel={(row) => text(row.title)} /><SelectField label="Module" name="module_id" options={modules} optionLabel={(row) => `${text(row.code)} · ${text(row.title)}`} optional /><Field label="Assessment title" name="title" /><Pair><SelectField label="Type" name="assessment_type" rawOptions={[["formative", "Formative"], ["summative", "Summative"], ["practical", "Practical"], ["poe", "POE"], ["workplace", "Workplace"]]} /><Field label="Maximum marks" name="maximum_marks" type="number" /></Pair><Field label="Due date" name="due_date" type="date" /><Submit busy={props.busy}>Create assessment</Submit></form></FormCard><FormCard title="Capture a result" intro="Outcomes remain subject to the appointed assessor and moderation process."><form onSubmit={(event) => void formUpsert(event, props.actions, "assessment_results", "assessment_id,student_id", "Assessment result saved.")}><SelectField label="Assessment" name="assessment_id" options={assessments} optionLabel={(row) => text(row.title)} /><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><Pair><SelectField label="Outcome" name="outcome" rawOptions={[["not_started", "Not started"], ["submitted", "Submitted"], ["competent", "Competent"], ["not_yet_competent", "Not yet competent"]]} /><Field label="Score" name="score" type="number" optional /></Pair><SelectField label="Moderation" name="moderation_status" rawOptions={[["not_required", "Not required"], ["pending", "Pending"], ["upheld", "Upheld"], ["changed", "Changed"]]} /><TextArea label="Feedback" name="feedback" /><Submit busy={props.busy}>Save result</Submit></form></FormCard></div>}<div className="dashboard-grid"><Card title="Assessment plan" eyebrow="ASSESSMENTS"><RecordList rows={assessments} empty="No assessments have been planned." render={(row) => <><b>{text(row.title)}</b><small>{human(row.assessment_type)} · Due {formatDate(row.due_date)} · {text(row.maximum_marks)} marks</small></>} /></Card><Card title="Latest outcomes" eyebrow="RESULTS"><RecordList rows={results} empty="No results have been captured." render={(row) => <><div className="record-between"><b>{lookupStudent(students, row.student_id)}</b><Status value={row.outcome} /></div><small>{lookup(assessments, row.assessment_id)} · Score: {text(row.score) || "—"}</small></>} /></Card></div></div>;
}

function EvidencePanel(props: PanelProps) {
  const students = getRows(props.data, "students"); const assessments = getRows(props.data, "assessments"); const results = getRows(props.data, "assessment_results"); const evidence = getRows(props.data, "evidence_documents"); const moderation = getRows(props.data, "moderation_records"); const canWrite = academicWriters.has(props.role); const canModerate = props.role === "college_admin" || props.role === "moderator";
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const formData = new FormData(form); const file = formData.get("file");
    if (!(file instanceof File) || !file.size) throw new Error("Choose a file to upload.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Prototype uploads are limited to 10 MB.");
    const studentId = String(formData.get("student_id")); const objectPath = `${props.institutionId}/${studentId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    if (props.demoMode) {
      await props.actions.insert("evidence_documents", { student_id: studentId, assessment_id: nullable(formData.get("assessment_id")), evidence_type: String(formData.get("evidence_type")), title: String(formData.get("title")), file_name: file.name, storage_path: `demo/${objectPath}`, content_type: file.type || "application/octet-stream", size_bytes: file.size, status: "received" }, "Demo evidence metadata added. The selected file was not uploaded anywhere.");
      form.reset(); return;
    }
    await props.actions.custom(async () => {
      const supabase = getSupabase(); const uploadResult = await supabase.storage.from("college-documents").upload(objectPath, file, { upsert: false });
      if (uploadResult.error) throw uploadResult.error;
      const { error } = await supabase.from("evidence_documents").insert({ institution_id: props.institutionId, student_id: studentId, assessment_id: nullable(formData.get("assessment_id")), evidence_type: String(formData.get("evidence_type")), title: String(formData.get("title")), file_name: file.name, storage_path: objectPath, content_type: file.type || "application/octet-stream", size_bytes: file.size, status: "received" });
      if (error) { await supabase.storage.from("college-documents").remove([objectPath]); throw error; }
      form.reset();
    }, "Evidence uploaded securely.");
  }
  async function download(row: Row) { if (props.demoMode) { downloadBlob("EDUBONKE-DEMO-EVIDENCE.txt", `EduBonke demonstration evidence placeholder\n\nTitle: ${text(row.title)}\nStudent: ${lookupStudent(students, row.student_id)}\nFilename: ${text(row.file_name)}\n\nNo real learner file is included in Demo Mode.`, "text/plain"); return; } const { data, error } = await getSupabase().storage.from("college-documents").createSignedUrl(text(row.storage_path), 60); if (error) throw error; window.open(data.signedUrl, "_blank", "noopener,noreferrer"); }
  async function moderate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = valuesFrom(form); const resultId = text(values.assessment_result_id); const decision = text(values.decision);
    if (props.demoMode) {
      await props.actions.insert("moderation_records", { ...values, moderator_id: props.user.id, moderated_at: new Date().toISOString() }, "Demo moderation record created.");
      await props.actions.update("assessment_results", resultId, { moderation_status: decision === "returned" ? "pending" : decision }, "Moderation status updated.");
      form.reset(); return;
    }
    await props.actions.custom(async () => {
      const supabase = getSupabase();
      const { error: insertError } = await supabase.from("moderation_records").insert({ ...values, institution_id: props.institutionId, moderator_id: props.user.id, moderated_at: new Date().toISOString() });
      if (insertError) throw insertError;
      const { error: updateError } = await supabase.from("assessment_results").update({ moderation_status: decision === "returned" ? "pending" : decision }).eq("id", resultId).eq("institution_id", props.institutionId);
      if (updateError) throw updateError; form.reset();
    }, "Moderation decision recorded.");
  }
  return <div className="portal-content">{(canWrite || canModerate) && <div className="feature-grid two">{canWrite && <FormCard title="Upload POE or workplace evidence" intro="Private files are stored in Supabase Storage and governed by institution membership."><form onSubmit={(event) => void upload(event)}><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><SelectField label="Assessment (optional)" name="assessment_id" options={assessments} optionLabel={(row) => text(row.title)} optional /><SelectField label="Evidence category" name="evidence_type" rawOptions={[["poe", "Portfolio of Evidence"], ["workplace", "Workplace evidence"], ["logbook", "Logbook"], ["assessment_support", "Assessment support"]]} /><Field label="Evidence title" name="title" /><label>File<input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx,.txt" required /></label><Submit busy={props.busy}>Upload evidence</Submit></form></FormCard>}{canModerate && <FormCard title="Record moderation" intro="Create a separate accountable moderation record for an assessment result."><form onSubmit={(event) => void moderate(event)}><SelectField label="Assessment result" name="assessment_result_id" options={results} optionLabel={(row) => `${lookupStudent(students, row.student_id)} · ${lookup(assessments, row.assessment_id)}`} /><SelectField label="Decision" name="decision" rawOptions={[["upheld", "Outcome upheld"], ["changed", "Outcome changed"], ["returned", "Returned to assessor"]]} /><TextArea label="Comments" name="comments" /><Submit busy={props.busy}>Save moderation</Submit></form></FormCard>}</div>}<div className="dashboard-grid"><Card title="Evidence register" eyebrow="POE & WORKPLACE"><RecordList rows={evidence} empty="No evidence files have been uploaded." render={(row) => <><div className="record-between"><b>{text(row.title)}</b><Status value={row.status} /></div><small>{lookupStudent(students, row.student_id)} · {text(row.file_name)}</small><div className="inline-actions"><button onClick={() => void download(row)}>Download</button>{academicManagers.has(props.role) && <><button onClick={() => void props.actions.update("evidence_documents", row.id, { status: "verified", reviewed_by: props.user.id, reviewed_at: new Date().toISOString() }, "Evidence verified.")}>Verify</button><button onClick={() => void props.actions.update("evidence_documents", row.id, { status: "returned", reviewed_by: props.user.id, reviewed_at: new Date().toISOString() }, "Evidence returned.")}>Return</button></>}</div></>} /></Card><Card title="Moderation history" eyebrow="QUALITY ASSURANCE"><RecordList rows={moderation} empty="No moderation decisions have been recorded." render={(row) => <><div className="record-between"><b>{lookup(results, row.assessment_result_id, "outcome")}</b><Status value={row.decision} /></div><small>{formatDate(row.moderated_at ?? row.created_at)} · {text(row.comments) || "No comments"}</small></>} /></Card></div></div>;
}

function FinancePanel(props: PanelProps) {
  const students = getRows(props.data, "students"); const invoices = getRows(props.data, "invoices"); const payments = getRows(props.data, "payments"); const funding = getRows(props.data, "funding_records"); const canWrite = financeWriters.has(props.role);
  return <div className="portal-content">{canWrite && <div className="feature-grid three"><FormCard title="Create an invoice" intro="Record a student charge in South African rand."><form onSubmit={(event) => void formInsert(event, props.actions, "invoices", { status: "issued" }, "Invoice created.")}><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><Field label="Invoice number" name="invoice_number" placeholder="INV-2026-001" /><Pair><Field label="Issue date" name="issue_date" type="date" /><Field label="Due date" name="due_date" type="date" /></Pair><Field label="Amount (R)" name="total_amount" type="number" step="0.01" /><TextArea label="Description" name="description" /><Submit busy={props.busy}>Create invoice</Submit></form></FormCard><FormCard title="Record a payment" intro="Capture a verified payment reference and method."><form onSubmit={(event) => void formInsert(event, props.actions, "payments", { status: "confirmed" }, "Payment recorded.")}><SelectField label="Invoice" name="invoice_id" options={invoices} optionLabel={(row) => `${text(row.invoice_number)} · ${money(row.balance ?? row.total_amount)}`} /><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><Pair><Field label="Amount (R)" name="amount" type="number" step="0.01" /><Field label="Payment date" name="payment_date" type="date" /></Pair><SelectField label="Method" name="payment_method" rawOptions={[["eft", "EFT"], ["cash", "Cash"], ["card", "Card"], ["debit_order", "Debit order"], ["bursary", "Bursary"]]} /><Field label="Reference" name="reference_number" /><Submit busy={props.busy}>Record payment</Submit></form></FormCard><FormCard title="Funding record" intro="Track bursary or NSFAS-related administration without claiming an official integration."><form onSubmit={(event) => void formInsert(event, props.actions, "funding_records", { status: "pending" }, "Funding record saved.")}><SelectField label="Student" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><SelectField label="Funding type" name="funding_type" rawOptions={[["self_funded", "Self funded"], ["employer", "Employer"], ["bursary", "Bursary"], ["nsfas_tracking", "NSFAS tracking"], ["other", "Other"]]} /><Field label="Provider" name="provider_name" optional /><Field label="Reference" name="reference_number" optional /><Field label="Approved amount (R)" name="approved_amount" type="number" step="0.01" /><Submit busy={props.busy}>Save funding</Submit></form></FormCard></div>}<section className="metric-row finance-metrics"><Metric label="Invoices issued" value={invoices.length} note={money(invoices.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0))} /><Metric label="Payments recorded" value={payments.length} note={money(payments.reduce((sum, row) => sum + Number(row.amount ?? 0), 0))} /><Metric label="Funding records" value={funding.length} note="Administrative tracking only" /></section><Card title="Student accounts" eyebrow="FINANCE LEDGER"><RecordList rows={invoices} empty="No invoices have been created." render={(row) => <><div className="record-between"><b>{text(row.invoice_number)} · {lookupStudent(students, row.student_id)}</b><Status value={row.status} /></div><small>Issued {formatDate(row.issue_date)} · Due {formatDate(row.due_date)}</small><p>{money(row.total_amount)} · Balance {money(row.balance ?? row.total_amount)}</p></>} /></Card><p className="scope-note">EduBonke’s prototype ledger is not statutory accounting software, a payment gateway or an official NSFAS integration.</p></div>;
}

function CommunicationsPanel(props: PanelProps) {
  const items = getRows(props.data, "announcements"); const notifications = getRows(props.data, "notifications").filter((row) => row.profile_id === props.user.id); const members = getRows(props.data, "members"); const canWrite = academicWriters.has(props.role) || financeWriters.has(props.role); const canNotify = ["college_admin", "academic_manager", "finance_officer"].includes(props.role);
  return <div className="portal-content">{canWrite && <div className="feature-grid two"><FormCard title="Publish an announcement" intro="Post an in-app notice to an authorised college audience."><form onSubmit={(event) => void formInsert(event, props.actions, "announcements", { status: "published" }, "Announcement published.")}><Field label="Title" name="title" /><SelectField label="Audience" name="audience" rawOptions={[["all", "Everyone"], ["staff", "Staff"], ["students", "Students"], ["finance", "Finance users"]]} /><TextArea label="Message" name="body" /><Submit busy={props.busy}>Publish announcement</Submit></form></FormCard>{canNotify && <FormCard title="Send a direct notification" intro="Deliver a private in-app notice to one authorised account."><form onSubmit={(event) => void formInsert(event, props.actions, "notifications", {}, "Direct notification sent.")}><SelectField label="Recipient" name="profile_id" options={members} optionValue={(row) => text(row.profile_id)} optionLabel={(row) => { const profile = (row.profiles ?? {}) as Row; return `${text(profile.full_name) || text(profile.email)} · ${human(row.role)}`; }} /><Field label="Title" name="title" /><TextArea label="Message" name="body" /><Submit busy={props.busy}>Send notification</Submit></form></FormCard>}</div>}<div className="dashboard-grid"><Card title="College noticeboard" eyebrow="COMMUNICATIONS"><RecordList rows={items} empty="No announcements have been published for your audience." render={(row) => <><div className="record-between"><b>{text(row.title)}</b><span className="audience-chip">{human(row.audience)}</span></div><p>{text(row.body)}</p><small>{formatDate(row.created_at)}</small></>} /></Card><Card title="My notifications" eyebrow="DIRECT MESSAGES"><RecordList rows={notifications} empty="You have no direct notifications." render={(row) => <><div className="record-between"><b>{text(row.title)}</b><Status value={row.read_at ? "read" : "unread"} /></div><p>{text(row.body)}</p><div className="inline-actions">{!row.read_at && <button onClick={() => void props.actions.update("notifications", row.id, { read_at: new Date().toISOString() }, "Notification marked as read.")}>Mark as read</button>}</div></>} /></Card></div></div>;
}

function ReportsPanel(props: PanelProps) {
  const students = getRows(props.data, "students"); const results = getRows(props.data, "assessment_results"); const assessments = getRows(props.data, "assessments");
  function transcript(studentId: string) {
    const student = students.find((row) => row.id === studentId); if (!student) return; const studentResults = results.filter((row) => row.student_id === studentId); const printable = window.open("", "_blank", "noopener,noreferrer"); if (!printable) return;
    printable.document.write(`<title>EduBonke Academic Record</title><style>body{font-family:Arial;padding:40px;color:#132a32}h1{margin-bottom:4px}small{color:#607075}table{width:100%;border-collapse:collapse;margin-top:30px}th,td{text-align:left;padding:10px;border-bottom:1px solid #ccd6d3}.note{margin-top:35px;padding:15px;background:#fff5df}</style><h1>Academic progress record</h1><small>${escapeHtml(text(student.student_number))} · ${escapeHtml(`${text(student.first_name)} ${text(student.last_name)}`)}</small><table><thead><tr><th>Assessment</th><th>Outcome</th><th>Score</th><th>Moderation</th></tr></thead><tbody>${studentResults.map((row) => `<tr><td>${escapeHtml(lookup(assessments, row.assessment_id))}</td><td>${escapeHtml(human(row.outcome))}</td><td>${escapeHtml(text(row.score) || "—")}</td><td>${escapeHtml(human(row.moderation_status))}</td></tr>`).join("")}</tbody></table><p class="note">Software-generated prototype record. This is not an accredited certificate or regulator submission.</p>`); printable.document.close(); printable.print();
  }
  function downloadSnapshot() {
    const payload = { exported_at: new Date().toISOString(), institution_id: props.institutionId, scope: "currently authorised and loaded records", tables: props.data };
    downloadBlob(`edubonke-workspace-snapshot-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json");
  }
  return <div className="portal-content"><section className="report-grid">{[["Student register", "students", "Core student records"], ["Admissions pipeline", "applications", "Application statuses"], ["Attendance register", "attendance_records", "Captured attendance"], ["Assessment results", "assessment_results", "Marks and outcomes"], ["Finance ledger", "invoices", "Invoices and balances"], ["Audit history", "audit_logs", "Accountable changes"]].map(([title, key, note]) => <article key={key}><span>CSV</span><h3>{title}</h3><p>{note}</p><b>{getRows(props.data, key).length} records</b><button onClick={() => { try { downloadCsv(`edubonke-${key}-${new Date().toISOString().slice(0, 10)}.csv`, getRows(props.data, key)); } catch { return; } }}>Download</button></article>)}</section><div className="dashboard-grid"><Card title="Student academic progress record" eyebrow="PRINTABLE REPORT"><div className="report-select"><select id="transcript-student" defaultValue=""><option value="" disabled>Select a student</option>{students.map((row) => <option value={text(row.id)} key={text(row.id)}>{text(row.student_number)} · {text(row.first_name)} {text(row.last_name)}</option>)}</select><button onClick={() => transcript((document.getElementById("transcript-student") as HTMLSelectElement)?.value)}>Generate printable record</button></div><p className="scope-note">Reports are operational outputs. They do not replace formal ETQA, QCTO, DHET, Umalusi or accredited certification processes.</p></Card><Card title="Workspace data snapshot" eyebrow="LOCAL JSON EXPORT"><p>Download the records this account is authorised to see and that are currently loaded in the prototype.</p><button className="secondary-action" onClick={downloadSnapshot}>Download JSON snapshot</button><p className="scope-note">This file can contain personal information. Store it securely. It is not a managed database backup.</p></Card></div></div>;
}

function SupportPanel(props: PanelProps) {
  const tickets = getRows(props.data, "support_tickets"); const comments = getRows(props.data, "support_ticket_comments");
  return <div className="portal-content"><div className="feature-grid two"><FormCard title="Log a support request" intro="Report a system, data or training issue for follow-up."><form onSubmit={(event) => void formInsert(event, props.actions, "support_tickets", { status: "open", priority: "normal" }, "Support request logged.")}><Field label="Subject" name="subject" /><SelectField label="Category" name="category" rawOptions={[["technical", "Technical"], ["data", "Data"], ["training", "Training"], ["billing", "Billing"], ["privacy", "Privacy"], ["other", "Other"]]} /><SelectField label="Priority" name="priority" rawOptions={[["low", "Low"], ["normal", "Normal"], ["high", "High"], ["critical", "Critical"]]} /><TextArea label="Description" name="description" /><Submit busy={props.busy}>Submit request</Submit></form></FormCard><FormCard title="Add a ticket comment" intro="Keep follow-up communication attached to the correct support request."><form onSubmit={(event) => void formInsert(event, props.actions, "support_ticket_comments", {}, "Comment added to the support ticket.")}><SelectField label="Ticket" name="ticket_id" options={tickets} optionLabel={(row) => `${text(row.ticket_number)} · ${text(row.subject)}`} /><TextArea label="Comment" name="body" /><Submit busy={props.busy}>Add comment</Submit></form></FormCard></div><div className="dashboard-grid"><Card title="Support queue" eyebrow="HELP DESK"><RecordList rows={tickets} empty="No support requests have been logged." render={(row) => <><div className="record-between"><b>{text(row.ticket_number)} · {text(row.subject)}</b><Status value={row.status} /></div><small>{human(row.category)} · {human(row.priority)} · {formatDate(row.created_at)}</small>{academicManagers.has(props.role) && <div className="inline-actions"><button onClick={() => void props.actions.update("support_tickets", row.id, { status: "in_progress" }, "Ticket moved to in progress.")}>Start</button><button onClick={() => void props.actions.update("support_tickets", row.id, { status: "resolved", resolved_at: new Date().toISOString() }, "Ticket resolved.")}>Resolve</button></div>}</>} /></Card><Card title="Latest support comments" eyebrow="CONVERSATION"><RecordList rows={comments.slice(0, 50)} empty="No ticket comments have been added." render={(row) => <><b>{lookup(tickets, row.ticket_id, "ticket_number")}</b><p>{text(row.body)}</p><small>{formatDate(row.created_at)}</small></>} /></Card></div></div>;
}

function PrivacyPanel(props: PanelProps) {
  const requests = getRows(props.data, "privacy_requests"); const consents = getRows(props.data, "consent_records"); const incidents = getRows(props.data, "data_incidents"); const students = getRows(props.data, "students"); const canManage = privacyManagers.has(props.role);
  return <div className="portal-content">{canManage && <div className="feature-grid three"><FormCard title="Data-subject request" intro="Log access, correction, deletion or objection activity."><form onSubmit={(event) => void formInsert(event, props.actions, "privacy_requests", { status: "open" }, "POPIA request logged.")}><Field label="Requester reference" name="requester_reference" /><SelectField label="Request type" name="request_type" rawOptions={[["access", "Access"], ["correction", "Correction"], ["deletion", "Deletion"], ["objection", "Objection"], ["restriction", "Restriction"]]} /><Field label="Due date" name="due_date" type="date" /><TextArea label="Notes" name="notes" /><Submit busy={props.busy}>Log request</Submit></form></FormCard><FormCard title="Consent record" intro="Document a purpose-specific consent decision where consent is the lawful basis."><form onSubmit={(event) => void formInsert(event, props.actions, "consent_records", { status: "granted" }, "Consent record saved.")}><SelectField label="Student (optional)" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} optional /><Field label="Data subject reference" name="data_subject_reference" /><Field label="Purpose" name="purpose" /><SelectField label="Status" name="status" rawOptions={[["granted", "Granted"], ["withdrawn", "Withdrawn"], ["not_required", "Not required"]]} /><Submit busy={props.busy}>Save consent</Submit></form></FormCard><FormCard title="Data incident" intro="Record suspected loss, disclosure or unauthorised access for Information Officer review."><form onSubmit={(event) => void formInsert(event, props.actions, "data_incidents", { status: "reported", severity: "medium" }, "Data incident recorded.")}><Field label="Incident reference" name="reference_number" /><SelectField label="Severity" name="severity" rawOptions={[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]]} /><Field label="Discovered at" name="discovered_at" type="datetime-local" /><TextArea label="Description" name="description" /><Submit busy={props.busy}>Record incident</Submit></form></FormCard></div>}<div className="dashboard-grid"><Card title="Request register" eyebrow="POPIA"><RecordList rows={requests} empty="No data-subject requests have been logged." render={(row) => <><div className="record-between"><b>{text(row.requester_reference)}</b><Status value={row.status} /></div><small>{human(row.request_type)} · Due {formatDate(row.due_date)}</small></>} /></Card><Card title="Compliance activity" eyebrow="CONSENT & INCIDENTS"><div className="status-summary"><span><b>{consents.length}</b>Consent records</span><span><b>{incidents.length}</b>Incidents</span></div><p className="scope-note">The college remains the responsible party. EduBonke’s technical controls do not replace legal advice, Information Officer duties or written operator arrangements.</p></Card></div></div>;
}

function AdministrationPanel(props: PanelProps & { isSuperAdmin: boolean }) {
  const members = getRows(props.data, "members"); const students = getRows(props.data, "students"); const invites = getRows(props.data, "institution_invites"); const audits = getRows(props.data, "audit_logs"); const subscriptions = getRows(props.data, "subscriptions"); const studentMembers = members.filter((row) => row.role === "student" && row.status === "active"); const canAdmin = props.role === "college_admin";
  async function createInvite(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const values = valuesFrom(form); const code = crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase(); await props.actions.insert("institution_invites", { ...values, code, expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), created_by: props.user.id }, "Invite code created."); form.reset(); }
  async function linkStudentAccount(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const values = valuesFrom(form); await props.actions.update("students", values.student_id, { auth_user_id: values.profile_id }, "Student account linked to the student record."); form.reset(); }
  if (props.demoMode) return (
    <div className="portal-content">
      <div className="feature-grid three">
        <FormCard title="Create a sample invite" intro="Demonstrate the administrator workflow without sending an email or creating an account.">
          <form onSubmit={(event) => void createInvite(event)}>
            <Field label="Approved email" name="email" type="email" placeholder="lecturer@example.invalid" />
            <SelectField label="Role" name="role" rawOptions={[["college_admin", "College administrator"], ["academic_manager", "Academic manager"], ["lecturer", "Lecturer / facilitator"], ["assessor", "Assessor"], ["moderator", "Moderator"], ["finance_officer", "Finance officer"], ["student", "Student"], ["workplace_supervisor", "Workplace supervisor"]]} />
            <Submit busy={props.busy}>Create sample invite</Submit>
          </form>
          <div className="invite-list">{invites.filter((row) => !row.used_at).map((row) => <div key={text(row.id)}><b>{text(row.code)}</b><span>{text(row.email)} · {human(row.role)}</span></div>)}</div>
        </FormCard>
        <FormCard title="Link a sample account" intro="Connect an invented student membership to its matching student record.">
          <form onSubmit={(event) => void linkStudentAccount(event)}>
            <SelectField label="Student record" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} />
            <SelectField label="Student account" name="profile_id" options={studentMembers} optionValue={(row) => text(row.profile_id)} optionLabel={(row) => { const profile = (row.profiles ?? {}) as Row; return text(profile.full_name) || text(profile.email); }} />
            <Submit busy={props.busy}>Link sample account</Submit>
          </form>
        </FormCard>
        <FormCard title="Demo workspace" intro="The complete demonstration dataset is already loaded in this browser.">
          <p className="scope-note">Use “Reset demo” in the sidebar to discard your changes and restore the original records. No account, email, file or database operation is performed.</p>
          <div className="subscription-box"><small>CURRENT PACKAGE</small><b>{human(subscriptions[0]?.plan_code ?? "prototype_free")}</b><span>R0 browser demo · No payment processing</span></div>
        </FormCard>
      </div>
      <div className="dashboard-grid">
        <Card title="Members and roles" eyebrow="SYNTHETIC ACCESS REGISTER"><RecordList rows={members} empty="No members were returned." render={(row) => { const profile = (row.profiles ?? {}) as Row; return <><div className="record-between"><b>{text(profile.full_name) || text(profile.email)}</b><Status value={row.status} /></div><small>{text(profile.email)} · {human(row.role)}</small></>; }} /></Card>
        <Card title="Audit history" eyebrow="BROWSER-ONLY ACCOUNTABILITY"><RecordList rows={audits.slice(0, 50)} empty="No audit events were returned." render={(row) => <><b>{human(row.action)} · {human(row.entity_type)}</b><small>{formatDate(row.created_at)} · {text(row.actor_email) || text(row.actor_id)}</small></>} /></Card>
      </div>
    </div>
  );
  return <div className="portal-content">{canAdmin && <div className="feature-grid three"><FormCard title="Invite a team member" intro="The invited person creates an account and enters this single-use code."><form onSubmit={(event) => void createInvite(event)}><Field label="Approved email" name="email" type="email" /><SelectField label="Role" name="role" rawOptions={[["college_admin", "College administrator"], ["academic_manager", "Academic manager"], ["lecturer", "Lecturer / facilitator"], ["assessor", "Assessor"], ["moderator", "Moderator"], ["finance_officer", "Finance officer"], ["student", "Student"], ["workplace_supervisor", "Workplace supervisor"]]} /><Submit busy={props.busy}>Create seven-day invite</Submit></form><div className="invite-list">{invites.filter((row) => !row.used_at).map((row) => <div key={text(row.id)}><b>{text(row.code)}</b><span>{text(row.email)} · {human(row.role)}</span></div>)}</div></FormCard><FormCard title="Link a student account" intro="After the learner joins with a student invite, link that account to the correct student record."><form onSubmit={(event) => void linkStudentAccount(event)}><SelectField label="Student record" name="student_id" options={students} optionLabel={(row) => `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}`} /><SelectField label="Student account" name="profile_id" options={studentMembers} optionValue={(row) => text(row.profile_id)} optionLabel={(row) => { const profile = (row.profiles ?? {}) as Row; return text(profile.full_name) || text(profile.email); }} /><Submit busy={props.busy}>Link account</Submit></form></FormCard><FormCard title="Synthetic demonstration data" intro="Populate this workspace with clearly labelled test records so every module can be evaluated."><p className="scope-note">Run this only in an empty test workspace. It does not create real learners or accredited records.</p><button className="primary-action" disabled={props.busy} onClick={() => void props.actions.custom(async () => { const { error } = await getSupabase().rpc("seed_demo_workspace", { p_institution_id: props.institutionId }); if (error) throw error; }, "Synthetic demonstration data created.")}>Load synthetic demo data</button><div className="subscription-box"><small>CURRENT PACKAGE</small><b>{human(subscriptions[0]?.plan_code ?? "prototype_free")}</b><span>R0 test tier · No payment processing</span></div></FormCard></div>}<div className="dashboard-grid"><Card title="Members and roles" eyebrow="ACCESS CONTROL"><RecordList rows={members} empty="No members were returned." render={(row) => { const profile = (row.profiles ?? {}) as Row; return <><div className="record-between"><b>{text(profile.full_name) || text(profile.email)}</b><Status value={row.status} /></div><small>{text(profile.email)}</small>{canAdmin && <select value={text(row.role)} onChange={(event) => void props.actions.update("institution_memberships", row.id, { role: event.target.value }, "Member role updated.")}><option value="college_admin">College administrator</option><option value="academic_manager">Academic manager</option><option value="lecturer">Lecturer</option><option value="assessor">Assessor</option><option value="moderator">Moderator</option><option value="finance_officer">Finance officer</option><option value="student">Student</option><option value="workplace_supervisor">Workplace supervisor</option></select>}</>; }} /></Card><Card title="Audit history" eyebrow="ACCOUNTABILITY"><RecordList rows={audits.slice(0, 50)} empty="No audit events were returned." render={(row) => <><b>{human(row.action)} · {human(row.entity_type)}</b><small>{formatDate(row.created_at)} · {text(row.actor_email) || text(row.actor_id)}</small></>} /></Card></div>{props.isSuperAdmin && <Card title="Platform tenant register" eyebrow="SUPER ADMIN"><RecordList rows={getRows(props.data, "platform_institutions")} empty="No institutions available." render={(row) => <><b>{text(row.name)}</b><small>{text(row.registration_number)} · {human(row.status)}</small></>} /></Card>}</div>;
}

function Onboarding({ user, busy, notice, setBusy, setNotice, onComplete, onSignOut }: { user: User; busy: boolean; notice: Notice; setBusy(value: boolean): void; setNotice(value: Notice): void; onComplete(): Promise<void>; onSignOut(): Promise<void> }) {
  async function execute(action: () => Promise<void>) { setBusy(true); setNotice(null); try { await action(); await onComplete(); } catch (error) { setNotice({ type: "error", text: message(error) }); } finally { setBusy(false); } }
  return <main className="onboarding-page"><header><Link className="brand" href="/" aria-label="EduBonke home"><BrandLogo /></Link><button onClick={() => void onSignOut()}>Sign out</button></header><section><p className="eyebrow-text">Workspace onboarding</p><h1>Connect your account to a college.</h1><p>Create a synthetic test workspace if you are the college administrator, or join with a code issued by an administrator.</p>{notice && <div className={`portal-notice ${notice.type}`}>{notice.text}</div>}<div className="onboarding-grid"><FormCard title="Create a test college" intro="You will become the first college administrator."><form onSubmit={(event) => { event.preventDefault(); const values = valuesFrom(event.currentTarget); void execute(async () => { const { error } = await getSupabase().rpc("create_institution_with_owner", { p_name: values.name, p_registration_number: values.registration_number || null }); if (error) throw error; }); }}><Field label="College name" name="name" /><Field label="Registration reference (optional)" name="registration_number" optional /><Submit busy={busy}>Create workspace</Submit></form></FormCard><FormCard title="Join an existing college" intro="Enter the single-use code supplied to your email address."><form onSubmit={(event) => { event.preventDefault(); const code = String(new FormData(event.currentTarget).get("code") ?? "").trim().toUpperCase(); void execute(async () => { const { error } = await getSupabase().rpc("join_institution_by_code", { p_code: code }); if (error) throw error; }); }}><Field label="Invite code" name="code" /><Submit busy={busy}>Join workspace</Submit></form></FormCard></div><small>Signed in as {user.email}</small></section></main>;
}

function ConfigurationRequired() { return <main className="configuration-page"><div><BrandMark className="configuration-brand-mark" title="EduBonke" /><p className="eyebrow-text">One-time setup</p><h1>Connect the free Supabase backend.</h1><p>The frontend is ready, but authentication and shared data stay disabled until the repository is connected to a Supabase Free project.</p><ol><li>Create a Supabase Free project.</li><li>Run the included SQL migration.</li><li>Add the project URL and anonymous key to GitHub repository secrets.</li><li>Run the GitHub Pages workflow.</li></ol><p>Follow <code>docs/ZERO_COST_SETUP.md</code> exactly.</p><Link className="button" href="/">Return to the public site</Link></div></main>; }
function LoadingScreen({ text: label, compact = false }: { text: string; compact?: boolean }) { return <div className={compact ? "loading-screen compact" : "loading-screen"}><span /><p>{label}</p></div>; }
function Metric({ label, value, note }: { label: string; value: React.ReactNode; note: string }) { return <article><small>{label}</small><strong>{value}</strong><span>{note}</span></article>; }
function Card({ title, eyebrow, children, wide = false }: { title: string; eyebrow: string; children: React.ReactNode; wide?: boolean }) { return <section className={`portal-card ${wide ? "wide" : ""}`}><div className="card-heading"><div><small>{eyebrow}</small><h2>{title}</h2></div></div>{children}</section>; }
function FormCard({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) { return <section className="portal-card form-card"><small>PROTECTED ACTION</small><h2>{title}</h2><p>{intro}</p>{children}</section>; }
function Pair({ children }: { children: React.ReactNode }) { return <div className="form-pair">{children}</div>; }
function Field({ label, name, type = "text", placeholder, optional = false, step }: { label: string; name: string; type?: string; placeholder?: string; optional?: boolean; step?: string }) { return <label>{label}<input name={name} type={type} placeholder={placeholder} required={!optional} step={step} /></label>; }
function TextArea({ label, name }: { label: string; name: string }) { return <label>{label}<textarea name={name} rows={3} /></label>; }
function SelectField({ label, name, options, optionLabel, optionValue, rawOptions, optional = false }: { label: string; name: string; options?: Row[]; optionLabel?: (row: Row) => string; optionValue?: (row: Row) => string; rawOptions?: string[][]; optional?: boolean }) { return <label>{label}<select name={name} defaultValue="" required={!optional}><option value="">{optional ? "Not linked" : "Select an option"}</option>{rawOptions?.map(([value, title]) => <option value={value} key={value}>{title}</option>)}{options?.map((row) => { const value = optionValue?.(row) ?? text(row.id); return <option value={value} key={value}>{optionLabel?.(row) ?? text(row.name ?? row.title)}</option>; })}</select></label>; }
function Submit({ busy, children }: { busy: boolean; children: React.ReactNode }) { return <button className="primary-action" disabled={busy}>{busy ? "Saving…" : children}</button>; }
function Status({ value }: { value: unknown }) { return <span className={`status-pill status-${text(value)}`}>{human(value)}</span>; }
function Empty({ text: label }: { text: string }) { return <div className="empty-state"><span>○</span><p>{label}</p></div>; }
function RecordList({ rows, empty, render }: { rows: Row[]; empty: string; render(row: Row): React.ReactNode }) { if (!rows.length) return <Empty text={empty} />; return <div className="record-list">{rows.map((row, index) => <article key={text(row.id) || String(index)}>{render(row)}</article>)}</div>; }

async function formInsert(event: React.FormEvent<HTMLFormElement>, actions: PanelProps["actions"], table: string, defaults: Row, success: string) { event.preventDefault(); const form = event.currentTarget; await actions.insert(table, { ...defaults, ...valuesFrom(form) }, success); form.reset(); }
async function formUpsert(event: React.FormEvent<HTMLFormElement>, actions: PanelProps["actions"], table: string, conflict: string, success: string) { event.preventDefault(); const form = event.currentTarget; await actions.upsert(table, valuesFrom(form), conflict, success); form.reset(); }
function valuesFrom(form: HTMLFormElement): Row { const output: Row = {}; for (const [key, raw] of new FormData(form).entries()) { if (raw instanceof File) continue; const value = raw.trim(); if (!value) continue; const input = form.elements.namedItem(key) as HTMLInputElement | null; output[key] = input?.type === "number" ? Number(value) : input?.type === "datetime-local" ? new Date(value).toISOString() : value; } return output; }
function parseCsv(source: string) { const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false; const input = source.replace(/^\uFEFF/, ""); for (let index = 0; index < input.length; index += 1) { const character = input[index]; if (character === '"' && quoted && input[index + 1] === '"') { field += '"'; index += 1; } else if (character === '"') quoted = !quoted; else if (character === "," && !quoted) { row.push(field); field = ""; } else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && input[index + 1] === "\n") index += 1; row.push(field); if (row.some((value) => value.trim())) rows.push(row); row = []; field = ""; } else field += character; } row.push(field); if (row.some((value) => value.trim())) rows.push(row); const headers = (rows.shift() ?? []).map((value) => value.trim().toLowerCase()); return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))); }
function downloadBlob(filename: string, content: string, type: string) { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = filename; link.click(); URL.revokeObjectURL(link.href); }
function getRows(data: WorkspaceData, key: string) { return (data[key] ?? []) as Row[]; }
function text(value: unknown) { return value == null ? "" : String(value); }
function nullable(value: FormDataEntryValue | null) { const result = text(value).trim(); return result || null; }
function lookup(rows: Row[], id: unknown, field = "title") { const row = rows.find((item) => item.id === id); return text(row?.[field] ?? row?.name ?? row?.code) || "Not linked"; }
function lookupStudent(rows: Row[], id: unknown) { const row = rows.find((item) => item.id === id); return row ? `${text(row.student_number)} · ${text(row.first_name)} ${text(row.last_name)}` : "Student record"; }
function message(error: unknown) { return error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "The request could not be completed."; }
function initials(value: string) { return value.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""); }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character)); }
function navIcon(key: string) { return ({ overview: "⌂", admissions: "↗", students: "◎", academics: "▦", timetable: "□", attendance: "✓", assessments: "◇", evidence: "▣", finance: "R", communications: "◌", reports: "▤", support: "?", privacy: "◈", administration: "⚙" } as Record<string, string>)[key] ?? "•"; }
