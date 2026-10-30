import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { slugifyName, planConversions, rewriteLinks } from "../scripts/shrink.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shrink-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.name", "T");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "commit.gpgsign", "false");
  fs.cpSync(path.join(ROOT, "scripts"), path.join(dir, "scripts"), { recursive: true });
  fs.cpSync(path.join(ROOT, "lib"), path.join(dir, "lib"), { recursive: true });
  fs.cpSync(path.join(ROOT, ".githooks"), path.join(dir, ".githooks"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(dir, "package.json"));
  fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");
  fs.writeFileSync(path.join(dir, ".gitignore"), "node_modules\n");
  fs.mkdirSync(path.join(dir, "assets"));
  fs.mkdirSync(path.join(dir, "content/projects"), { recursive: true });
  git(dir, "config", "core.hooksPath", ".githooks");
  return dir;
}

const png = (w, h) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 10, g: 120, b: 200 } } }).png().toBuffer();

const commit = (dir) => spawnSync("git", ["commit", "-m", "t"], { cwd: dir, encoding: "utf8" });

test("slugifyName", () => {
  assert.equal(
    slugifyName("Screenshot 2026-10-28 at 10.15.32.png", ".webp"),
    "screenshot-2026-10-28-at-10-15-32.webp"
  );
  assert.equal(slugifyName("Another One.PNG", ".webp"), "another-one.webp");
  assert.equal(slugifyName("Loop Anim.GIF"), "loop-anim.gif");
  assert.equal(slugifyName("スクリーンショット.png", ".webp"), "image.webp");
  assert.equal(slugifyName("!!!.png", ".webp"), "image.webp");
});

test("planConversions suffixes collisions", () => {
  const plan = planConversions(["スクリーンショット.png"], new Set(["image.webp"]));
  assert.equal(plan[0].to, "image-1.webp");
  const two = planConversions(["A B.png", "a-b.jpg"], new Set());
  assert.deepEqual(
    two.map((p) => p.to),
    ["a-b.webp", "a-b-1.webp"]
  );
});

test("rewriteLinks", () => {
  const t = "![x](../../assets/Screenshot%202026.png) and Screenshot 2026.png";
  const out = rewriteLinks(t, "Screenshot 2026.png", "screenshot-2026.webp");
  assert.ok(out.includes("../../assets/screenshot-2026.webp)"));
  assert.ok(out.includes("and screenshot-2026.webp"));
  const keep = "![](../../assets/tidepool-game-image.png)";
  assert.equal(rewriteLinks(keep, "image.png", "x.webp"), keep);
});

test("hook e2e", async () => {
  const dir = makeRepo();
  const name = "Screenshot 2026-10-28 at 10.15.32.png";
  fs.writeFileSync(path.join(dir, "assets", name), await png(4000, 2500));
  fs.writeFileSync(
    path.join(dir, "content/projects/p.md"),
    "![x](../../assets/Screenshot%202026-10-28%20at%2010.15.32.png)\n"
  );
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const tree = git(dir, "ls-tree", "-r", "HEAD", "--name-only");
  assert.ok(tree.includes("assets/screenshot-2026-10-28-at-10-15-32.webp"));
  assert.ok(!/\.png/i.test(tree));
  assert.ok(git(dir, "show", "HEAD:content/projects/p.md").includes("screenshot-2026-10-28-at-10-15-32.webp"));
  const buf = execFileSync("git", ["show", "HEAD:assets/screenshot-2026-10-28-at-10-15-32.webp"], {
    cwd: dir,
    maxBuffer: 1 << 28,
  });
  const meta = await sharp(buf).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(Math.max(meta.width, meta.height), 3000);
  assert.ok(!fs.existsSync(path.join(dir, "assets", name)));
});

