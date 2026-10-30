import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { checkAssets } from "../scripts/check-assets.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "assets-"));
const webp = (w, h) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 1, g: 2, b: 3 } } })
    .webp({ lossless: true })
    .toBuffer();
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

test("clean dir passes", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "a.webp"), await webp(3000, 100));
  fs.writeFileSync(path.join(d, "b.gif"), GIF);
  assert.deepEqual(await checkAssets(d), []);
});

test("png is flagged with guidance", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "a.png"), "x");
  const errs = await checkAssets(d);
  assert.ok(errs.length >= 1);
  assert.ok(errs.join("\n").includes("npm run shrink"));
});

test("over 3000px", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "a.webp"), await webp(3200, 100));
  const errs = await checkAssets(d);
  assert.ok(errs.some((e) => e.includes("3000")));
});

test("over 10 MB", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "big.gif"), crypto.randomBytes(11 * 1024 * 1024));
  const errs = await checkAssets(d);
  assert.ok(errs.some((e) => e.includes("10 MB")));
});

test("videos up to 50 MB pass the guard", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "a.mp4"), crypto.randomBytes(11 * 1024 * 1024));
  fs.writeFileSync(path.join(d, "b.webm"), crypto.randomBytes(11 * 1024 * 1024));
  assert.deepEqual(await checkAssets(d), []);
});

test("a video over 50 MB names the video limit", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "big.mp4"), Buffer.alloc(51 * 1024 * 1024));
  const errs = await checkAssets(d);
  assert.ok(errs.some((e) => e.includes("assets/big.mp4: over 50 MB")), errs.join("\n"));
  assert.ok(errs.every((e) => !e.includes("10 MB")), errs.join("\n"));
});

test("a GIF over 10 MB keeps the 10 MB message", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "big.gif"), crypto.randomBytes(11 * 1024 * 1024));
  const errs = await checkAssets(d);
  assert.ok(errs.some((e) => e.includes("assets/big.gif: over 10 MB")), errs.join("\n"));
});

test("GIF over 10 MB says shrink cannot fix it", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "big.gif"), crypto.randomBytes(11 * 1024 * 1024));
  const errs = await checkAssets(d);
  assert.ok(errs.some((e) => e.includes("reduce it by hand")));
});

test("CLI exits 1 on a bad dir", () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, "assets"));
  fs.writeFileSync(path.join(d, "assets", "a.png"), "x");
  fs.cpSync(path.join(ROOT, "scripts"), path.join(d, "scripts"), { recursive: true });
  fs.cpSync(path.join(ROOT, "lib"), path.join(d, "lib"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(d, "package.json"));
  fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(d, "node_modules"), "dir");
  const r = spawnSync("node", ["scripts/check-assets.js"], { cwd: d, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.ok((r.stdout + r.stderr).includes("npm run shrink"));
});

test("case-only duplicates", async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, "a.gif"), GIF);
  fs.writeFileSync(path.join(d, "A.gif"), GIF);
  if (fs.readdirSync(d).length === 2) {
    const errs = await checkAssets(d);
    assert.ok(errs.some((e) => e.includes("case-only")));
  }
});
