export const roles = [
  "college_admin",
  "academic_manager",
  "lecturer",
  "assessor",
  "moderator",
  "finance_officer",
  "student",
  "workplace_supervisor",
] as const;

export type InstitutionRole = typeof roles[number];

export type Membership = {
  id: string;
  institution_id: string;
  profile_id: string;
  role: InstitutionRole;
  status: "active" | "suspended";
  institutions: { id: string; name: string; registration_number: string | null; invite_code: string | null };
};

export type WorkspaceData = Record<string, Array<Record<string, unknown>>>;

export const navigation = [
  ["overview", "Overview"],
  ["admissions", "Admissions"],
  ["students", "Students"],
  ["academics", "Academic setup"],
  ["timetable", "Timetable"],
  ["attendance", "Attendance"],
  ["assessments", "Assessments"],
  ["evidence", "POE & moderation"],
  ["finance", "Finance"],
  ["communications", "Communications"],
  ["reports", "Reports"],
  ["support", "Support"],
  ["privacy", "POPIA desk"],
  ["administration", "Administration"],
] as const;

export const writeRoles = new Set<InstitutionRole>([
  "college_admin", "academic_manager", "lecturer", "assessor", "moderator", "finance_officer",
]);

export function money(value: unknown) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(value ?? 0));
}

export function formatDate(value: unknown) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(String(value)));
}

export function human(value: unknown) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) throw new Error("There are no records to export.");
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.map(escape).join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
