import fs from "node:fs";
import yaml from "js-yaml";

// Keep `date` a string so `date: 2019` and `date: 2019-03-05` are valid (D-07).
export function parseFrontMatter(str) {
  return yaml.load(str.replace(/^(date:[ \t]*)(\d{4}(?:-\d{2}){0,2})[ \t]*$/m, '$1"$2"')) ?? {};
}

// True for YYYY, YYYY-MM or YYYY-MM-DD with a real calendar month and day (so 2024-13-45 fails).
export function validDate(s) {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(String(s));
  if (!m) return false;
  const [, y, mo = "01", d = "01"] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d));
  return dt.getUTCFullYear() === +y && dt.getUTCMonth() === +mo - 1 && dt.getUTCDate() === +d;
}

export function readFrontMatter(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return m ? parseFrontMatter(m[1]) : {};
}
