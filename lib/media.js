// Self-hosted media for `::: video <assets-file> "Title"` blocks (D-07) and PDF links.
// Only files a block names are published, under _site/video/; only PDFs a page links are published,
// as-is, under _site/pdf/ (D-17). assets/ is never copied (IMG-03).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Image from "@11ty/eleventy-img";
import { resolveAsset } from "./assets.js";
import { VIDEO_EXTS, VIDEO_MAX_BYTES, VIDEO_MAX_MB } from "./limits.js";

// Same four characters as escapeAttr in ./embeds.js (not imported: embeds.js imports this module).
const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const POSTER_WIDTH = 1600;

// Additive across builds so `npm start` incremental rebuilds keep earlier files.
const videos = new Map(); // output name -> absolute source path
const posters = new Map(); // output name -> absolute source path
const pdfs = new Map(); // output name -> absolute source path

export function registerPdf(abs) {
  pdfs.set(path.basename(abs), abs);
}

// 1024-based: whole KB under 1024 KB (minimum 1 KB), otherwise one-decimal MB.
export function formatPdfSize(bytes) {
  const kb = Math.max(1, Math.round(bytes / 1024));
  return kb < 1024 ? `${kb} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

const POSTER_EXTS = new Set([".webp", ".png", ".jpg", ".jpeg", ".avif", ".gif"]);

export function renderFileVideo({ target, title, full, poster }, ctx) {
  const abs = resolveAsset(target);
  if (!abs) ctx.fail(`video not found in assets/: ${target}`);
  const name = path.basename(abs);
  if (!VIDEO_EXTS.has(path.extname(name).toLowerCase())) {
    ctx.fail(`video ${name} must be .mp4 or .webm (export it in one of those formats).`);
  }
  const bytes = fs.statSync(abs).size;
  if (bytes > VIDEO_MAX_BYTES) {
    ctx.fail(`video ${name} is ${(bytes / 1048576).toFixed(1)} MB; the limit is ${VIDEO_MAX_MB} MB.`);
  }
  let posterAttr = "";
  if (poster) {
    const posterAbs = resolveAsset(poster);
    if (!posterAbs) ctx.fail(`poster not found in assets/: ${poster}`);
    const posterName = path.basename(posterAbs);
    if (!POSTER_EXTS.has(path.extname(posterName).toLowerCase())) {
      ctx.fail(`poster ${posterName} must be an image (.webp, .png, .jpg, .jpeg, .avif or .gif).`);
    }
    // Hash in the name: a changed poster gets a new URL, so `npm start` never serves a stale one.
    const hash = crypto.createHash("sha1").update(fs.readFileSync(posterAbs)).digest("hex").slice(0, 8);
    const outName = `${path.parse(posterName).name}-${hash}.webp`;
    posters.set(outName, posterAbs);
    posterAttr = ` poster="/video/${encodeURIComponent(outName)}"`;
  }
  videos.set(name, abs);
  // Absolute /video/... only: HtmlBasePlugin adds the path prefix (relative URLs are not rewritten).
  const url = `/video/${encodeURIComponent(name)}`;
  // No poster: the #t=0.001 fragment makes iOS Safari paint a first frame.
  // With a poster it must be left off: the fragment seeks on load and the browser then drops the poster for the video frame (G-02-4).
  const src = poster ? url : `${url}#t=0.001`;
  const safeTitle = esc(title);
  return (
    `<div class="${full ? "embed full" : "embed"}">` +
    `<video controls="" preload="metadata" src="${src}"${posterAttr} aria-label="${safeTitle}">` +
    `<p>Your browser cannot play this video. <a href="${url}">Download "${safeTitle}"</a></p>` +
    `</video></div>\n`
  );
}

export async function copyMedia(outputDir) {
  if (pdfs.size) {
    // Published as-is, never processed; only PDFs a page links are registered (D-17).
    const pdfDir = path.join(outputDir, "pdf");
    fs.mkdirSync(pdfDir, { recursive: true });
    for (const [name, source] of pdfs) fs.copyFileSync(source, path.join(pdfDir, name));
  }
  if (!videos.size && !posters.size) return;
  const dir = path.join(outputDir, "video");
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, source] of videos) {
    fs.copyFileSync(source, path.join(dir, name));
  }
  // Posters are processed derivatives, never copied originals (IMG-03).
  for (const [name, source] of posters) {
    await Image(source, {
      widths: [POSTER_WIDTH],
      formats: ["webp"],
      outputDir: dir,
      filenameFormat: () => name,
    });
  }
}
