// CI guard for assets/ (D-19): catches anything that bypassed the pre-commit hook.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { buildIndex } from "../lib/assets.js";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 3000;
const UNCONVERTED = new Set([".png", ".jpg", ".jpeg", ".heic", ".heif"]);
const RASTER = new Set([".webp", ".gif", ".avif"]);

export async function checkAssets(dir = "assets") {
  const errors = [];
  const names = fs.readdirSync(dir).filter((n) => !n.startsWith("."));

  try {
    buildIndex(names, dir);
  } catch (e) {
    errors.push(e.message);
  }

  for (const f of names) {
    const full = path.join(dir, f);
    const ext = path.extname(f).toLowerCase();
    if (!fs.statSync(full).isFile()) continue;
    if (UNCONVERTED.has(ext)) {
      errors.push(`assets/${f}: unconverted ${ext} (run npm run shrink)`);
    }
    // Size check runs before any decode.
    if (fs.statSync(full).size > MAX_BYTES) {
      errors.push(`assets/${f}: over 10 MB`);
      continue;
    }
    if (RASTER.has(ext)) {
      try {
        const meta = await sharp(full, { failOn: "none" }).metadata();
        const w = meta.width ?? 0;
        const h = meta.pageHeight ?? meta.height ?? 0;
        if (Math.max(w, h) > MAX_EDGE) {
          errors.push(`assets/${f}: ${w}x${h} exceeds ${MAX_EDGE}px`);
        }
      } catch (e) {
        errors.push(`assets/${f}: unreadable image (${e.message})`);
      }
    }
  }
  return errors;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  const errors = await checkAssets();
  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    console.error("Run `npm run shrink` locally, commit, and push again.");
    process.exit(1);
  }
  console.log(`check-assets: OK (${fs.readdirSync("assets").filter((n) => !n.startsWith(".")).length} files)`);
}
