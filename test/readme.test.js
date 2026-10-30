// Keeps README.md in step with the code (AUTH-05, D-22): every block name and front matter key the code
// accepts must be documented. The lists are read from the real modules, never copied here.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LAYOUT_SIZES, EMBEDS } from "../lib/blocks.js";
import { PROJECT_KEYS, PAGE_KEYS } from "../lib/validate.js";

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
