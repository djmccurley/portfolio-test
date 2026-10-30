import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { installBlocks, EMBEDS } from "../lib/blocks.js";
import { makeSite } from "./helpers/site.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "block-errors-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

let n = 0;
function render(body) {
  const file = path.join(tmp, `case-${n++}.md`);
  fs.writeFileSync(file, body);
  const md = new MarkdownIt();
  installBlocks(md);
  return { file, html: () => md.render(body, { page: { inputPath: file } }) };
}

// Asserts the render throws exactly `${file}:${line}: ${message}`.
function fails(body, line, message) {
  const { file, html } = render(body);
  assert.throws(html, (err) => {
    assert.equal(err.message, `${file}:${line}: ${message}`);
    return true;
  });
}

const ONLY_IMAGES = "may only contain images. Move the text outside the block or use raw HTML.";
const unknown = (name) => `unknown block "::: ${name}". Valid blocks: grid-2, grid-3, grid-4, full, video, itch.`;

test("unknown block names fail with the valid list", () => {
  fails("Intro.\n\n::: grid-5\n![a](x.webp)\n:::\n", 3, unknown("grid-5"));
  fails("::: ful\n![a](x.webp)\n:::\n", 1, unknown("ful"));
});

test("block names are case-sensitive", () => {
  fails("::: Grid-3\n![a](x.webp)\n:::\n", 1, unknown("Grid-3"));
});

test("an unclosed block fails at the opening fence", () => {
  fails(
    "Intro.\n\n::: grid-2\n![a](x.webp)\n",
    3,
    'block "::: grid-2" is never closed. Add ":::" on its own line after the content.'
  );
});

test("text inside a block fails at the text line", () => {
  fails("::: grid-3\n![a](x.webp)\n\nSome text\n\n![b](y.webp)\n:::\n", 4, `block "::: grid-3" ${ONLY_IMAGES}`);
});

test("words after an image on the same line fail", () => {
  fails("::: grid-2\n![a](x.webp) and more words\n:::\n", 2, `block "::: grid-2" ${ONLY_IMAGES}`);
});

test("words on a later line of an image paragraph report that line", () => {
  fails("::: grid-2\n![a](x.webp)\n![b](y.webp)\nstray words\n:::\n", 4, `block "::: grid-2" ${ONLY_IMAGES}`);
});

test("lists, headings, raw HTML and linked images inside a block fail", () => {
  fails("::: full\n![a](x.webp)\n\n- item\n:::\n", 4, `block "::: full" ${ONLY_IMAGES}`);
  fails("::: grid-2\n![a](x.webp)\n\n## Heading\n:::\n", 4, `block "::: grid-2" ${ONLY_IMAGES}`);
  fails("::: grid-2\n![a](x.webp)\n\n<div>raw</div>\n:::\n", 4, `block "::: grid-2" ${ONLY_IMAGES}`);
  fails("::: grid-2\n[![a](x.webp)](https://example.com)\n:::\n", 2, `block "::: grid-2" ${ONLY_IMAGES}`);
});

test("a block with no images fails at the opening fence", () => {
  fails('Intro.\n\n::: grid-2\n:::\n', 3, 'block "::: grid-2" has no images.');
  fails("::: full\n:::\n", 1, 'block "::: full" has no images.');
});

test("a stray closing fence fails", () => {
  fails("Text.\n\n:::\n", 3, '":::" has no block to close. Remove it.');
  fails("::: grid-2\n![a](x.webp)\n:::\n\n:::\n", 5, '":::" has no block to close. Remove it.');
});

test("blocks cannot be nested", () => {
  fails(
    "::: full\n![a](x.webp)\n::: grid-2\n![b](y.webp)\n:::\n:::\n",
    3,
    'blocks cannot be nested: "::: grid-2" is inside "::: full". Close the first block with ":::" before opening the next.'
  );
});

test("a fence inside a list or quote fails", () => {
  const msg = 'block "::: grid-2" cannot go inside a list or quote. Start the fence at the beginning of a line.';
  fails("- item\n  ::: grid-2\n  ![a](x.webp)\n  :::\n", 2, msg);
  fails("> ::: grid-2\n> ![a](x.webp)\n> :::\n", 1, msg);
});

test("a fence inside a fenced code block is just code", () => {
  const { html } = render("```\n::: grid-2\n:::\n```\n");
  const out = html();
  assert.match(out, /<pre><code>/);
  assert.match(out, /::: grid-2/);
});

test("a block with exactly one image renders one figure", () => {
  const { html } = render("::: grid-2\n![a](x.webp)\n:::\n");
  const out = html();
  assert.match(out, /<div class="layout grid-2">/);
  assert.equal(out.match(/<figure>/g).length, 1);
});

test("registered embed handlers receive args and context and own the block markup", () => {
  const calls = [];
  EMBEDS.set("demo", (args, ctx) => {
    calls.push({ args, line: ctx.line, file: ctx.file });
    return '<div class="embed">demo</div>\n';
  });
  try {
    const { file, html } = render('Intro.\n\n::: demo some "Title"\n:::\n\nAfter.\n');
    const out = html();
    assert.deepEqual(calls, [{ args: 'some "Title"', line: 3, file }]);
    assert.match(out, /<div class="embed">demo<\/div>/);
    assert.doesNotMatch(out, /<\/div>\s*<\/div>/);
    fails("::: nope\n:::\n", 1, 'unknown block "::: nope". Valid blocks: grid-2, grid-3, grid-4, full, video, itch, demo.');
  } finally {
    EMBEDS.delete("demo");
  }
});

// ---------------------------------------------------------------------------
// Full builds: what the owner actually sees from Eleventy
// ---------------------------------------------------------------------------

const frontLines = [
  "---",
  "title: E",
  'date: "2024-01-01"',
  "tags: [games]",
  "cover: ../../assets/a.webp",
  "cover_alt: Cover",
  "---",
];
const bodyWith = (fence) => [...frontLines, "", "Some text.", "", fence, "![A](../../assets/a.webp)", ":::", ""];
const A = { "a.webp": { width: 1200, height: 800, format: "webp" } };

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

async function buildFails(text) {
  const site = await makeSite({ files: { "content/projects/e.md": text }, assets: A });
  sites.push(site);
  const r = site.build();
  assert.notEqual(r.code, 0, "build should fail");
  return r.output;
}

test("an unknown block fails the build naming file and file line", async () => {
  const out = await buildFails(bodyWith("::: grid-5").join("\n"));
  assert.ok(out.includes('./content/projects/e.md:11: unknown block "::: grid-5"'), out);
});

test("a CRLF file reports the same line", async () => {
  const out = await buildFails(bodyWith("::: grid-5").join("\r\n"));
  assert.ok(out.includes('e.md:11: unknown block "::: grid-5"'), out);
});

test("a missing image in a block names the file and line", async () => {
  const lines = bodyWith("::: grid-2");
  lines[11] = "![A](../../assets/nope.webp)";
  const out = await buildFails(lines.join("\n"));
  assert.ok(out.includes("e.md:12: image not found in assets/: ../../assets/nope.webp"), out);
});

test("a missing image on the second line of a paste reports that line", async () => {
  const lines = bodyWith("::: grid-2");
  lines.splice(12, 0, "![B](../../assets/nope.webp)");
  const out = await buildFails(lines.join("\n"));
  assert.ok(out.includes("e.md:13: image not found in assets/: ../../assets/nope.webp"), out);
});