test("JPEG lossy and no upscale", async () => {
  const dir = makeRepo();
  const jpg = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 200, g: 20, b: 20 } } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  fs.writeFileSync(path.join(dir, "assets", "Photo One.JPG"), jpg);
  fs.writeFileSync(path.join(dir, "content/projects/p.md"), "![x](../../assets/Photo%20One.JPG)\n");
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const buf = execFileSync("git", ["show", "HEAD:assets/photo-one.webp"], { cwd: dir, maxBuffer: 1 << 28 });
  const meta = await sharp(buf).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 600);
  assert.equal(meta.height, 800);
  assert.ok(!meta.exif);
  assert.ok(!meta.orientation || meta.orientation === 1);
});

test("GIF/SVG passthrough", () => {
  const dir = makeRepo();
  const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>');
  fs.writeFileSync(path.join(dir, "assets", "Loop Anim.gif"), gif);
  fs.writeFileSync(path.join(dir, "assets", "My Logo.svg"), svg);
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
  const g = execFileSync("git", ["show", "HEAD:assets/loop-anim.gif"], { cwd: dir });
  const s = execFileSync("git", ["show", "HEAD:assets/my-logo.svg"], { cwd: dir });
  assert.equal(sha(g), sha(gif));
  assert.equal(sha(s), sha(svg));
});

test("incremental after convert", async () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "assets", "tidepool-game-image.png"), await png(100, 100));
  fs.writeFileSync(path.join(dir, "content/projects/p.md"), "![a](../../assets/tidepool-game-image.png)\n");
  git(dir, "add", "-A");
  assert.equal(commit(dir).status, 0);
  const first = git(dir, "rev-parse", "HEAD:assets/tidepool-game-image.webp");
  fs.writeFileSync(path.join(dir, "assets", "tidepool-game-image.png"), await png(120, 90));
  fs.appendFileSync(path.join(dir, "content/projects/p.md"), "![b](../../assets/tidepool-game-image.png)\n");
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(git(dir, "rev-parse", "HEAD:assets/tidepool-game-image.webp"), first);
  assert.ok(git(dir, "ls-tree", "-r", "HEAD", "--name-only").includes("assets/tidepool-game-image-1.webp"));
  const md = git(dir, "show", "HEAD:content/projects/p.md");
  assert.ok(md.includes("![a](../../assets/tidepool-game-image.webp)"));
  assert.ok(md.includes("![b](../../assets/tidepool-game-image-1.webp)"));
});

test("no sweeping", async () => {
  const dir = makeRepo();
  const mdPath = path.join(dir, "content/projects/p.md");
  fs.writeFileSync(mdPath, "intro\n\n\n\n\n\n\n\n\n\nend\n");
  git(dir, "add", "-A");
  assert.equal(commit(dir).status, 0);
  fs.writeFileSync(mdPath, "intro\n\n\n\n\n\n\n\n\n\nend\n![x](../../assets/Big Shot.png)\n");
  fs.writeFileSync(path.join(dir, "assets", "Big Shot.png"), await png(200, 100));
  git(dir, "add", "-A");
  fs.writeFileSync(mdPath, "UNSTAGED EDIT\n\n\n\n\n\n\n\n\n\nend\n![x](../../assets/Big Shot.png)\n");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const head = git(dir, "show", "HEAD:content/projects/p.md");
  assert.ok(head.includes("big-shot.webp"));
  assert.ok(!head.includes("UNSTAGED EDIT"));
  const wt = fs.readFileSync(mdPath, "utf8");
  assert.ok(wt.includes("big-shot.webp"));
  assert.ok(wt.includes("UNSTAGED EDIT"));
});

test("manual mode", async () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "assets", "Wide Pic.png"), await png(3500, 500));
  fs.writeFileSync(path.join(dir, "content/projects/p.md"), "![x](../../assets/Wide%20Pic.png)\n");
  const r = spawnSync("node", ["scripts/shrink.js"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fs.existsSync(path.join(dir, "assets", "wide-pic.webp")));
  assert.ok(fs.readFileSync(path.join(dir, "content/projects/p.md"), "utf8").includes("wide-pic.webp"));
  assert.equal(git(dir, "diff", "--cached", "--name-only").trim(), "");
});

