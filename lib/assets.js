import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

let index = new Map();
let currentDir = "assets";

export function buildIndex(fileNames, dir) {
  const map = new Map();
  const names = new Map();
  for (const name of fileNames) {
    const key = name.toLowerCase();
    if (map.has(key)) {
      throw new Error(`assets/: case-only duplicate filenames: ${names.get(key)} and ${name}`);
    }
    names.set(key, name);
    map.set(key, path.resolve(dir, name));
  }
  return map;
}

const visible = (names) => names.filter((n) => !n.startsWith("."));

const alphaSet = new Set();
const alphaCache = new Map(); // basename -> { size, mtimeMs, alpha }
const RASTER = /\.(webp|png|jpe?g|avif)$/i;

export async function refreshAssets(dir = "assets") {
  currentDir = dir;
  index = buildIndex(visible(await fsp.readdir(dir)), dir);
  alphaSet.clear();
  for (const [key, file] of index) {
    if (!RASTER.test(key)) continue;
    const st = await fsp.stat(file);
    let hit = alphaCache.get(key);
    if (!hit || hit.size !== st.size || hit.mtimeMs !== st.mtimeMs) {
      const meta = await sharp(file).metadata();
      // An alpha channel that is fully opaque (e.g. macOS screenshots) needs no PNG fallback.
      let alpha = Boolean(meta.hasAlpha);
      if (alpha) alpha = !(await sharp(file).stats()).isOpaque;
      hit = { size: st.size, mtimeMs: st.mtimeMs, alpha };
      alphaCache.set(key, hit);
    }
    if (hit.alpha) alphaSet.add(key);
  }
}

// True when the image has an alpha channel, or is a raster file not yet inspected
// (found by the sync re-scan during --serve): the safe PNG fallback is used.
export function hasAlpha(basenameLower) {
  if (alphaSet.has(basenameLower)) return true;
  return RASTER.test(basenameLower) && index.has(basenameLower) && !alphaCache.has(basenameLower);
}

function refreshSync() {
  try {
    index = buildIndex(visible(fs.readdirSync(currentDir)), currentDir);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

export function getIndex() {
  return index;
}

export function resolveAsset(nameOrLink) {
  let base = path.basename(nameOrLink);
  try {
    base = decodeURIComponent(base);
  } catch {
    // keep undecoded
  }
  const key = base.toLowerCase();
  if (index.has(key)) return index.get(key);
  refreshSync(); // Pitfall 7: file pasted during --serve
  return index.get(key) ?? null;
}
