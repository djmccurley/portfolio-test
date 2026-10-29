import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

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

export async function refreshAssets(dir = "assets") {
  currentDir = dir;
  index = buildIndex(visible(await fsp.readdir(dir)), dir);
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
