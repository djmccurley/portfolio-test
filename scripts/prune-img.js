import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function walkHtml(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkHtml(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

export function pruneImages(siteDir = "_site") {
  const imgDir = path.join(siteDir, "img");
  if (!fs.existsSync(imgDir)) return { kept: 0, removed: [] };
  const referenced = new Set();
  for (const file of walkHtml(siteDir)) {
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/\/img\/([^"'\s,?#]+)/g)) {
      referenced.add(m[1]);
      try {
        referenced.add(decodeURIComponent(m[1]));
      } catch {
        // malformed percent sequence: keep the raw name only
      }
    }
  }
  let kept = 0;
  const removed = [];
  for (const e of fs.readdirSync(imgDir, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (referenced.has(e.name)) kept++;
    else {
      fs.rmSync(path.join(imgDir, e.name));
      removed.push(e.name);
    }
  }
  return { kept, removed: removed.sort() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!fs.existsSync("_site/img")) {
    console.log("prune-img: _site/img not found, skipping");
  } else {
    const { kept, removed } = pruneImages("_site");
    console.log(`prune-img: kept ${kept}, removed ${removed.length}`);
  }
}
