import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wf = yaml.load(fs.readFileSync(path.join(ROOT, ".github/workflows/deploy.yml"), "utf8"));
const on = wf.on ?? wf[true];

test("triggers are push to main and workflow_dispatch only", () => {
  assert.deepEqual(Object.keys(on).sort(), ["push", "workflow_dispatch"]);
  assert.deepEqual(on.push.branches, ["main"]);
});

test("permissions are exactly least-privilege", () => {
  assert.deepEqual(wf.permissions, { contents: "read", pages: "write", "id-token": "write" });
});

test("build steps run in order", () => {
  const steps = wf.jobs.build.steps;
  const ids = steps.map((s) => s.uses ?? s.run);
  const want = [
    "actions/checkout@v7",
    "actions/setup-node@v7",
    "npm ci",
    "npm run check:assets",
    "npm test",
    "actions/cache@v6",
    "npm run build",
    "npm run prune:img",
    "du -sh _site",
    "actions/upload-pages-artifact@v5",
  ];
  let at = -1;
  for (const w of want) {
    const i = ids.indexOf(w);
    assert.ok(i > at, `${w} missing or out of order`);
    at = i;
  }
  const node = steps.find((s) => s.uses === "actions/setup-node@v7");
  assert.equal(String(node.with["node-version"]), "22");
  assert.equal(node.with.cache, "npm");
  assert.equal(steps.find((s) => s.uses === "actions/cache@v6").with.path, "_site/img");
  assert.equal(steps.find((s) => s.uses === "actions/upload-pages-artifact@v5").with.path, "_site");
});

test("deploy job uses deploy-pages and needs build", () => {
  const d = wf.jobs.deploy;
  assert.ok([].concat(d.needs).includes("build"));
  assert.ok(d.steps.some((s) => s.uses === "actions/deploy-pages@v5"));
});

test("no pull_request_target or secrets", () => {
  const raw = fs.readFileSync(path.join(ROOT, ".github/workflows/deploy.yml"), "utf8");
  assert.ok(!/pull_request_target|secrets\./.test(raw));
});

test("pages concurrency group does not cancel in-progress deploys", () => {
  assert.equal(wf.concurrency.group, "pages");
  assert.equal(wf.concurrency["cancel-in-progress"], false);
});
