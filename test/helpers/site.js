import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import siteData from "../../src/_data/site.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// The tag list fixture sites build against, so tests do not depend on the owner's src/_data/tags.js.
export const FIXTURE_TAGS = [
  { slug: "graphic", label: "Graphic design" },
  { slug: "ux", label: "UX" },
  { slug: "art", label: "Art" },
  { slug: "games", label: "Games" },
];

export function defaultPrefix() {
  const cfg = fs.readFileSync(path.join(ROOT, "eleventy.config.js"), "utf8");
  const m = cfg.match(/PATH_PREFIX \?\? "([^"]+)"/);
  if (!m) throw new Error("PATH_PREFIX default not found in eleventy.config.js");
  return m[1];
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function copyInto(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

async function makeAsset(spec) {
  if (Buffer.isBuffer(spec)) return spec;
  const { width, height, alpha = false, format, animated = false } = spec;
  if (format === "svg") {
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#08f"/></svg>`
    );
  }
  const background = alpha ? { r: 0, g: 128, b: 255, alpha: 0.5 } : { r: 0, g: 128, b: 255 };
  const channels = alpha ? 4 : 3;
  if (format === "gif" && animated) {
    const h = Math.max(1, Math.floor(height));
    const frame = (c) => Buffer.alloc(width * h * 3, c);
    const raw = Buffer.concat([frame(40), frame(200)]);
    return sharp(raw, { raw: { width, height: h * 2, channels: 3, pageHeight: h } })
      .gif({ loop: 0, delay: [100, 100] })
      .toBuffer();
  }
  let img = sharp({ create: { width, height, channels, background } });
  if (format === "webp") img = img.webp({ lossless: true });
  else if (format === "png") img = img.png();
  else if (format === "jpeg") img = img.jpeg();
  else if (format === "gif") img = img.gif();
  else throw new Error(`unknown fixture format ${format}`);
  return img.toBuffer();
}

// The child env: the caller's shell never leaks an ELEVENTY_RUN_MODE into a fixture build, but a test may pass
// one on purpose (to prove Eleventy overrides it).
function childEnv(env, prefix) {
  const e = { ...process.env };
  delete e.ELEVENTY_RUN_MODE;
  Object.assign(e, env);
  delete e.PATH_PREFIX;
  if (prefix !== undefined) e.PATH_PREFIX = prefix;
  if (env.PATH_PREFIX !== undefined) e.PATH_PREFIX = env.PATH_PREFIX;
  return e;
}

export async function makeSite({ files = {}, assets = {}, prefix, useRepoContent = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  copyInto(path.join(ROOT, "eleventy.config.js"), path.join(dir, "eleventy.config.js"));
  copyInto(path.join(ROOT, "package.json"), path.join(dir, "package.json"));
  fs.cpSync(path.join(ROOT, "lib"), path.join(dir, "lib"), { recursive: true });
  fs.cpSync(path.join(ROOT, "src"), path.join(dir, "src"), { recursive: true });
  // Nor the owner's tag list; a test can still supply its own src/_data/tags.js through `files`.
  if (!useRepoContent) {
    fs.writeFileSync(
      path.join(dir, "src", "_data", "tags.js"),
      `export default ${JSON.stringify(FIXTURE_TAGS, null, 2)};\n`
    );
  }
  // Fixture sites never inherit the owner's featured list; a test can still supply its own file.
  if (!useRepoContent) fs.writeFileSync(path.join(dir, "src", "_data", "featured.js"), "export default [];\n");
  fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");

  const contentRoot = path.join(ROOT, "content");
  for (const f of walk(contentRoot)) {
    const rel = path.relative(contentRoot, f);
    const base = rel.split(path.sep).join("/");
    const isBase =
      base.endsWith(".11tydata.js") ||
      ["style.css", "404.md", "index.md", "work.njk", "tags.njk", "lightbox.js", "sitemap.njk", "robots.njk"].includes(base);
    if (useRepoContent || isBase) copyInto(f, path.join(dir, "content", rel));
  }
  fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
  if (useRepoContent) {
    for (const f of walk(path.join(ROOT, "assets"))) {
      copyInto(f, path.join(dir, "assets", path.relative(path.join(ROOT, "assets"), f)));
    }
  }
  // Fixture sites get the default share image site.js names, so they keep building. A caller's own file of the
  // same name (in `assets`, written below) wins.
  if (!useRepoContent && typeof siteData.defaultImage === "string") {
    fs.writeFileSync(
      path.join(dir, "assets", siteData.defaultImage),
      await makeAsset({ width: 1200, height: 630, format: "webp" })
    );
  }
  for (const [rel, text] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
  }
  for (const [name, spec] of Object.entries(assets)) {
    fs.writeFileSync(path.join(dir, "assets", name), await makeAsset(spec));
  }

  return {
    dir,
    build(env = {}) {
      const r = spawnSync(path.join(dir, "node_modules/.bin/eleventy"), [], {
        cwd: dir,
        env: childEnv(env, prefix),
        encoding: "utf8",
      });
      return { code: r.status, stdout: r.stdout, stderr: r.stderr, output: `${r.stdout}\n${r.stderr}` };
    },
    // One build in Eleventy run mode `serve`, as `npm start` does, but without the server or watcher.
    buildServe(env = {}) {
      fs.writeFileSync(
        path.join(dir, "run-serve.mjs"),
        [
          'import Eleventy from "@11ty/eleventy";',
          'const elev = new Eleventy("content", "_site", { runMode: "serve" });',
          "await elev.write();",
          "",
        ].join("\n")
      );
      const r = spawnSync(process.execPath, ["run-serve.mjs"], {
        cwd: dir,
        env: childEnv(env, prefix),
        encoding: "utf8",
      });
      return { code: r.status, stdout: r.stdout, stderr: r.stderr, output: `${r.stdout}\n${r.stderr}` };
    },
    read: (rel) => fs.readFileSync(path.join(dir, rel), "utf8"),
    exists: (rel) => fs.existsSync(path.join(dir, rel)),
    walk: (rel) => walk(path.join(dir, rel)),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}