test("manual mode re-encodes a WebP over 10 MB that is within the pixel cap (WR-04)", async () => {
  const dir = makeRepo();
  const noise = crypto.randomBytes(2400 * 2400 * 3);
  const big = path.join(dir, "assets", "noise.webp");
  await sharp(noise, { raw: { width: 2400, height: 2400, channels: 3 } }).webp({ lossless: true }).toFile(big);
  assert.ok(fs.statSync(big).size > 10 * 1024 * 1024, "fixture must start over 10 MB");
  const r = spawnSync("node", ["scripts/shrink.js"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fs.statSync(big).size <= 10 * 1024 * 1024, "WebP should be under 10 MB after shrink");
});

test("hook processes renamed PNG assets (no rename detection skip)", async () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "assets", "old-name.png"), await png(100, 100));
  git(dir, "add", "-A");
  const first = spawnSync("git", ["commit", "--no-verify", "-m", "seed"], { cwd: dir, encoding: "utf8" });
  assert.equal(first.status, 0, first.stdout + first.stderr);
  git(dir, "mv", "assets/old-name.png", "assets/New Name.png");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const tree = git(dir, "ls-tree", "-r", "HEAD", "--name-only");
  assert.ok(tree.includes("assets/new-name.webp"), tree);
  assert.ok(!/\.png/i.test(tree), tree);
});

test("oversize animated WebP keeps all frames", async () => {
  const dir = makeRepo();
  const frame = (c) =>
    sharp({ create: { width: 3200, height: 40, channels: 3, background: c } }).png().toBuffer();
  const anim = await sharp(
    [await frame({ r: 255, g: 0, b: 0 }), await frame({ r: 0, g: 255, b: 0 }), await frame({ r: 0, g: 0, b: 255 })],
    { join: { animated: true } }
  )
    .webp({ delay: [100, 100, 100], loop: 0 })
    .toBuffer();
  fs.writeFileSync(path.join(dir, "assets", "wide-anim.webp"), anim);
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const buf = execFileSync("git", ["show", "HEAD:assets/wide-anim.webp"], { cwd: dir, maxBuffer: 1 << 28 });
  const meta = await sharp(buf).metadata();
  assert.equal(meta.width, 3000);
  assert.equal(meta.pages, 3);
});

test("hook rejects GIF over 10 MB with a manual-fix message", () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "assets", "huge.gif"), crypto.randomBytes(11 * 1024 * 1024));
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.notEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /reduce by hand/);
});

test("hook renames a video to its slug without re-encoding it and rewrites the link", () => {
  const dir = makeRepo();
  const bytes = crypto.randomBytes(2048);
  fs.writeFileSync(path.join(dir, "assets", "Crab-Walk.mp4"), bytes);
  fs.writeFileSync(path.join(dir, "content/projects/p.md"), '::: video ../../assets/Crab-Walk.mp4 "Crab"\n:::\n');
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const tree = git(dir, "ls-tree", "-r", "HEAD", "--name-only").split("\n");
  assert.ok(tree.includes("assets/crab-walk.mp4"), tree.join("\n"));
  assert.ok(!tree.includes("assets/Crab-Walk.mp4"), tree.join("\n"));
  const committed = execFileSync("git", ["show", "HEAD:assets/crab-walk.mp4"], { cwd: dir, maxBuffer: 1 << 28 });
  const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
  assert.equal(sha(committed), sha(bytes));
  assert.ok(git(dir, "show", "HEAD:content/projects/p.md").includes("../../assets/crab-walk.mp4"));
});

test("hook rejects a video over 50 MB before the commit lands", () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "assets", "huge.mp4"), Buffer.alloc(51 * 1024 * 1024));
  git(dir, "add", "-A");
  const r = commit(dir);
  assert.notEqual(r.status, 0);
  const out = r.stdout + r.stderr;
  assert.match(out, /over 50 MB/);
  assert.match(out, /never re-encoded/);
  const head = spawnSync("git", ["rev-parse", "--verify", "HEAD"], { cwd: dir, encoding: "utf8" });
  assert.notEqual(head.status, 0, "nothing should be committed");
});
