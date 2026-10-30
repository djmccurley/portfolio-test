// CI guard for assets/ (D-19): catches anything that bypassed the pre-commit hook.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { buildIndex } from "../lib/assets.js";
import { VIDEO_EXTS, VIDEO_MAX_BYTES, VIDEO_MAX_MB, PDF_EXTS, PDF_MAX_BYTES, PDF_MAX_MB } from "../lib/limits.js";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 3000;
const UNCONVERTED = new Set([".png", ".jpg", ".jpeg", ".heic", ".heif"]);
const RASTER = new Set([".webp", ".gif", ".avif"]);
// shrink cannot resize or recompress these, so the fix has to be manual (WR-02).
const MANUAL = new Set([".gif", ".avif"]);
const manualHint = (ext) => (MANUAL.has(ext) ? ` (shrink cannot fix ${ext}; reduce it by hand)` : "");

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
    // Size check runs before any decode. Videos and PDFs get their own caps and are never decoded.
    const size = fs.statSync(full).size;
    if (VIDEO_EXTS.has(ext)) {
      if (size > VIDEO_MAX_BYTES) {
        errors.push(`assets/${f}: over ${VIDEO_MAX_MB} MB (video limit; compress it or host it on YouTube/Vimeo)`);
      }
      continue;
    }
    if (PDF_EXTS.has(ext)) {
      if (size > PDF_MAX_BYTES) {
        errors.push(`assets/${f}: over ${PDF_MAX_MB} MB (PDF limit; compress it or split it)`);
      }
      continue;
    }
    if (size > MAX_BYTES) {
      errors.push(`assets/${f}: over 10 MB${manualHint(ext)}`);
      continue;
    }
    if (RASTER.has(ext)) {
      try {
        const meta = await sharp(full, { failOn: "none" }).metadata();
        const w = meta.width ?? 0;
        const h = meta.pageHeight ?? meta.height ?? 0;
        if (Math.max(w, h) > MAX_EDGE) {
          errors.push(`assets/${f}: ${w}x${h} exceeds ${MAX_EDGE}px${manualHint(ext)}`);
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
    console.error(
      "Run `npm run shrink` locally for PNG/JPEG/HEIC/WebP; GIF and AVIF must be reduced by hand; " +
        `compress videos below ${VIDEO_MAX_MB} MB and PDFs below ${PDF_MAX_MB} MB. Then commit and push again.`
    );
    process.exit(1);
  }
  console.log(`check-assets: OK (${fs.readdirSync("assets").filter((n) => !n.startsWith(".")).length} files)`);
}
