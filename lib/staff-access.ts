import { navigation, type InstitutionRole, type Membership, type WorkspaceData } from "./platform";

export type StaffRole = Exclude<InstitutionRole, "student" | "workplace_supervisor">;
type View = (typeof navigation)[number][0];

export const staffViews: Record<StaffRole, ReadonlySet<View>> = {
  college_admin: new Set(navigation.map(([key]) => key)),
  academic_manager: new Set(["overview", "admissions", "students", "academics", "timetable", "attendance", "assessments", "evidence", "communications", "reports", "support", "privacy", "administration"]),
  lecturer: new Set(["overview", "students", "timetable", "attendance", "assessments", "evidence", "communications", "reports", "support"]),
  assessor: new Set(["overview", "students", "assessments", "evidence", "reports", "support"]),
  moderator: new Set(["overview", "students", "assessments", "evidence", "reports", "support"]),
  finance_officer: new Set(["overview", "students", "finance", "communications", "reports", "support"]),
};

// Reports and overview use exactly the same projection as their source panels.
const panelTables: Partial<Record<View, string[]>> = {
  overview: ["announcements"],
  admissions: ["applications", "programmes"],
  students: ["students", "student_status_history", "enrolments", "workplace_placements", "programmes", "classes", "academic_periods"],
  academics: ["campuses", "modules", "programme_modules", "classes", "academic_periods", "programmes"],
  timetable: ["timetable_entries", "classes", "modules"],
  attendance: ["attendance_sessions", "attendance_records"],
  assessments: ["assessments", "assessment_results", "modules"],
  evidence: ["student_documents", "evidence_documents"],
  finance: ["invoices", "invoice_items", "payments", "funding_records"],
  communications: ["notifications"],
  support: ["support_tickets", "support_ticket_comments"],
  privacy: ["privacy_requests", "consent_records", "data_incidents"],
  administration: ["members", "subscriptions", "audit_logs"],
};

export function scopeStaffWorkspace(data: WorkspaceData, role: StaffRole, member: Membership): WorkspaceData {
  const tables = new Set<string>();
  for (const view of staffViews[role]) {
    for (const table of panelTables[view] ?? []) tables.add(table);
  }
  const managesCollege = role === "college_admin" || role === "academic_manager";
  if (role === "college_admin") tables.add("institution_invites");
  if (role === "finance_officer") tables.add("members");
  if (managesCollege || role === "assessor" || role === "moderator") tables.add("moderation_records");

  const scoped: WorkspaceData = {};
  for (const table of tables) {
    if (data[table]) scoped[table] = data[table].filter(row => row.institution_id === member.institution_id);
  }
  const audiences = new Set(["all", "staff"]);
  if (managesCollege) audiences.add("students");
  if (staffViews[role].has("finance")) audiences.add("finance");
  if (scoped.announcements) scoped.announcements = scoped.announcements.filter(row => audiences.has(String(row.audience)));
  if (scoped.notifications && role !== "college_admin") scoped.notifications = scoped.notifications.filter(row => row.profile_id === member.profile_id);
  if (!managesCollege && scoped.support_tickets) {
    scoped.support_tickets = scoped.support_tickets.filter(row => row.created_by === member.profile_id);
    const ticketIds = new Set(scoped.support_tickets.map(row => row.id));
    if (scoped.support_ticket_comments) scoped.support_ticket_comments = scoped.support_ticket_comments.filter(row => ticketIds.has(row.ticket_id));
  }
  if (scoped.audit_logs && role !== "college_admin") {
    scoped.audit_logs = scoped.audit_logs.filter(row => tables.has(row.entity_type === "institution_memberships" ? "members" : String(row.entity_type)));
  }
  return scoped;
}
