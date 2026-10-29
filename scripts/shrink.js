// Commit-time (--staged) and manual image shrink / convert / rename / link rewrite.
// See D-13..D-18. Uses execFileSync with argument arrays only (no shell strings).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const ASSETS = "assets";
const MAX_EDGE = 3000;
const GIF_WARN_BYTES = 5 * 1024 * 1024;
const CONVERT_EXTS = new Set([".png", ".jpg", ".jpeg", ".heic", ".heif"]);
const RASTER_RESIZE_EXTS = new Set([".webp"]);

export function slugifyName(fileName, outExt) {
  const { name, ext } = path.parse(fileName);
  let stem = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!stem) stem = "image";
  return stem + (outExt ?? ext.toLowerCase());
}

function actionFor(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return { action: "webp-lossless", outExt: ".webp" };
  if (ext === ".jpg" || ext === ".jpeg") return { action: "webp-lossy", outExt: ".webp" };
  if (ext === ".heic" || ext === ".heif") return { action: "heic", outExt: ".webp" };
  return { action: slugifyName(fileName) === fileName ? "none" : "rename", outExt: undefined };
}

export function planConversions(fileNames, existing) {
  const base = fileNames.map((from) => ({ from, ...actionFor(from) }));
  const reserved = new Set([...existing].map((n) => n.toLowerCase()));
  // Files that stay where they are keep their names reserved.
  for (const p of base) if (p.action === "none") reserved.add(p.from.toLowerCase());
  const out = [];
  for (const p of base) {
    if (p.action === "none") {
      out.push({ from: p.from, to: p.from, action: "none" });
      continue;
    }
    const candidate = slugifyName(p.from, p.outExt);
    const { name, ext } = path.parse(candidate);
    let to = candidate;
    let n = 0;
    while (reserved.has(to.toLowerCase())) {
      n += 1;
      to = `${name}-${n}${ext}`;
    }
    reserved.add(to.toLowerCase());
    out.push({ from: p.from, to, action: p.action });
  }
  return out;
}

function isBoundaryBefore(ch) {
  return ch === undefined || ch === "" || /[(/"'<\s]/.test(ch);
}
function isBoundaryAfter(ch) {
  return ch === undefined || ch === "" || /[)"'>?#\s]/.test(ch);
}

export function rewriteLinks(text, from, to) {
  const forms = [...new Set([encodeURI(from), encodeURIComponent(from), from])];
  let result = text;
  for (const form of forms) {
    let out = "";
    let i = 0;
    for (;;) {
      const at = result.indexOf(form, i);
      if (at === -1) {
        out += result.slice(i);
        break;
      }
      const before = at === 0 ? "" : result[at - 1];
      const after = result[at + form.length] ?? "";
      if (isBoundaryBefore(before) && isBoundaryAfter(after)) {
        out += result.slice(i, at) + to;
      } else {
        out += result.slice(i, at + form.length);
      }
      i = at + form.length;
    }
    result = out;
  }
  return result;
}

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28, ...opts });
}

function fail(msg) {
  console.error(`shrink: ${msg}`);
  process.exit(1);
}

async function metaOf(file) {
  try {
    return await sharp(file, { failOn: "none", animated: true }).metadata();
  } catch {
    return null;
  }
}

async function encode(inputPath, lossy, outPath) {
  // animated: true keeps every frame of animated WebP (WR-01).
  const pipeline = sharp(inputPath, { failOn: "none", animated: true })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
  // No withMetadata: sharp strips all metadata (EXIF/GPS) by default (D-16).
  const out = lossy ? pipeline.webp({ quality: 82 }) : pipeline.webp({ lossless: true });
  return out.toFile(outPath);
}

function heicToPng(from) {
  const sips = "/usr/bin/sips";
  if (!fs.existsSync(sips)) fail(`HEIC needs macOS sips; convert ${from} to PNG first`);
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "shrink-heic-")), "in.png");
  execFileSync(sips, ["-s", "format", "png", from, "--out", tmp], { stdio: "ignore" });
  return tmp;
}

