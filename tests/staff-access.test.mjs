import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import ts from "typescript";

// Run the same TypeScript selectors that feed React on every supported Node version.
const build = mkdtempSync(join(tmpdir(), "edubonke-scope-"));
after(() => rmSync(build, { recursive: true, force: true }));
for (const name of ["platform", "demo-data", "staff-access", "evidence-file"]) {
  const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  writeFileSync(join(build, name + ".js"), outputText);
}
const require = createRequire(join(build, "test.cjs"));
const { createDemoWorkspace, demoMemberships } = require("./demo-data.js");
const { scopeStaffWorkspace } = require("./staff-access.js");

test("all six staff previews expose only their authorised financial and academic registers", () => {
  const data = createDemoWorkspace();
  for (const member of data.members.filter(row => !["student", "workplace_supervisor"].includes(row.role))) {
    const scoped = scopeStaffWorkspace(data, member.role, member);
    const finance = ["college_admin", "finance_officer"].includes(member.role);
    for (const key of ["invoices", "invoice_items", "payments", "funding_records"]) {
      assert.equal(key in scoped, finance, member.role + " " + key);
    }
    assert.equal("assessment_results" in scoped, member.role !== "finance_officer");
    assert.equal("institution_invites" in scoped, member.role === "college_admin");
    if (!finance) assert.doesNotMatch(JSON.stringify(scoped), /DEMO-INV-|DEMO-PAY-|DEMO-FUND-/);
  }
  assert.equal(data.invoices.length, 3, "role switches preserve the canonical fixture");
});

test("scoping also filters institutions, announcement audiences, tickets, comments and unknown tables", () => {
  const data = createDemoWorkspace();
  const member = data.members.find(row => row.role === "lecturer");
  data.students.push({ id: "other-college", institution_id: "elsewhere" });
  data.announcements.push({ institution_id: member.institution_id, title: "Finance only", audience: "finance" });
  data.unreleased = [{ id: "never-export", institution_id: member.institution_id }];
  const scoped = scopeStaffWorkspace(data, member.role, member);
  assert.doesNotMatch(JSON.stringify(scoped), /other-college|Finance only|never-export/);
  assert.deepEqual(scoped.support_tickets.map(row => row.id), ["ticket-2"]);
  assert.deepEqual(scoped.support_ticket_comments, []);
  assert.deepEqual(scoped.notifications, []);
  assert.equal(scopeStaffWorkspace(data, "college_admin", demoMemberships[0]).students.length, 5);
});

test("an empty CSV reports the filter before creating a download", () => {
  const { downloadCsv } = require("./platform.js");
  assert.throws(() => downloadCsv("sample.csv", []), { message: "No records match the current filter" });
});

test("evidence validation accepts exactly 10 MiB and rejects the very next byte", () => {
  const { readEvidenceFile } = require("./evidence-file.js");
  const form = new FormData();
  assert.equal(readEvidenceFile(form).error, "Choose a non-empty file");
  for (const bytes of [10 * 1024 * 1024, 10 * 1024 * 1024 + 1]) {
    form.set("file", new Blob([new Uint8Array(bytes)]), "synthetic.pdf");
    const result = readEvidenceFile(form);
    if (bytes === 10 * 1024 * 1024) assert.equal(result.file.size, bytes);
    else assert.equal(result.error, "File exceeds the 10MB limit");
  }
});
