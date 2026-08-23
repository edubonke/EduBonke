import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

test("exports the public, demo, authentication, QR attendance, portal and privacy routes", async () => {
  for (const route of ["index.html", "demo/index.html", "demo/student/index.html", "demo/staff/index.html", "login/index.html", "attendance/check-in/index.html", "portal/index.html", "privacy/index.html"]) {
    const file = await stat(new URL(`../out/${route}`, import.meta.url));
    assert.ok(file.size > 500, `${route} should contain rendered HTML`);
  }
});

test("export is independent from ChatGPT Sites", async () => {
  const files = await Promise.all(["index.html", "demo/index.html", "login/index.html", "portal/index.html"].map((route) => readFile(new URL(`../out/${route}`, import.meta.url), "utf8")));
  const html = files.join("\n");
  assert.match(html, /EduBonke/);
  assert.doesNotMatch(html, /Sign in with ChatGPT|codex-preview|appgprj_/i);
});

test("demo routes separate student and staff experiences with synthetic records", async () => {
  const selector = await readFile(new URL("../out/demo/index.html", import.meta.url), "utf8");
  const student = await readFile(new URL("../out/demo/student/index.html", import.meta.url), "utf8");
  const staff = await readFile(new URL("../out/demo/staff/index.html", import.meta.url), "utf8");
  const fixture = await readFile(new URL("../lib/demo-data.ts", import.meta.url), "utf8");
  assert.match(selector, /Student demo/);
  assert.match(selector, /Staff and admin demo/);
  assert.match(selector, /Synthetic demonstration only/);
  assert.match(student, /Student demonstration/);
  assert.match(student, /Thabo Mokoena/);
  assert.match(staff, /Staff and administrator demonstration/);
  assert.match(staff, /Mhlabeni Skills College/);
  assert.match(staff, /College Admin/);
  assert.match(staff, /Finance Officer/);
  assert.match(fixture, /example\.invalid/);
  assert.match(fixture, /DEMO-/);
});

test("includes the installable web-app assets", async () => {
  await stat(new URL("../out/manifest.webmanifest", import.meta.url));
  await stat(new URL("../out/sw.js", import.meta.url));
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  if (process.env.GITHUB_ACTIONS === "true") {
    assert.match(html, /\/EduBonke\/manifest\.webmanifest/);
    assert.match(html, /\/EduBonke\/favicon\.svg/);
  }
});

test("uses the EduBonke brand identity and colour palette", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  const favicon = await readFile(new URL("../out/favicon.svg", import.meta.url), "utf8");
  assert.match(html, /brand-word-bonke/);
  assert.match(favicon, /#132a32/);
  assert.match(favicon, /#087f75/);
  assert.match(favicon, /#e8a33a/);
});

test("paired finance dates shrink within narrow cards", async () => {
  const css = await readFile(new URL("../app/portal/portal.css", import.meta.url), "utf8");
  assert.match(css, /\.form-pair > \* \{ min-width: 0; \}/);
  assert.match(css, /\.form-pair input, \.form-pair select \{ min-width: 0; \}/);
});
