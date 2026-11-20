import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const script = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const scope = "https://edubonke.github.io/EduBonke/";

function loadWorker(caches, fetch) {
  const handlers = {};
  const self = {
    registration: { scope },
    clients: { claim() {} },
    addEventListener(type, handler) { handlers[type] = handler; },
  };
  vm.runInNewContext(script, { self, caches, fetch, URL, Response });
  return handlers;
}

test("activation preserves sibling applications and the current shell cache", async () => {
  const deleted = [];
  const caches = {
    async keys() { return ["edubonke-shell-v3", "edubonke-shell-v4", "another-college", "edubonke-elsewhere"]; },
    async delete(name) { deleted.push(name); },
  };
  const worker = loadWorker(caches);
  await new Promise((resolve) => worker.activate({ waitUntil: resolve }));
  assert.deepEqual(deleted, ["edubonke-shell-v3"]);
});

test("an unavailable cache does not prevent online use or intercept a sibling project", async () => {
  const worker = loadWorker({ async open() { throw Error("Cache unavailable"); } }, () => new Response("Demo"));
  let handled = false;
  worker.fetch({ request: { url: "https://edubonke.github.io/Other/", method: "GET" }, respondWith() { handled = true; } });
  assert.equal(handled, false);
  const response = await new Promise((resolve) => worker.fetch({ request: { url: scope, method: "GET" }, respondWith: resolve }));
  assert.equal(await response.text(), "Demo");
});
