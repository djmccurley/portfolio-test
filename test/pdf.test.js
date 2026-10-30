import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { installBlocks } from "../lib/blocks.js";
import { installAssetResolver } from "../lib/markdown.js";
import { refreshAssets } from "../lib/assets.js";
import { formatPdfSize } from "../lib/media.js";
import { PDF_MAX_BYTES } from "../lib/limits.js";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(1015, 0x41)]); // 1024 bytes -> 1 KB
const OTHER_PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(50, 0x42)]);

const projectFront = `---
title: Thing
date: "2024-01-01"
tags: [games]
cover: ../../assets/a.webp
cover_alt: Cover
---
`;
const cover = { width: 1200, height: 800, format: "webp" };

// ---------------------------------------------------------------------------
// formatPdfSize (1024-based; UI-SPEC size format)
// ---------------------------------------------------------------------------

test("formatPdfSize: whole KB under 1024 KB with a minimum of 1 KB, otherwise one-decimal MB", () => {
  const cases = [
    [1, "1 KB"],
    [1024, "1 KB"],
    [1536, "2 KB"],
    [348160, "340 KB"],
    [1048063, "1023 KB"],
    [1048064, "1.0 MB"],
    [1048576, "1.0 MB"],
    [1258291, "1.2 MB"],
    [26214400, "25.0 MB"],
  ];
  for (const [bytes, label] of cases) assert.equal(formatPdfSize(bytes), label, String(bytes));
});

// ---------------------------------------------------------------------------
// Unit renders
// ---------------------------------------------------------------------------

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-"));
const tmpAssets = path.join(tmp, "assets");
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

let ready;
async function setupAssets() {
  if (ready) return ready;
  ready = (async () => {
    fs.mkdirSync(tmpAssets, { recursive: true });
    fs.writeFileSync(path.join(tmpAssets, "syllabus.pdf"), PDF);
    await refreshAssets(tmpAssets);
  })();
  return ready;
}

let n = 0;
async function render(body) {
  await setupAssets();
  const file = path.join(tmp, `case-${n++}.md`);
  fs.writeFileSync(file, body);
  const md = new MarkdownIt({ html: true });
  installBlocks(md);
  installAssetResolver(md);
  return { file, html: () => md.render(body, { page: { inputPath: file } }) };
}

const out = async (body) => (await render(body)).html();

test("unit: a PDF link gets the type and size suffix inside the link", async () => {
  assert.equal(
    await out("[Syllabus](../../assets/syllabus.pdf)\n"),
    '<p><a href="/pdf/syllabus.pdf">Syllabus (PDF, 1 KB)</a></p>\n'
  );
});

test("unit: emphasis in the label stays inside the link with the suffix after it", async () => {
  const html = await out("[**Bold** syllabus](../../assets/syllabus.pdf)\n");
  assert.ok(html.includes("<strong>Bold</strong> syllabus (PDF, 1 KB)</a>"), html);
});

test("unit: #page and ?v suffixes are kept; upper-case .PDF resolves the same file", async () => {
  assert.ok((await out("[S](../../assets/syllabus.pdf#page=2)\n")).includes('href="/pdf/syllabus.pdf#page=2"'));
  assert.ok((await out("[S](../../assets/syllabus.pdf?v=2)\n")).includes('href="/pdf/syllabus.pdf?v=2"'));
  assert.ok((await out("[S](../../assets/SYLLABUS.PDF)\n")).includes('href="/pdf/syllabus.pdf"'));
});

