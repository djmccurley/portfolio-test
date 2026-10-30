import test, { after } from "node:test";
import assert from "node:assert/strict";
import { makeSite } from "./helpers/site.js";
import { showDrafts } from "../lib/drafts.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

// Fixture D: one live project, one draft project (with its own tag, image, video, poster and PDF)
// and one draft page. Later tests extend it.
const proj = ({ title, date, tags, cover, extra = "", body = "Body." }) =>
  `---\ntitle: ${title}\ndate: "${date}"\ntags: [${tags}]\ncover: ../../assets/${cover}\ncover_alt: Cover of ${title}\n${extra}---\n\n${body}\n`;

const SECRET_BODY = [
  "![Secret detail](../../assets/secret.webp)",
  "",
  '::: video ../../assets/secret.mp4 "Secret trailer" poster=../../assets/secret-poster.webp',
  ":::",
  "",
  "[Secret notes](../../assets/secret.pdf)",
].join("\n");

const secretMd = (draft = true) =>
  proj({ title: "Secret", date: "2025", tags: "art", cover: "secret.webp", extra: draft ? "draft: true\n" : "", body: SECRET_BODY });
const notesMd = (draft = true) => `---\ntitle: Notes\n${draft ? "draft: true\n" : ""}---\n\nNotes body.\n`;
const pubMd = (extra = "") => proj({ title: "Pub", date: "2024", tags: "games", cover: "a.webp", extra });

const D_FILES = () => ({
  "content/projects/pub.md": pubMd(),
  "content/projects/secret.md": secretMd(),
  "content/pages/notes.md": notesMd(),
});

const D_ASSETS = () => ({
  "a.webp": { width: 1200, height: 800, format: "webp" },
  "secret.webp": { width: 300, height: 200, format: "webp" },
  "secret-poster.webp": { width: 400, height: 300, format: "webp" },
  "secret.mp4": Buffer.from("x"),
  "secret.pdf": Buffer.from("%PDF-1.4\n"),
});

async function site(files = D_FILES(), assets = D_ASSETS()) {
  const s = await makeSite({ files, assets });
  sites.push(s);
  return s;
}

const htmlFiles = (s) => s.walk("_site").filter((f) => f.endsWith(".html"));
const names = (s, rel) => s.walk(rel).map((f) => f.split("/").pop());

test("showDrafts is true only for Eleventy's serve and watch run modes", () => {
  const was = process.env.ELEVENTY_RUN_MODE;
  try {
    delete process.env.ELEVENTY_RUN_MODE;
    assert.equal(showDrafts(), false, "unset");
    for (const v of ["build", "", "SERVE", "true"]) {
      process.env.ELEVENTY_RUN_MODE = v;
      assert.equal(showDrafts(), false, JSON.stringify(v));
    }
    for (const v of ["serve", "watch"]) {
      process.env.ELEVENTY_RUN_MODE = v;
      assert.equal(showDrafts(), true, v);
    }
  } finally {
    if (was === undefined) delete process.env.ELEVENTY_RUN_MODE;
    else process.env.ELEVENTY_RUN_MODE = was;
  }
});

test("live build leaves out a draft page, card, tag page and every file only it uses", async () => {
  const s = await site();
  const r = s.build();
  assert.equal(r.code, 0, r.output);
  assert.ok(s.exists("_site/pub/index.html"));
  assert.ok(s.exists("_site/tags/games/index.html"));
  for (const gone of ["_site/secret", "_site/notes", "_site/tags/art", "_site/video/secret.mp4", "_site/pdf/secret.pdf"]) {
    assert.ok(!s.exists(gone), `${gone} must not exist in the live build`);
  }
  for (const f of htmlFiles(s)) {
    const html = s.read(f.slice(s.dir.length + 1));
    for (const needle of ["secret/", "notes/", "tags/art/"]) {
      assert.ok(!html.includes(needle), `${f} must not mention ${needle}`);
    }
  }
  assert.ok(!names(s, "_site/video").some((n) => n.startsWith("secret-poster")), names(s, "_site/video").join());
  assert.ok(!names(s, "_site/img").some((n) => n.includes("-300.")), names(s, "_site/img").join());
});

