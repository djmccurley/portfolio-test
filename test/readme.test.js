// Keeps README.md in step with the code (AUTH-05, D-22): every block name and front matter key the code
// accepts must be documented. The lists are read from the real modules, never copied here.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { LAYOUT_SIZES, EMBEDS } from "../lib/blocks.js";
import { PROJECT_KEYS, PAGE_KEYS } from "../lib/validate.js";
import { makeSite } from "./helpers/site.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const README_PATH = path.join(ROOT, "README.md");
const INTERNAL_KEYS = new Set(["layout", "permalink", "eleventyExcludeFromCollections"]);

const readme = () => fs.readFileSync(README_PATH, "utf8");

// The README text from the line `### <title>` up to the next line starting with `#`.
function section(title) {
  const lines = readme().split("\n");
  const start = lines.findIndex((l) => l.trim() === `### ${title}`);
  assert.notEqual(start, -1, `README.md has no "### ${title}" heading`);
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("#")) break;
    out.push(lines[i]);
  }
  return out.join("\n");
}

test("README exists and the lists it is checked against are not empty", () => {
  assert.ok(fs.existsSync(README_PATH), "README.md is missing");
  assert.ok(Object.keys(LAYOUT_SIZES).length > 0, "LAYOUT_SIZES is empty");
  assert.ok(EMBEDS.size > 0, "EMBEDS is empty");
  assert.ok(PROJECT_KEYS.length > 0, "PROJECT_KEYS is empty");
  assert.ok(PAGE_KEYS.length > 0, "PAGE_KEYS is empty");
});

test("every block name the renderer accepts is documented as `::: <name>`", () => {
  const text = readme();
  const names = [...Object.keys(LAYOUT_SIZES), ...EMBEDS.keys()];
  for (const name of names) {
    assert.ok(text.includes(`::: ${name}`), `README.md does not document "::: ${name}"`);
  }
});

test("the `full` keyword on embeds is documented apart from the `::: full` layout block", () => {
  const text = readme();
  assert.ok(text.includes("::: video full"), 'README.md does not document "::: video full"');
  assert.ok(text.includes("::: itch full"), 'README.md does not document "::: itch full"');
});

test("every project front matter key is documented in the Project front matter section", () => {
  const body = section("Project front matter");
  for (const key of PROJECT_KEYS.filter((k) => !INTERNAL_KEYS.has(k))) {
    assert.ok(body.includes(`\`${key}\``), `"### Project front matter" does not mention \`${key}\``);
  }
});

test("every page front matter key is documented in the Page front matter section", () => {
  const body = section("Page front matter");
  for (const key of PAGE_KEYS.filter((k) => !INTERNAL_KEYS.has(k))) {
    assert.ok(body.includes(`\`${key}\``), `"### Page front matter" does not mention \`${key}\``);
  }
});

test("the quick reference comes before the day-to-day workflow", () => {
  const text = readme();
  const quick = text.indexOf("## Quick reference");
  const workflow = text.indexOf("## Day-to-day workflow");
  assert.notEqual(quick, -1, 'README.md has no "## Quick reference" heading');
  assert.notEqual(workflow, -1, 'README.md has no "## Day-to-day workflow" heading');
  assert.ok(quick < workflow, '"## Quick reference" must come before "## Day-to-day workflow"');
});

test("the ## headings appear in the documented order", () => {
  const headings = readme()
    .split("\n")
    .filter((l) => /^## /.test(l))
    .map((l) => l.slice(3).trim());
  const wanted = ["Quick reference", "Day-to-day workflow", "Drafts", "Site settings", "When the build fails"];
  const positions = wanted.map((w) => headings.indexOf(w));
  positions.forEach((p, i) => assert.notEqual(p, -1, `README.md has no "## ${wanted[i]}" heading`));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), `headings out of order: ${headings.join(" | ")}`);
});

test("the README has no machine-setup section", () => {
  assert.doesNotMatch(readme(), /^#{1,6}\s+(Setup|Installation)\b/im);
});

test("the README covers the workflow commands, site settings and common errors", () => {
  const text = readme();
  const wanted = [
    // commands
    "npm start", "npm run shrink", "npm run build", "git push",
    // settings
    "src/_data/site.js", "PATH_PREFIX", "defaultImage", "defaultImageAlt", "--accent", "src/_data/featured.js", "src/_data/tags.js",
    // error and warning fragments
    "image not found in assets/", "cover not found in assets/", "unknown tag", "unknown front matter key", "unknown block",
    "is never closed", "already used by", "is reserved", "must be YYYY, YYYY-MM or YYYY-MM-DD",
    '"draft" must be true or false', "does not match any project", "src/_data/site.js:", "the limit is", "over 10 MB",
    "exceeds 3000px",
  ];
  for (const w of wanted) assert.ok(text.includes(w), `README.md does not mention ${JSON.stringify(w)}`);
});

// Contents of every fenced block whose info string is exactly `lang`.
function fences(lang) {
  const out = [];
  const lines = readme().split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "```" + lang) continue;
    const body = [];
    for (i++; i < lines.length && lines[i].trim() !== "```"; i++) body.push(lines[i]);
    out.push(body.join("\n"));
  }
  return out;
}

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

test("every md example in the README builds as one project", async () => {
  const blocks = fences("md");
  assert.ok(blocks.length > 0, "README.md has no md examples");
  const body = blocks.join("\n\n");
  const assets = { "readme-cover.webp": { width: 640, height: 480, format: "webp" } };
  for (const m of body.matchAll(/assets\/([A-Za-z0-9._-]+)/g)) {
    const name = m[1];
    const ext = path.extname(name).toLowerCase();
    if ([".webp", ".png", ".gif"].includes(ext)) assets[name] = { width: 640, height: 480, format: ext.slice(1) };
    else if ([".jpg", ".jpeg"].includes(ext)) assets[name] = { width: 640, height: 480, format: "jpeg" };
    else if (ext === ".pdf") assets[name] = Buffer.from("%PDF-1.4\n");
    else if (ext === ".mp4" || ext === ".webm") assets[name] = Buffer.from("x");
    else assert.fail(`README md example uses an asset type the test cannot fake: ${name}`);
  }
  const front = [
    "---",
    "title: Readme examples",
    'date: "2024"',
    "tags: [games]",
    "cover: ../../assets/readme-cover.webp",
    "cover_alt: Cover",
    "---",
    "",
  ].join("\n");
  const site = await makeSite({ files: { "content/projects/readme-examples.md": front + body + "\n" }, assets });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  assert.doesNotMatch(r.output, /unknown block/);
  assert.doesNotMatch(r.output, /not found in assets\//);
});

test("every yaml example in the README uses only known front matter keys", () => {
  const blocks = fences("yaml");
  assert.ok(blocks.length > 0, "README.md has no yaml examples");
  const known = new Set([...PROJECT_KEYS, ...PAGE_KEYS]);
  for (const block of blocks) {
    const text = block.split("\n").filter((l) => l.trim() !== "---").join("\n");
    const data = yaml.load(text);
    assert.ok(data && typeof data === "object", `yaml example did not parse to a mapping:\n${block}`);
    for (const key of Object.keys(data)) assert.ok(known.has(key), `yaml example uses unknown key "${key}"`);
  }
});