test("unit: remote links, other schemes, raw HTML and non-PDF links are untouched", async () => {
  for (const body of [
    "[a](https://example.com/a.pdf)\n",
    "[a](//example.com/a.pdf)\n",
    "[a](mailto:a@example.com)\n",
    "[a](../other/)\n",
  ]) {
    const html = await out(body);
    assert.doesNotMatch(html, / \(PDF,/, body);
  }
  assert.ok((await out("[a](https://example.com/a.pdf)\n")).includes('href="https://example.com/a.pdf"'));
  assert.ok((await out("[a](//example.com/a.pdf)\n")).includes('href="//example.com/a.pdf"'));
  assert.ok((await out("[a](../other/)\n")).includes('href="../other/"'));
  const raw = await out('<a href="../../assets/syllabus.pdf">x</a>\n');
  assert.ok(raw.includes('<a href="../../assets/syllabus.pdf">x</a>'), raw);
  assert.doesNotMatch(raw, / \(PDF,/);
  const inline = await out('See <a href="../../assets/syllabus.pdf">x</a> here\n');
  assert.ok(inline.includes('<a href="../../assets/syllabus.pdf">x</a>'), inline);
  assert.doesNotMatch(inline, / \(PDF,/);
});

test("unit: a rendered PDF link has no target and no download attribute", async () => {
  const html = await out("[S](../../assets/syllabus.pdf)\n\n[T](../../assets/syllabus.pdf#page=3)\n");
  assert.doesNotMatch(html, /target=/);
  assert.doesNotMatch(html, /download/);
});

test("unit: a missing PDF on the second line of a paragraph names that line", async () => {
  const { html } = await render("First line\n[Gone](../../assets/missing.pdf)\n");
  assert.throws(html, (err) => {
    assert.match(err.message, /:2: PDF not found in assets\/: \.\.\/\.\.\/assets\/missing\.pdf$/);
    return true;
  });
});

test("unit: a PDF link inside a table cell renders the suffix; a missing one still names the file", async () => {
  const table = (href) => `| A | B |\n|---|---|\n| x | [S](${href}) |\n`;
  const html = await out(table("../../assets/syllabus.pdf"));
  assert.ok(html.includes('<a href="/pdf/syllabus.pdf">S (PDF, 1 KB)</a>'), html);
  const { file, html: render2 } = await render(table("../../assets/missing.pdf"));
  assert.throws(render2, (err) => {
    assert.ok(err.message.startsWith(`${file}:`), err.message);
    assert.match(err.message, /PDF not found in assets\//);
    return true;
  });
});

test("unit: a long label keeps the suffix inside the same link text", async () => {
  const label = "A very long course title that goes on and on ".repeat(5).trim();
  const html = await out(`[${label}](../../assets/syllabus.pdf)\n`);
  assert.ok(html.includes(`${label} (PDF, 1 KB)</a>`), html);
});

// ---------------------------------------------------------------------------
// Full builds
// ---------------------------------------------------------------------------

const teaching = (links) => `---\ntitle: Teaching\n---\n\nIntro.\n\n${links}\n`;

test("full build: a linked PDF is published byte-identical under the default prefix; unlinked ones are not", async () => {
  const prefix = defaultPrefix();
  const site = await makeSite({
    files: { "content/pages/teaching.md": teaching("[Syllabus](../../assets/syllabus.pdf)") },
    assets: { "syllabus.pdf": PDF, "unlinked.pdf": OTHER_PDF },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/teaching/index.html");
  assert.ok(html.includes(`<a href="${prefix}pdf/syllabus.pdf">Syllabus (PDF, 1 KB)</a>`), html);
  assert.deepEqual(fs.readFileSync(`${site.dir}/_site/pdf/syllabus.pdf`), PDF);
  assert.equal(site.exists("_site/pdf/unlinked.pdf"), false);
  for (const f of site.walk("_site")) assert.notEqual(path.basename(f), "unlinked.pdf", f);
  assert.equal(site.exists("_site/assets"), false, "_site/assets must never exist");
});

test("full build: PATH_PREFIX=/ gives a root-absolute href", async () => {
  const site = await makeSite({
    prefix: "/",
    files: { "content/pages/teaching.md": teaching("[Syllabus](../../assets/syllabus.pdf)") },
    assets: { "syllabus.pdf": PDF },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  assert.ok(site.read("_site/teaching/index.html").includes('<a href="/pdf/syllabus.pdf">Syllabus (PDF, 1 KB)</a>'));
});

test("full build: a project page linking a PDF publishes it too", async () => {
  const site = await makeSite({
    files: { "content/projects/thing.md": `${projectFront}\nRead the [brief](../../assets/syllabus.pdf).\n` },
    assets: { "a.webp": cover, "syllabus.pdf": PDF },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  assert.ok(site.read("_site/thing/index.html").includes("brief (PDF, 1 KB)</a>"));
  assert.ok(site.exists("_site/pdf/syllabus.pdf"));
});

test("full build: a missing PDF fails naming the authored line, front matter included", async () => {
  const text = teaching("[Gone](../../assets/missing.pdf)");
  const line = text.split("\n").findIndex((l) => l.includes("missing.pdf")) + 1;
  const site = await makeSite({
    files: { "content/pages/teaching.md": text },
    assets: { "syllabus.pdf": PDF },
  });
  sites.push(site);
  const r = site.build();
  assert.notEqual(r.code, 0);
  assert.ok(
    r.output.includes(`content/pages/teaching.md:${line}: PDF not found in assets/: ../../assets/missing.pdf`),
    r.output
  );
});

test("full build: a PDF of exactly the cap passes; a 26 MiB PDF fails with its size", async () => {
  const ok = await makeSite({
    files: { "content/pages/teaching.md": teaching("[Big](../../assets/big.pdf)") },
    assets: { "big.pdf": Buffer.alloc(PDF_MAX_BYTES, 0x41) },
  });
  sites.push(ok);
  const r1 = ok.build();
  assert.equal(r1.code, 0, r1.output);
  assert.ok(ok.read("_site/teaching/index.html").includes("Big (PDF, 25.0 MB)</a>"));

  const bad = await makeSite({
    files: { "content/pages/teaching.md": teaching("[Big](../../assets/big.pdf)") },
    assets: { "big.pdf": Buffer.alloc(26 * 1024 * 1024, 0x41) },
  });
  sites.push(bad);
  const r2 = bad.build();
  assert.notEqual(r2.code, 0);
  assert.ok(r2.output.includes("PDF big.pdf is 26.0 MB; the limit is 25 MB."), r2.output);
});

// ---------------------------------------------------------------------------
// Starter pages: /cv/ and /teaching/
// ---------------------------------------------------------------------------

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("repo build: /teaching/ renders a course heading and the sample syllabus link; the PDF is published", async () => {
  const prefix = defaultPrefix();
  const asset = fs.readFileSync(path.join(ROOT, "assets/teaching-sample-syllabus.pdf"));
  const site = await makeSite({ useRepoContent: true });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/teaching/index.html");
  assert.ok(html.includes("<title>Teaching</title>"), html);
  assert.ok(html.includes("<h1>Teaching</h1>"), html);
  assert.match(html, /<h2[ >]/);
  assert.ok(
    html.includes(`<a href="${prefix}pdf/teaching-sample-syllabus.pdf">Syllabus (PDF, ${formatPdfSize(asset.length)})</a>`),
    html
  );
  assert.deepEqual(fs.readFileSync(`${site.dir}/_site/pdf/teaching-sample-syllabus.pdf`), asset);
});

test("repo build: /cv/ renders through the base layout", async () => {
  const site = await makeSite({ useRepoContent: true });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/cv/index.html");
  assert.ok(html.includes("<title>CV</title>"), html);
  assert.ok(html.includes("<h1>CV</h1>"), html);
});

test("fixture: a standalone page never joins the projects on the homepage", async () => {
  const site = await makeSite({
    files: {
      "content/projects/thing.md": `${projectFront}\nBody.\n`,
      "content/pages/teaching.md": teaching("[Syllabus](../../assets/syllabus.pdf)"),
    },
    assets: { "a.webp": cover, "syllabus.pdf": PDF },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const main = site.read("_site/index.html").match(/<main[\s\S]*?<\/main>/)[0];
  assert.doesNotMatch(main, /href="[^"]*teaching\/"/);
  assert.match(main, /thing\//);
});

for (const slug of ["cv", "teaching"]) {
  test(`fixture: a project with slug: ${slug} collides with the ${slug} page`, async () => {
    const site = await makeSite({
      files: {
        [`content/pages/${slug}.md`]: `---\ntitle: ${slug}\n---\n\nText.\n`,
        "content/projects/thing.md": projectFront.replace("tags:", `slug: ${slug}\ntags:`) + "\nBody.\n",
      },
      assets: { "a.webp": cover },
    });
    sites.push(site);
    const r = site.build();
    assert.notEqual(r.code, 0);
    assert.ok(r.output.includes(`slug "${slug}" already used by`), r.output);
  });
}
