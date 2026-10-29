import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pruneImages } from "../scripts/prune-img.js";

test("pruneImages removes only unreferenced derivatives", () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), "prune-"));
  fs.mkdirSync(path.join(site, "img"));
  for (const f of ["a-480.webp", "a-960.webp", "stale-480.webp"]) {
    fs.writeFileSync(path.join(site, "img", f), "x");
  }
  fs.mkdirSync(path.join(site, "p"));
  fs.writeFileSync(
    path.join(site, "p", "index.html"),
    `<picture><source srcset="/portfolio-test/img/a-480.webp 480w, /portfolio-test/img/a-960.webp 960w"></picture>`
  );
  const res = pruneImages(site);
  assert.deepEqual(res.removed, ["stale-480.webp"]);
  assert.equal(res.kept, 2);
  assert.deepEqual(fs.readdirSync(path.join(site, "img")).sort(), ["a-480.webp", "a-960.webp"]);
});

test("pruneImages skips when _site/img is missing", () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), "prune-"));
  assert.deepEqual(pruneImages(site), { kept: 0, removed: [] });
});
