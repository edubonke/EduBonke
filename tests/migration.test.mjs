import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/202608150001_edubonke_full.sql", import.meta.url), "utf8");

test("migration covers the functional data model", () => {
  for (const table of [
    "institutions", "institution_memberships", "applications", "students", "workplace_placements",
    "programmes", "classes", "attendance_records", "assessment_results", "evidence_documents",
    "moderation_records", "invoices", "payments", "announcements", "privacy_requests", "audit_logs",
  ]) assert.match(migration, new RegExp(`create table public\\.${table}\\b`, "i"), `${table} table is required`);
});

test("migration enables tenant and private-file security", () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /enforce_tenant_reference/i);
  assert.match(migration, /enforce_tenant_member_reference/i);
  assert.match(migration, /can_read_learning_record/i);
  assert.match(migration, /college_documents_read/i);
  assert.match(migration, /public\s*=\s*false/i);
});

test("prototype seed is clearly synthetic", () => {
  assert.match(migration, /TEST-001/);
  assert.match(migration, /example\.invalid/);
  assert.doesNotMatch(migration, /service_role|secret[_-]?key/i);
});