test("control: the same fixture without the draft lines publishes everything the live build left out", async () => {
  const s = await site({
    "content/projects/pub.md": pubMd(),
    "content/projects/secret.md": secretMd(false),
    "content/pages/notes.md": notesMd(false),
  });
  const r = s.build();
  assert.equal(r.code, 0, r.output);
  for (const here of ["_site/secret/index.html", "_site/notes/index.html", "_site/tags/art/index.html", "_site/video/secret.mp4", "_site/pdf/secret.pdf"]) {
    assert.ok(s.exists(here), `${here} should exist`);
  }
  assert.ok(names(s, "_site/video").some((n) => /^secret-poster-.*\.webp$/.test(n)), names(s, "_site/video").join());
  assert.ok(names(s, "_site/img").some((n) => n.includes("-300.")), names(s, "_site/img").join());
});

// ---------------------------------------------------------------------------
// Task 2: serve mode shows drafts with a label; `draft` must be a boolean
// ---------------------------------------------------------------------------

const cardFor = (html, hrefEnd) =>
  (html.match(/<a class="card"[\s\S]*?<\/a>/g) ?? []).find((c) => new RegExp(`href="[^"]*${hrefEnd}"`).test(c));

test("serve mode builds drafts and labels the page and its card", async () => {
  const s = await site();
  const r = s.buildServe();
  assert.equal(r.code, 0, r.output);
  assert.match(s.read("_site/secret/index.html"), /<h1>Secret<\/h1>\s*<p class="draft-label"><strong>Draft<\/strong><\/p>/);
  const work = s.read("_site/work/index.html");
  const secretCard = cardFor(work, "secret/");
  assert.ok(secretCard, work);
  assert.ok(secretCard.includes('<strong class="draft-label">Draft</strong>'), secretCard);
  assert.ok(!cardFor(work, "pub/").includes("draft-label"));
  assert.match(s.read("_site/notes/index.html"), /<p class="draft-label"><strong>Draft<\/strong><\/p>/);
  for (const here of ["_site/tags/art/index.html", "_site/video/secret.mp4", "_site/pdf/secret.pdf"]) {
    assert.ok(s.exists(here), `${here} should exist in serve mode`);
  }
});

test("no HTML in a live build contains draft-label", async () => {
  const s = await site();
  const r = s.build();
  assert.equal(r.code, 0, r.output);
  for (const f of htmlFiles(s)) assert.ok(!s.read(f.slice(s.dir.length + 1)).includes("draft-label"), f);
});

test("a stray ELEVENTY_RUN_MODE=serve cannot leak drafts into a plain build", async () => {
  const s = await site();
  const r = s.build({ ELEVENTY_RUN_MODE: "serve" });
  assert.equal(r.code, 0, r.output);
  assert.ok(!s.exists("_site/secret"));
  assert.ok(!s.exists("_site/notes"));
});

test("draft: false publishes normally with no label", async () => {
  const s = await site({ ...D_FILES(), "content/projects/pub.md": pubMd("draft: false\n") });
  const r = s.build();
  assert.equal(r.code, 0, r.output);
  assert.ok(s.exists("_site/pub/index.html"));
  assert.ok(!s.read("_site/pub/index.html").includes("draft-label"));
});

for (const [raw, shown] of [["yes", '"yes"'], ['"true"', '"true"'], ["1", "1"]]) {
  test(`draft: ${raw} fails the build in both run modes`, async () => {
    const files = { "content/projects/x.md": proj({ title: "X", date: "2024", tags: "games", cover: "a.webp", extra: `draft: ${raw}\n` }) };
    const s = await site(files);
    for (const run of [() => s.build(), () => s.buildServe()]) {
      const r = run();
      assert.notEqual(r.code, 0, r.output);
      assert.ok(r.output.includes("content/projects/x.md"), r.output);
      assert.ok(r.output.includes(`"draft" must be true or false (got ${shown})`), r.output);
    }
  });
}

test('draft: "no" on a page fails naming the page', async () => {
  const s = await site({ "content/pages/notes.md": '---\ntitle: Notes\ndraft: "no"\n---\n\nBody.\n' });
  const r = s.build();
  assert.notEqual(r.code, 0, r.output);
  assert.ok(r.output.includes("content/pages/notes.md"), r.output);
  assert.ok(r.output.includes('"draft" must be true or false (got "no")'), r.output);
});
