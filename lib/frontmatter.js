import fs from "node:fs";
import yaml from "js-yaml";

// Keep `date` a string so `date: 2019` and `date: 2019-03-05` are valid (D-07).
export function parseFrontMatter(str) {
  return yaml.load(str.replace(/^(date:[ \t]*)(\d{4}(?:-\d{2}){0,2})[ \t]*$/m, '$1"$2"')) ?? {};
}

export function readFrontMatter(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return m ? parseFrontMatter(m[1]) : {};
}
