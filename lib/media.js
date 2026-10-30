// Self-hosted media for `::: video <assets-file> "Title"` blocks (D-07).
// Only files a block names are published, under _site/video/. assets/ is never copied (IMG-03).
import fs from "node:fs";
import path from "node:path";
import { resolveAsset } from "./assets.js";

// Same four characters as escapeAttr in ./embeds.js (not imported: embeds.js imports this module).
const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const POSTER_WIDTH = 1600;

// Additive across builds so `npm start` incremental rebuilds keep earlier files.
const videos = new Map(); // output name -> absolute source path

export function renderFileVideo({ target, title, full }, ctx) {
  const abs = resolveAsset(target);
  if (!abs) ctx.fail(`video not found in assets/: ${target}`);
  const name = path.basename(abs);
  videos.set(name, abs);
  // Absolute /video/... only: HtmlBasePlugin adds the path prefix (relative URLs are not rewritten).
  const url = `/video/${encodeURIComponent(name)}`;
  const safeTitle = esc(title);
  return (
    `<div class="${full ? "embed full" : "embed"}">` +
    `<video controls="" preload="metadata" src="${url}#t=0.001" aria-label="${safeTitle}">` +
    `<p>Your browser cannot play this video. <a href="${url}">Download "${safeTitle}"</a></p>` +
    `</video></div>\n`
  );
}

export async function copyMedia(outputDir) {
  if (!videos.size) return;
  const dir = path.join(outputDir, "video");
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, source] of videos) {
    fs.copyFileSync(source, path.join(dir, name));
  }
}