async function convertOne(item, staged) {
  const fromPath = path.join(ASSETS, item.from);
  const toPath = path.join(ASSETS, item.to);
  let dims = "";
  if (item.action === "rename" || item.action === "none") {
    if (item.from !== item.to) fs.renameSync(fromPath, toPath);
    if (/\.gif$/i.test(item.from) && fs.statSync(toPath).size > GIF_WARN_BYTES) {
      console.warn(`shrink: warning: ${item.to} is over 5 MB; consider a smaller GIF`);
    }
  } else {
    const tmpOut = `${toPath}.tmp-${process.pid}`;
    let source = fromPath;
    try {
      if (item.action === "heic") source = heicToPng(fromPath);
      const info = await encode(source, item.action === "webp-lossy", tmpOut);
      dims = ` (${info.width}x${info.height})`;
      fs.renameSync(tmpOut, toPath);
    } catch (e) {
      fs.rmSync(tmpOut, { force: true });
      fail(`could not convert ${item.from}: ${e.message}`);
    }
    if (item.from !== item.to) fs.unlinkSync(fromPath);
  }
  if (staged) {
    if (item.from !== item.to) {
      git(["rm", "--cached", "--quiet", "--ignore-unmatch", "--", `${ASSETS}/${item.from}`]);
    }
    git(["add", "--", `${ASSETS}/${item.to}`]);
  }
  console.log(`shrink: ${item.from} -> ${item.to}${dims}`);
}

function walkMd(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(p));
    else if (e.name.endsWith(".md")) out.push(p.split(path.sep).join("/"));
  }
  return out;
}

function rewriteAll(text, changes) {
  let t = text;
  for (const c of changes) t = rewriteLinks(t, c.from, c.to);
  return t;
}

function rewriteMarkdown(changes, staged) {
  const indexed = git(["ls-files", "-z", "--", "content"])
    .split("\0")
    .filter((p) => p.endsWith(".md"));
  const all = new Set([...indexed, ...walkMd("content")]);
  const inIndex = new Set(indexed);
  for (const md of all) {
    if (staged && inIndex.has(md)) {
      // Rewrite only the index blob so unstaged hunks never enter the commit (Pitfall 6).
      const staged_text = git(["show", `:${md}`]);
      const next = rewriteAll(staged_text, changes);
      if (next !== staged_text) {
        const mode = git(["ls-files", "-s", "--", md]).split(/\s+/)[0] || "100644";
        const sha = git(["hash-object", "-w", "--stdin"], { input: next }).trim();
        git(["update-index", "--cacheinfo", `${mode},${sha},${md}`]);
      }
    }
    if (fs.existsSync(md)) {
      const wt = fs.readFileSync(md, "utf8");
      const next = rewriteAll(wt, changes);
      if (next !== wt) fs.writeFileSync(md, next);
    }
  }
}

async function candidates(staged) {
  if (staged) {
    return git(["diff", "--cached", "--name-only", "--no-renames", "--diff-filter=AM", "-z", "--", ASSETS])
      .split("\0")
      .filter(Boolean)
      .filter((p) => path.posix.dirname(p) === ASSETS)
      .map((p) => path.posix.basename(p))
      .filter((n) => !n.startsWith(".") && fs.existsSync(path.join(ASSETS, n)));
  }
  if (!fs.existsSync(ASSETS)) return [];
  return fs
    .readdirSync(ASSETS, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name);
}

export async function main(argv = process.argv.slice(2)) {
  const staged = argv.includes("--staged");
  const names = await candidates(staged);
  if (names.length === 0) return;

  const onDisk = fs.existsSync(ASSETS) ? fs.readdirSync(ASSETS) : [];
  const batch = new Set(names);
  const existing = new Set(onDisk.filter((n) => !batch.has(n)));
  let plan = planConversions(names, existing);

  // Oversize WebP: re-encode in place (needs pixel dimensions, so not in the pure planner).
  for (const item of plan) {
    const ext = path.extname(item.from).toLowerCase();
    if (item.action !== "none" && item.action !== "rename") continue;
    if (!RASTER_RESIZE_EXTS.has(ext)) continue;
    const meta = await metaOf(path.join(ASSETS, item.from));
    if (meta && Math.max(meta.width ?? 0, meta.pageHeight ?? meta.height ?? 0) > MAX_EDGE) {
      item.action = "webp-lossless";
    }
  }

  if (!staged) {
    // Manual mode only touches files that need work.
    plan = plan.filter((p) => p.action !== "none");
  }
  const work = plan.filter((p) => p.action !== "none");
  if (work.length === 0) return;

  for (const item of work) await convertOne(item, staged);

  const changes = work.filter((p) => p.from !== p.to);
  if (changes.length > 0) rewriteMarkdown(changes, staged);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  main().catch((e) => fail(e.message));
}
