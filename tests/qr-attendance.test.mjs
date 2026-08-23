import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("QR attendance requires an authenticated linked and enrolled student", async () => {
  const migration = await readFile(new URL("../supabase/migrations/202608210002_qr_attendance.sql", import.meta.url), "utf8");
  assert.match(migration, /auth\.uid\(\) is null/);
  assert.match(migration, /auth_user_id = auth\.uid\(\)/);
  assert.match(migration, /membership\.role = 'student'/);
  assert.match(migration, /enrolment\.class_id = selected_session\.class_id/);
  assert.match(migration, /enrolment\.status = 'active'/);
  assert.match(migration, /on conflict \(attendance_session_id, student_id\) do nothing/);
});

test("QR tokens are short-lived, hashed and unavailable to anonymous callers", async () => {
  const migration = await readFile(new URL("../supabase/migrations/202608210002_qr_attendance.sql", import.meta.url), "utf8");
  assert.match(migration, /digest\(raw_token, 'sha256'\)/);
  assert.match(migration, /p_valid_minutes < 1 or p_valid_minutes > 10/);
  assert.match(migration, /check_in_expires_at >= clock_timestamp\(\)/);
  assert.match(migration, /revoke all on function public\.check_in_attendance\(text\) from public, anon/);
  assert.doesNotMatch(migration, /service_role/i);
});

test("staff and student interfaces include the protected QR workflow", async () => {
  const component = await readFile(new URL("../app/portal/attendance-qr.tsx", import.meta.url), "utf8");
  const checkInPage = await readFile(new URL("../app/attendance/check-in/page.tsx", import.meta.url), "utf8");
  assert.match(component, /Display attendance QR/);
  assert.match(component, /You must already be signed in/);
  assert.match(component, /supabase\.auth\.getUser\(\)/);
  assert.match(component, /BrowserQRCodeReader/);
  assert.match(checkInPage, /No attendance was recorded/);
});
