import type { Membership, WorkspaceData } from "./platform";

export const demoInstitutionId = "demo-mhlabeni-college";

export const demoMemberships: Membership[] = [{
  id: "membership-admin",
  institution_id: demoInstitutionId,
  profile_id: "profile-admin",
  role: "college_admin",
  status: "active",
  institutions: {
    id: demoInstitutionId,
    name: "Mhlabeni Skills College — Demo",
    registration_number: "DEMO-REG-2026",
    invite_code: "DEMOONLY",
  },
}];

export const demoUser = {
  id: "profile-admin",
  email: "nomsa.admin@example.invalid",
  user_metadata: { full_name: "Nomsa Dlamini" },
};

export function createDemoWorkspace(): WorkspaceData {
  const institution_id = demoInstitutionId;
  return {
    campuses: [
      { id: "campus-jhb", institution_id, name: "Johannesburg Campus", code: "JHB", address: "100 Demo Street, Johannesburg", status: "active", created_at: "2026-01-08T08:00:00Z" },
      { id: "campus-soweto", institution_id, name: "Soweto Campus", code: "SWT", address: "25 Sample Avenue, Soweto", status: "active", created_at: "2026-01-08T08:05:00Z" },
    ],
    academic_periods: [
      { id: "period-2026", institution_id, name: "2026 Academic Year", start_date: "2026-01-12", end_date: "2026-12-10", status: "active" },
      { id: "period-sep", institution_id, name: "September 2026 Intake", start_date: "2026-09-01", end_date: "2027-08-31", status: "planned" },
    ],
    programmes: [
      { id: "programme-ts4", institution_id, code: "TS-NQF4-DEMO", title: "Technical Support NQF Level 4 — Demo", nqf_level: "4", saqa_id: "DEMO-78964", credits: 163, delivery_mode: "blended", status: "active" },
      { id: "programme-euc3", institution_id, code: "EUC-NQF3-DEMO", title: "End User Computing NQF Level 3 — Demo", nqf_level: "3", saqa_id: "DEMO-61591", credits: 130, delivery_mode: "classroom", status: "active" },
      { id: "programme-ba5", institution_id, code: "BA-NQF5-DEMO", title: "Business Analysis Support Practice NQF Level 5 — Demo", nqf_level: "5", saqa_id: "DEMO-63769", credits: 138, delivery_mode: "blended", status: "active" },
    ],
    modules: [
      { id: "module-hardware", institution_id, programme_id: "programme-ts4", code: "HW-14913", title: "Computer Hardware Support", unit_standard_reference: "DEMO-US-14913", credits: 12 },
      { id: "module-network", institution_id, programme_id: "programme-ts4", code: "NET-14937", title: "Network Support", unit_standard_reference: "DEMO-US-14937", credits: 10 },
      { id: "module-word", institution_id, programme_id: "programme-euc3", code: "WP-117924", title: "Word Processing", unit_standard_reference: "DEMO-US-117924", credits: 5 },
      { id: "module-analysis", institution_id, programme_id: "programme-ba5", code: "BA-CORE", title: "Business Analysis Practice", unit_standard_reference: "DEMO-BA-CORE", credits: 15 },
    ],
    programme_modules: [],
    classes: [
      { id: "class-ts-a", institution_id, name: "Technical Support 4A", programme_id: "programme-ts4", campus_id: "campus-jhb", academic_period_id: "period-2026", capacity: 20, status: "active" },
      { id: "class-euc-a", institution_id, name: "End User Computing 3A", programme_id: "programme-euc3", campus_id: "campus-soweto", academic_period_id: "period-2026", capacity: 24, status: "active" },
      { id: "class-ba-a", institution_id, name: "Business Analysis 5A", programme_id: "programme-ba5", campus_id: "campus-jhb", academic_period_id: "period-2026", capacity: 22, status: "active" },
    ],
    applications: [
      { id: "app-1", institution_id, reference_number: "DEMO-APP-001", first_name: "Ayanda", last_name: "Nkosi", email: "ayanda.nkosi@example.invalid", phone: "000 000 0001", programme_id: "programme-ts4", intake_date: "2026-09-01", status: "reviewing", notes: "Synthetic application awaiting document review.", created_at: "2026-08-11T09:00:00Z" },
      { id: "app-2", institution_id, reference_number: "DEMO-APP-002", first_name: "Kagiso", last_name: "Molefe", email: "kagiso.molefe@example.invalid", phone: "000 000 0002", programme_id: "programme-euc3", intake_date: "2026-09-01", status: "received", notes: "Synthetic online enquiry.", created_at: "2026-08-12T10:00:00Z" },
      { id: "app-3", institution_id, reference_number: "DEMO-APP-003", first_name: "Lerato", last_name: "Mthembu", email: "lerato.mthembu@example.invalid", phone: "000 000 0003", programme_id: "programme-ba5", intake_date: "2026-09-01", status: "accepted", created_at: "2026-08-10T08:30:00Z" },
      { id: "app-4", institution_id, reference_number: "DEMO-APP-004", first_name: "Sibusiso", last_name: "Mahlangu", email: "sibusiso.mahlangu@example.invalid", phone: "000 000 0004", programme_id: "programme-ts4", intake_date: "2026-09-01", status: "waitlisted", created_at: "2026-08-09T11:30:00Z" },
    ],
    students: [
      { id: "student-1", institution_id, auth_user_id: "profile-student", student_number: "DEMO-TS-001", first_name: "Thabo", last_name: "Mokoena", email: "thabo.mokoena@example.invalid", phone: "000 000 1001", date_of_birth: "2002-04-17", status: "active", created_at: "2026-01-10T08:00:00Z" },
      { id: "student-2", institution_id, student_number: "DEMO-TS-002", first_name: "Zanele", last_name: "Khumalo", email: "zanele.khumalo@example.invalid", phone: "000 000 1002", date_of_birth: "2001-11-04", status: "active", created_at: "2026-01-10T08:10:00Z" },
      { id: "student-3", institution_id, student_number: "DEMO-EUC-001", first_name: "Karabo", last_name: "Maseko", email: "karabo.maseko@example.invalid", phone: "000 000 1003", date_of_birth: "2003-02-22", status: "active", created_at: "2026-01-10T08:20:00Z" },
      { id: "student-4", institution_id, student_number: "DEMO-EUC-002", first_name: "Nokuthula", last_name: "Ndlovu", email: "nokuthula.ndlovu@example.invalid", phone: "000 000 1004", date_of_birth: "2002-07-19", status: "inactive", created_at: "2026-01-10T08:30:00Z" },
      { id: "student-5", institution_id, student_number: "DEMO-BA-001", first_name: "Refilwe", last_name: "Mabena", email: "refilwe.mabena@example.invalid", phone: "000 000 1005", date_of_birth: "2000-09-13", status: "graduated", created_at: "2025-01-15T08:00:00Z" },
    ],
    student_status_history: [
      { id: "history-1", institution_id, student_id: "student-4", previous_status: "active", new_status: "inactive", created_at: "2026-08-05T13:15:00Z" },
      { id: "history-2", institution_id, student_id: "student-5", previous_status: "active", new_status: "graduated", created_at: "2026-07-30T09:45:00Z" },
    ],
    student_documents: [],
    enrolments: [
      { id: "enrolment-1", institution_id, student_id: "student-1", programme_id: "programme-ts4", academic_period_id: "period-2026", class_id: "class-ts-a", start_date: "2026-01-12", expected_end_date: "2026-12-10", status: "active" },
      { id: "enrolment-2", institution_id, student_id: "student-2", programme_id: "programme-ts4", academic_period_id: "period-2026", class_id: "class-ts-a", start_date: "2026-01-12", expected_end_date: "2026-12-10", status: "active" },
      { id: "enrolment-3", institution_id, student_id: "student-3", programme_id: "programme-euc3", academic_period_id: "period-2026", class_id: "class-euc-a", start_date: "2026-01-12", expected_end_date: "2026-12-10", status: "active" },
    ],
    workplace_placements: [
      { id: "placement-1", institution_id, student_id: "student-1", supervisor_profile_id: "profile-supervisor", employer_name: "Ubuntu Tech Services — Demo", start_date: "2026-07-01", end_date: "2026-09-30", status: "active" },
    ],
    timetable_entries: [
      { id: "timetable-1", institution_id, class_id: "class-ts-a", module_id: "module-hardware", title: "Hardware diagnostics practical", session_date: "2026-08-17", start_time: "09:00", end_time: "12:00", venue: "Johannesburg Lab 1", status: "scheduled" },
      { id: "timetable-2", institution_id, class_id: "class-euc-a", module_id: "module-word", title: "Advanced document formatting", session_date: "2026-08-18", start_time: "08:30", end_time: "11:30", venue: "Soweto Room 3", status: "scheduled" },
      { id: "timetable-3", institution_id, class_id: "class-ba-a", module_id: "module-analysis", title: "Stakeholder requirements workshop", session_date: "2026-08-19", start_time: "13:00", end_time: "16:00", venue: "Johannesburg Room 5", status: "scheduled" },
    ],
    attendance_sessions: [
      { id: "attendance-session-1", institution_id, class_id: "class-ts-a", timetable_entry_id: "timetable-1", session_date: "2026-08-12", topic: "Fault-finding workflow", status: "closed" },
      { id: "attendance-session-2", institution_id, class_id: "class-euc-a", session_date: "2026-08-13", topic: "Mail merge", status: "open" },
    ],
    attendance_records: [
      { id: "attendance-1", institution_id, attendance_session_id: "attendance-session-1", student_id: "student-1", status: "present", note: "Completed the demonstration activity." },
      { id: "attendance-2", institution_id, attendance_session_id: "attendance-session-1", student_id: "student-2", status: "late", note: "Arrived 15 minutes late." },
      { id: "attendance-3", institution_id, attendance_session_id: "attendance-session-2", student_id: "student-3", status: "present", note: "" },
      { id: "attendance-4", institution_id, attendance_session_id: "attendance-session-2", student_id: "student-4", status: "excused", note: "Synthetic approved absence." },
    ],
    assessments: [
      { id: "assessment-1", institution_id, programme_id: "programme-ts4", module_id: "module-hardware", title: "Hardware troubleshooting formative", assessment_type: "formative", maximum_marks: 100, due_date: "2026-08-20", status: "published" },
      { id: "assessment-2", institution_id, programme_id: "programme-ts4", module_id: "module-network", title: "Network support practical", assessment_type: "practical", maximum_marks: 100, due_date: "2026-08-28", status: "published" },
      { id: "assessment-3", institution_id, programme_id: "programme-euc3", module_id: "module-word", title: "Word processing POE", assessment_type: "poe", maximum_marks: 100, due_date: "2026-08-25", status: "published" },
    ],
    assessment_results: [
      { id: "result-1", institution_id, assessment_id: "assessment-1", student_id: "student-1", outcome: "competent", score: 82, feedback: "Meets the synthetic demonstration criteria.", moderation_status: "upheld", assessed_at: "2026-08-13T10:00:00Z" },
      { id: "result-2", institution_id, assessment_id: "assessment-1", student_id: "student-2", outcome: "not_yet_competent", score: 48, feedback: "Remediation required on diagnostic sequencing.", moderation_status: "pending", assessed_at: "2026-08-13T10:15:00Z" },
      { id: "result-3", institution_id, assessment_id: "assessment-3", student_id: "student-3", outcome: "submitted", score: null, feedback: "Awaiting assessment.", moderation_status: "not_required", assessed_at: "2026-08-14T09:00:00Z" },
    ],
    evidence_documents: [
      { id: "evidence-1", institution_id, student_id: "student-1", assessment_id: "assessment-1", evidence_type: "poe", title: "Hardware diagnostic checklist — Demo", file_name: "demo-hardware-checklist.pdf", storage_path: "demo/evidence-1", content_type: "application/pdf", size_bytes: 182400, status: "verified", created_at: "2026-08-12T11:00:00Z" },
      { id: "evidence-2", institution_id, student_id: "student-2", assessment_id: "assessment-2", evidence_type: "workplace", title: "Workplace supervisor observation — Demo", file_name: "demo-supervisor-observation.pdf", storage_path: "demo/evidence-2", content_type: "application/pdf", size_bytes: 96000, status: "received", created_at: "2026-08-14T12:00:00Z" },
    ],
    moderation_records: [
      { id: "moderation-1", institution_id, assessment_result_id: "result-1", moderator_id: "profile-moderator", decision: "upheld", comments: "Synthetic sample selected and decision upheld.", moderated_at: "2026-08-14T14:00:00Z", created_at: "2026-08-14T14:00:00Z" },
    ],
    invoices: [
      { id: "invoice-1", institution_id, student_id: "student-1", invoice_number: "DEMO-INV-001", issue_date: "2026-07-01", due_date: "2026-07-31", description: "Synthetic tuition instalment", total_amount: 4500, balance: 1500, status: "part_paid" },
      { id: "invoice-2", institution_id, student_id: "student-2", invoice_number: "DEMO-INV-002", issue_date: "2026-08-01", due_date: "2026-08-31", description: "Synthetic tuition instalment", total_amount: 4500, balance: 4500, status: "issued" },
      { id: "invoice-3", institution_id, student_id: "student-3", invoice_number: "DEMO-INV-003", issue_date: "2026-07-01", due_date: "2026-07-31", description: "Synthetic tuition instalment", total_amount: 3500, balance: 0, status: "paid" },
    ],
    invoice_items: [],
    payments: [
      { id: "payment-1", institution_id, invoice_id: "invoice-1", student_id: "student-1", amount: 3000, payment_date: "2026-07-15", payment_method: "eft", reference_number: "DEMO-PAY-001", status: "confirmed" },
      { id: "payment-2", institution_id, invoice_id: "invoice-3", student_id: "student-3", amount: 3500, payment_date: "2026-07-20", payment_method: "bursary", reference_number: "DEMO-PAY-002", status: "confirmed" },
    ],
    funding_records: [
      { id: "funding-1", institution_id, student_id: "student-2", funding_type: "employer", provider_name: "Ubuntu Tech Services — Demo", reference_number: "DEMO-FUND-001", approved_amount: 9000, status: "approved" },
      { id: "funding-2", institution_id, student_id: "student-3", funding_type: "bursary", provider_name: "Sample Education Trust", reference_number: "DEMO-FUND-002", approved_amount: 7000, status: "pending" },
    ],
    announcements: [
      { id: "announcement-1", institution_id, title: "POE submission week", body: "All records and dates shown here are synthetic demonstration information.", audience: "all", status: "published", created_at: "2026-08-14T07:30:00Z" },
      { id: "announcement-2", institution_id, title: "Staff moderation meeting", body: "Demonstration meeting scheduled for Friday at 14:00 in Room 5.", audience: "staff", status: "published", created_at: "2026-08-13T15:00:00Z" },
      { id: "announcement-3", institution_id, title: "Student support reminder", body: "Synthetic students may book a demonstration support session through the help desk.", audience: "students", status: "published", created_at: "2026-08-12T12:00:00Z" },
    ],
    notifications: [
      { id: "notification-1", institution_id, profile_id: "profile-admin", title: "Two applications need review", body: "Open Admissions to demonstrate application status updates.", read_at: null, created_at: "2026-08-15T07:00:00Z" },
      { id: "notification-2", institution_id, profile_id: "profile-admin", title: "Moderation decision recorded", body: "The sample Technical Support outcome was upheld.", read_at: "2026-08-14T15:00:00Z", created_at: "2026-08-14T14:05:00Z" },
    ],
    support_tickets: [
      { id: "ticket-1", institution_id, ticket_number: "DEMO-TKT-001", subject: "Unable to open POE upload", description: "Synthetic browser upload issue.", category: "technical", priority: "high", status: "in_progress", created_by: "profile-student", created_at: "2026-08-14T08:00:00Z" },
      { id: "ticket-2", institution_id, ticket_number: "DEMO-TKT-002", subject: "Attendance correction", description: "Synthetic request to correct one attendance record.", category: "data", priority: "normal", status: "open", created_by: "profile-lecturer", created_at: "2026-08-14T10:00:00Z" },
    ],
    support_ticket_comments: [
      { id: "comment-1", institution_id, ticket_id: "ticket-1", body: "Demonstration support officer requested a screenshot.", created_by: "profile-admin", created_at: "2026-08-14T09:00:00Z" },
      { id: "comment-2", institution_id, ticket_id: "ticket-1", body: "Synthetic learner confirmed that the sample file is below 10 MB.", created_by: "profile-student", created_at: "2026-08-14T09:30:00Z" },
    ],
    privacy_requests: [
      { id: "privacy-1", institution_id, requester_reference: "DEMO-DSR-001", request_type: "correction", status: "reviewing", due_date: "2026-08-28", notes: "Synthetic request to correct a mobile number.", created_at: "2026-08-13T08:00:00Z" },
      { id: "privacy-2", institution_id, requester_reference: "DEMO-DSR-002", request_type: "access", status: "open", due_date: "2026-09-05", notes: "Synthetic access request.", created_at: "2026-08-14T08:00:00Z" },
    ],
    consent_records: [
      { id: "consent-1", institution_id, student_id: "student-1", data_subject_reference: "DEMO-TS-001", purpose: "Workplace supervisor contact", status: "granted", captured_at: "2026-06-25T08:00:00Z" },
    ],
    data_incidents: [
      { id: "incident-1", institution_id, reference_number: "DEMO-INC-001", severity: "low", description: "Synthetic test of the incident logging workflow; no information was exposed.", discovered_at: "2026-08-10T09:00:00Z", status: "resolved", created_at: "2026-08-10T09:05:00Z" },
    ],
    institution_invites: [
      { id: "invite-1", institution_id, email: "new.lecturer@example.invalid", role: "lecturer", code: "LECTURE26", expires_at: "2026-08-22T12:00:00Z", used_at: null, created_at: "2026-08-15T07:00:00Z" },
    ],
    subscriptions: [
      { id: "subscription-1", institution_id, plan_code: "prototype_free", status: "active", created_at: "2026-01-08T08:00:00Z" },
    ],
    audit_logs: [
      { id: "audit-1", institution_id, action: "update", entity_type: "assessment_results", entity_id: "result-1", actor_id: "profile-assessor", actor_email: "assessor@example.invalid", created_at: "2026-08-13T10:00:00Z" },
      { id: "audit-2", institution_id, action: "insert", entity_type: "moderation_records", entity_id: "moderation-1", actor_id: "profile-moderator", actor_email: "moderator@example.invalid", created_at: "2026-08-14T14:00:00Z" },
      { id: "audit-3", institution_id, action: "update", entity_type: "applications", entity_id: "app-3", actor_id: "profile-admin", actor_email: "nomsa.admin@example.invalid", created_at: "2026-08-14T15:00:00Z" },
    ],
    members: [
      { id: "membership-admin", institution_id, profile_id: "profile-admin", role: "college_admin", status: "active", profiles: { id: "profile-admin", full_name: "Nomsa Dlamini", email: "nomsa.admin@example.invalid" }, created_at: "2026-01-08T08:00:00Z" },
      { id: "membership-manager", institution_id, profile_id: "profile-manager", role: "academic_manager", status: "active", profiles: { id: "profile-manager", full_name: "Sipho Mthembu", email: "sipho.manager@example.invalid" }, created_at: "2026-01-08T08:10:00Z" },
      { id: "membership-lecturer", institution_id, profile_id: "profile-lecturer", role: "lecturer", status: "active", profiles: { id: "profile-lecturer", full_name: "Naledi Masilo", email: "naledi.lecturer@example.invalid" }, created_at: "2026-01-08T08:20:00Z" },
      { id: "membership-assessor", institution_id, profile_id: "profile-assessor", role: "assessor", status: "active", profiles: { id: "profile-assessor", full_name: "Mandla Ncube", email: "mandla.assessor@example.invalid" }, created_at: "2026-01-08T08:30:00Z" },
      { id: "membership-moderator", institution_id, profile_id: "profile-moderator", role: "moderator", status: "active", profiles: { id: "profile-moderator", full_name: "Palesa Motau", email: "palesa.moderator@example.invalid" }, created_at: "2026-01-08T08:40:00Z" },
      { id: "membership-finance", institution_id, profile_id: "profile-finance", role: "finance_officer", status: "active", profiles: { id: "profile-finance", full_name: "Bongani Zulu", email: "bongani.finance@example.invalid" }, created_at: "2026-01-08T08:50:00Z" },
      { id: "membership-student", institution_id, profile_id: "profile-student", role: "student", status: "active", profiles: { id: "profile-student", full_name: "Thabo Mokoena", email: "thabo.mokoena@example.invalid" }, created_at: "2026-01-08T09:00:00Z" },
      { id: "membership-supervisor", institution_id, profile_id: "profile-supervisor", role: "workplace_supervisor", status: "active", profiles: { id: "profile-supervisor", full_name: "Lindiwe Naidoo", email: "lindiwe.supervisor@example.invalid" }, created_at: "2026-06-20T08:00:00Z" },
    ],
  };
}
