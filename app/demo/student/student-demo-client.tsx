"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BrandLogo from "../../brand";
import { createDemoWorkspace } from "../../../lib/demo-data";
import { formatDate, human, money, type WorkspaceData } from "../../../lib/platform";

type Row = Record<string, unknown>;
type StudentView = "dashboard" | "studies" | "timetable" | "attendance" | "assessments" | "poe" | "finance" | "announcements" | "support" | "privacy";

const studentId = "student-1";
const studentProfileId = "profile-student";

const studentNavigation: Array<[StudentView, string, string]> = [
  ["dashboard", "My dashboard", "⌂"],
  ["studies", "My studies", "▦"],
  ["timetable", "Timetable", "□"],
  ["attendance", "Attendance", "✓"],
  ["assessments", "Assessments & results", "◇"],
  ["poe", "My POE", "▣"],
  ["finance", "My fees", "R"],
  ["announcements", "Announcements", "◌"],
  ["support", "Get support", "?"],
  ["privacy", "My privacy", "◈"],
];

export default function StudentDemoClient() {
  const [data, setData] = useState<WorkspaceData>(() => createDemoWorkspace());
  const [view, setView] = useState<StudentView>("dashboard");
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>([]);

  const student = rows(data, "students").find((row) => row.id === studentId) ?? {};
  const enrolment = rows(data, "enrolments").find((row) => row.student_id === studentId);
  const programme = rows(data, "programmes").find((row) => row.id === enrolment?.programme_id);
  const classRecord = rows(data, "classes").find((row) => row.id === enrolment?.class_id);
  const classIds = useMemo(() => new Set(rows(data, "enrolments").filter((row) => row.student_id === studentId).map((row) => row.class_id)), [data]);
  const timetable = rows(data, "timetable_entries").filter((row) => classIds.has(row.class_id));
  const attendance = rows(data, "attendance_records").filter((row) => row.student_id === studentId);
  const programmeIds = useMemo(() => new Set(rows(data, "enrolments").filter((row) => row.student_id === studentId).map((row) => row.programme_id)), [data]);
  const assessments = rows(data, "assessments").filter((row) => programmeIds.has(row.programme_id));
  const results = rows(data, "assessment_results").filter((row) => row.student_id === studentId);
  const evidence = rows(data, "evidence_documents").filter((row) => row.student_id === studentId);
  const invoices = rows(data, "invoices").filter((row) => row.student_id === studentId);
  const payments = rows(data, "payments").filter((row) => row.student_id === studentId);
  const funding = rows(data, "funding_records").filter((row) => row.student_id === studentId);
  const announcements = rows(data, "announcements").filter((row) => row.status === "published" && ["all", "students"].includes(String(row.audience)));
  const tickets = rows(data, "support_tickets").filter((row) => row.created_by === studentProfileId);
  const privacyRequests = rows(data, "privacy_requests").filter((row) => row.requester_reference === student.student_number);
  const totalBalance = invoices.reduce((sum, row) => sum + Number(row.balance ?? 0), 0);
  const attendanceRate = attendance.length ? Math.round(attendance.filter((row) => row.status === "present" || row.status === "late").length / attendance.length * 100) : 0;

  function resetDemo() {
    setData(createDemoWorkspace());
    setView("dashboard");
    setReadAnnouncements([]);
    setNotice("The student demonstration has been reset.");
  }

  function addEvidence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file") as File;
    const next: Row = {
      id: crypto.randomUUID(),
      institution_id: "demo-mhlabeni-college",
      student_id: studentId,
      assessment_id: String(formData.get("assessment_id")),
      evidence_type: "poe",
      title: String(formData.get("title")),
      file_name: file.name,
      storage_path: `demo/student/${file.name}`,
      content_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      status: "received",
      created_at: new Date().toISOString(),
    };
    setData((current) => ({ ...current, evidence_documents: [next, ...(current.evidence_documents ?? [])] }));
    setNotice("Demo POE evidence added. The selected file stayed on your device and was not uploaded.");
    form.reset();
  }

  function addSupportTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const next: Row = {
      id: crypto.randomUUID(),
      institution_id: "demo-mhlabeni-college",
      ticket_number: `DEMO-TKT-${String(rows(data, "support_tickets").length + 1).padStart(3, "0")}`,
      subject: String(formData.get("subject")),
      description: String(formData.get("description")),
      category: String(formData.get("category")),
      priority: "normal",
      status: "open",
      created_by: studentProfileId,
      created_at: new Date().toISOString(),
    };
    setData((current) => ({ ...current, support_tickets: [next, ...(current.support_tickets ?? [])] }));
    setNotice("Support request submitted in this browser demonstration.");
    form.reset();
  }

  function addPrivacyRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const next: Row = {
      id: crypto.randomUUID(),
      institution_id: "demo-mhlabeni-college",
      requester_reference: student.student_number,
      request_type: String(formData.get("request_type")),
      notes: String(formData.get("notes")),
      status: "open",
      due_date: "2026-09-20",
      created_at: new Date().toISOString(),
    };
    setData((current) => ({ ...current, privacy_requests: [next, ...(current.privacy_requests ?? [])] }));
    setNotice("Privacy request recorded in this browser demonstration.");
    form.reset();
  }

  function renderContent() {
    if (view === "studies") return (
      <div className="portal-content dashboard-grid">
        <StudentCard title="Current programme" eyebrow="MY REGISTRATION">
          <div className="student-study-summary"><span>Programme</span><b>{text(programme?.title)}</b><small>{text(programme?.code)} · NQF {text(programme?.nqf_level)} · {text(programme?.credits)} credits</small></div>
          <div className="student-detail-grid"><span><small>Class</small><b>{text(classRecord?.name)}</b></span><span><small>Status</small><StudentStatus value={enrolment?.status} /></span><span><small>Started</small><b>{formatDate(enrolment?.start_date)}</b></span><span><small>Expected completion</small><b>{formatDate(enrolment?.expected_end_date)}</b></span></div>
        </StudentCard>
        <StudentCard title="Programme modules" eyebrow="LEARNING PLAN">
          <StudentList rows={rows(data, "modules").filter((row) => row.programme_id === programme?.id)} empty="No modules are linked." render={(row) => <><b>{text(row.code)} · {text(row.title)}</b><small>{text(row.unit_standard_reference)} · {text(row.credits)} credits</small></>} />
        </StudentCard>
      </div>
    );
    if (view === "timetable") return (
      <div className="portal-content"><StudentCard title="My timetable" eyebrow="UPCOMING CLASSES"><StudentList rows={timetable} empty="No classes are scheduled." render={(row) => <><div className="record-between"><b>{text(row.title)}</b><StudentStatus value={row.status} /></div><small>{formatDate(row.session_date)} · {text(row.start_time)}–{text(row.end_time)} · {text(row.venue)}</small></>} /></StudentCard></div>
    );
    if (view === "attendance") return (
      <div className="portal-content"><section className="metric-row student-metric-row"><article><small>Recorded sessions</small><strong>{attendance.length}</strong><span>Your linked attendance records</span></article><article><small>Attendance rate</small><strong>{attendanceRate}%</strong><span>Present and late sessions</span></article></section><StudentCard title="Attendance history" eyebrow="MY REGISTER"><StudentList rows={attendance} empty="No attendance has been recorded." render={(row) => { const session = rows(data, "attendance_sessions").find((item) => item.id === row.attendance_session_id); return <><div className="record-between"><b>{text(session?.topic)}</b><StudentStatus value={row.status} /></div><small>{formatDate(session?.session_date)}{row.note ? ` · ${text(row.note)}` : ""}</small></>; }} /></StudentCard></div>
    );
    if (view === "assessments") return (
      <div className="portal-content"><StudentCard title="Assessments and results" eyebrow="MY ACADEMIC PROGRESS"><StudentList rows={assessments} empty="No assessments are published." render={(row) => { const result = results.find((item) => item.assessment_id === row.id); return <><div className="record-between"><b>{text(row.title)}</b><StudentStatus value={result?.outcome ?? row.status} /></div><small>{human(row.assessment_type)} · Due {formatDate(row.due_date)} · {text(row.maximum_marks)} marks</small>{result && <p>{result.score != null ? `Score: ${text(result.score)}% · ` : ""}{text(result.feedback)}</p>}</>; }} /></StudentCard></div>
    );
    if (view === "poe") return (
      <div className="portal-content two-column">
        <StudentCard title="Submit POE evidence" eyebrow="STUDENT ACTION" form>
          <p className="student-form-intro">Choose a demonstration file to see the submission workflow. No file leaves your device.</p>
          <form className="student-action-form" onSubmit={addEvidence}>
            <label>Assessment<select name="assessment_id" defaultValue="" required><option value="">Select an assessment</option>{assessments.map((row) => <option key={text(row.id)} value={text(row.id)}>{text(row.title)}</option>)}</select></label>
            <label>Evidence title<input name="title" required placeholder="Example: Hardware diagnostic checklist" /></label>
            <label>Choose file<input name="file" type="file" required /></label>
            <button className="primary-action">Add demonstration evidence</button>
          </form>
        </StudentCard>
        <StudentCard title="My evidence" eyebrow="POE REGISTER"><StudentList rows={evidence} empty="No evidence has been added." render={(row) => <><div className="record-between"><b>{text(row.title)}</b><StudentStatus value={row.status} /></div><small>{text(row.file_name)} · {formatDate(row.created_at)}</small></>} /></StudentCard>
      </div>
    );
    if (view === "finance") return (
      <div className="portal-content"><section className="metric-row student-metric-row"><article><small>Outstanding balance</small><strong>{money(totalBalance)}</strong><span>Across {invoices.length} invoice(s)</span></article><article><small>Payments recorded</small><strong>{money(payments.reduce((sum, row) => sum + Number(row.amount ?? 0), 0))}</strong><span>Prototype ledger only</span></article></section><div className="dashboard-grid"><StudentCard title="My invoices" eyebrow="FEE ACCOUNT"><StudentList rows={invoices} empty="No invoices are available." render={(row) => <><div className="record-between"><b>{text(row.invoice_number)}</b><StudentStatus value={row.status} /></div><small>Issued {formatDate(row.issue_date)} · Due {formatDate(row.due_date)}</small><p>{money(row.total_amount)} · Balance {money(row.balance)}</p></>} /></StudentCard><StudentCard title="Funding and payments" eyebrow="ACCOUNT ACTIVITY"><StudentList rows={[...payments, ...funding]} empty="No account activity is available." render={(row) => row.payment_date ? <><b>Payment · {money(row.amount)}</b><small>{formatDate(row.payment_date)} · {human(row.payment_method)} · {text(row.reference_number)}</small></> : <><div className="record-between"><b>{human(row.funding_type)}</b><StudentStatus value={row.status} /></div><small>{text(row.provider_name)} · {money(row.approved_amount)}</small></>} /></StudentCard></div><p className="scope-note">This is an administrative fee view, not a payment gateway or official NSFAS integration.</p></div>
    );
    if (view === "announcements") return (
      <div className="portal-content"><StudentCard title="College announcements" eyebrow="FOR STUDENTS"><StudentList rows={announcements} empty="There are no announcements." render={(row) => <><div className="record-between"><b>{text(row.title)}</b>{!readAnnouncements.includes(text(row.id)) && <span className="student-new-chip">New</span>}</div><small>{formatDate(row.created_at)} · {human(row.audience)}</small><p>{text(row.body)}</p><button className="student-inline-button" onClick={() => setReadAnnouncements((current) => current.includes(text(row.id)) ? current : [...current, text(row.id)])}>Mark as read</button></>} /></StudentCard></div>
    );
    if (view === "support") return (
      <div className="portal-content two-column"><StudentCard title="Request support" eyebrow="STUDENT ACTION" form><p className="student-form-intro">Ask for technical, academic, finance or data assistance.</p><form className="student-action-form" onSubmit={addSupportTicket}><label>Category<select name="category" defaultValue="technical" required><option value="technical">Technical</option><option value="academic">Academic</option><option value="finance">Finance</option><option value="data">Personal information correction</option></select></label><label>Subject<input name="subject" required /></label><label>What do you need help with?<textarea name="description" required rows={4} /></label><button className="primary-action">Submit support request</button></form></StudentCard><StudentCard title="My support requests" eyebrow="HELP DESK"><StudentList rows={tickets} empty="No requests have been submitted." render={(row) => <><div className="record-between"><b>{text(row.ticket_number)} · {text(row.subject)}</b><StudentStatus value={row.status} /></div><small>{human(row.category)} · {formatDate(row.created_at)}</small><p>{text(row.description)}</p></>} /></StudentCard></div>
    );
    if (view === "privacy") return (
      <div className="portal-content two-column"><StudentCard title="Make a privacy request" eyebrow="POPIA ACTION" form><p className="student-form-intro">Request access to or correction of your personal information. The college reviews each request.</p><form className="student-action-form" onSubmit={addPrivacyRequest}><label>Request type<select name="request_type" defaultValue="" required><option value="">Select a request</option><option value="access">Access my information</option><option value="correction">Correct my information</option><option value="deletion">Request deletion</option><option value="objection">Object to processing</option></select></label><label>Details<textarea name="notes" required rows={4} /></label><button className="primary-action">Record privacy request</button></form></StudentCard><StudentCard title="My privacy requests" eyebrow="REQUEST TRACKER"><StudentList rows={privacyRequests} empty="No privacy requests have been recorded." render={(row) => <><div className="record-between"><b>{human(row.request_type)}</b><StudentStatus value={row.status} /></div><small>Reference {text(row.requester_reference)} · Due {formatDate(row.due_date)}</small><p>{text(row.notes)}</p></>} /></StudentCard></div>
    );
    return (
      <div className="portal-content">
        <section className="metric-row"><article><small>Current programme</small><strong className="student-metric-text">NQF {text(programme?.nqf_level)}</strong><span>{text(programme?.code)}</span></article><article><small>Attendance</small><strong>{attendanceRate}%</strong><span>{attendance.length} recorded session(s)</span></article><article><small>Published assessments</small><strong>{assessments.length}</strong><span>{results.length} result(s) available</span></article><article><small>Outstanding fees</small><strong>{money(totalBalance)}</strong><span>Administrative balance</span></article></section>
        <div className="dashboard-grid"><StudentCard title="My next classes" eyebrow="TIMETABLE"><StudentList rows={timetable.slice(0, 4)} empty="No classes are scheduled." render={(row) => <><b>{text(row.title)}</b><small>{formatDate(row.session_date)} · {text(row.start_time)}–{text(row.end_time)} · {text(row.venue)}</small></>} /></StudentCard><StudentCard title="Latest announcements" eyebrow="COLLEGE NOTICES"><StudentList rows={announcements.slice(0, 4)} empty="There are no announcements." render={(row) => <><b>{text(row.title)}</b><small>{formatDate(row.created_at)} · {human(row.audience)}</small><p>{text(row.body)}</p></>} /></StudentCard></div>
        <section className="scope-banner"><div><b>Student access: Thabo Mokoena</b><p>This demonstration shows only the synthetic learner’s own academic, fee, evidence and support information.</p></div><span>Synthetic student</span></section>
      </div>
    );
  }

  const currentLabel = studentNavigation.find(([key]) => key === view)?.[1] ?? "My dashboard";

  return (
    <main className="portal-shell student-demo-shell">
      <aside className={mobileNav ? "portal-sidebar open" : "portal-sidebar"}>
        <BrandLogo className="portal-brand" inverse subtitle="Student Demo" />
        <div className="workspace-card"><small>MY COLLEGE</small><b>Mhlabeni Skills College — Demo</b><span>{text(student.student_number)} · Active student</span></div>
        <nav>{studentNavigation.map(([key, label, icon]) => <button key={key} className={view === key ? "active" : ""} onClick={() => { setView(key); setMobileNav(false); }}><span>{icon}</span>{label}</button>)}</nav>
        <div className="sidebar-footer"><Link href="/demo">Switch demo</Link><button onClick={resetDemo}>Reset demo</button></div>
      </aside>
      <section className="portal-main">
        <header className="portal-topbar"><button className="mobile-menu" onClick={() => setMobileNav((value) => !value)} aria-label="Toggle navigation">☰</button><div><small>Student demo · {currentLabel}</small><h1>{view === "dashboard" ? `Welcome, ${text(student.first_name)}` : currentLabel}</h1></div><div className="account-chip"><span>TM</span><div><b>Thabo Mokoena</b><small>Student · {text(student.student_number)}</small></div></div></header>
        <div className="demo-mode-banner"><b>Student demonstration</b><span>Only Thabo’s invented learner record is shown. Changes remain in this browser session.</span><Link href="/demo">Choose another demo</Link></div>
        {notice && <div className="portal-notice success" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
        {renderContent()}
      </section>
    </main>
  );
}

function StudentCard({ title, eyebrow, children, form = false }: { title: string; eyebrow: string; children: React.ReactNode; form?: boolean }) {
  return <section className={`portal-card ${form ? "form-card" : ""}`}><div className="card-heading"><div><small>{eyebrow}</small><h2>{title}</h2></div></div>{children}</section>;
}

function StudentList({ rows: items, empty, render }: { rows: Row[]; empty: string; render(row: Row): React.ReactNode }) {
  if (!items.length) return <div className="empty-state"><span>○</span><p>{empty}</p></div>;
  return <div className="record-list">{items.map((row, index) => <article key={text(row.id) || String(index)}>{render(row)}</article>)}</div>;
}

function StudentStatus({ value }: { value: unknown }) {
  return <span className={`status-pill status-${text(value)}`}>{human(value)}</span>;
}

function rows(data: WorkspaceData, key: string) { return (data[key] ?? []) as Row[]; }
function text(value: unknown) { return value == null ? "" : String(value); }
