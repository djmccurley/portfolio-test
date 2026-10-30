import test, { after } from "node:test";
import assert from "node:assert/strict";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const proj = ({ title, date, draft = false, tags = "[games]" }) =>
  `---\ntitle: ${title}\ndate: "${date}"\ntags: ${tags}\ncover: ../../assets/a.webp\ncover_alt: Cover\n${
    draft ? "draft: true\n" : ""
  }---\n\nBody of ${title.replace(/&/g, "and")}.\n`;

const ASSETS = { "a.webp": { width: 1200, height: 800, format: "webp" } };

async function build(files, { prefix, serve = false } = {}) {
  const site = await makeSite({ files, assets: ASSETS, prefix });
  sites.push(site);
  const r = serve ? site.buildServe() : site.build();
  return { site, r };
}

const N = (opts = {}) => ({
  "content/projects/old.md": proj({ title: "Old", date: "2022" }),
  "content/projects/mid.md": proj({ title: "Middle", date: "2023", draft: opts.midDraft }),
  "content/projects/new.md": proj({ title: "Newest", date: "2024" }),
  "content/pages/about.md": "---\ntitle: About\n---\n\nAbout me.\n",
});

const pagerOf = (html) => (html.match(/<nav class="pager" aria-label="Projects">[\s\S]*?<\/nav>/) ?? [""])[0];
const linksOf = (html) => pagerOf(html).match(/<a [^>]*>[\s\S]*?<\/a>/g) ?? [];
const count = (html, needle) => html.split(needle).length - 1;

// ---------------------------------------------------------------------------
// Tracer: a visitor moves between projects in feed order
// ---------------------------------------------------------------------------

test("the newest project has only a Next link, to the older neighbour", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(N());
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/new/index.html");
  assert.equal(count(html, 'aria-label="Projects"'), 1);
  assert.equal(count(html, '<nav class="pager" aria-label="Projects">'), 1);
  const links = linksOf(html);
  assert.equal(links.length, 1, pagerOf(html));
  assert.equal(
    links[0],
    `<a href="${prefix}mid/" rel="next">Next: Middle<span aria-hidden="true"> →</span></a>`
  );
  assert.ok(!pagerOf(html).includes('rel="prev"'));
});

test("a middle project has Previous (newer) then Next (older)", async () => {
  const prefix = defaultPrefix();
  const { site } = await build(N());
  const links = linksOf(site.read("_site/mid/index.html"));
  assert.deepEqual(links, [
    `<a href="${prefix}new/" rel="prev"><span aria-hidden="true">← </span>Previous: Newest</a>`,
    `<a href="${prefix}old/" rel="next">Next: Old<span aria-hidden="true"> →</span></a>`,
  ]);
});

test("the oldest project has only a Previous link, to the newer neighbour", async () => {
  const prefix = defaultPrefix();
  const { site } = await build(N());
  const links = linksOf(site.read("_site/old/index.html"));
  assert.deepEqual(links, [
    `<a href="${prefix}mid/" rel="prev"><span aria-hidden="true">← </span>Previous: Middle</a>`,
  ]);
});

test("the pager is the last child of <main>, after the content, and distinct from the Main nav", async () => {
  const { site } = await build(N());
  for (const slug of ["new", "mid", "old"]) {
    const html = site.read(`_site/${slug}/index.html`);
    assert.match(html, /<\/nav>\s*<\/main>/, slug);
    assert.ok(html.indexOf("Body of") < html.indexOf('aria-label="Projects"'), `${slug}: pager is after the content`);
    assert.equal(count(html, '<nav aria-label="Main">'), 1, slug);
  }
});

test("standalone pages, /work/, tag pages, the homepage and 404 have no pager", async () => {
  const { site } = await build(N());
  for (const f of ["about/index.html", "work/index.html", "tags/games/index.html", "index.html", "404.html"]) {
    const html = site.read(`_site/${f}`);
    assert.ok(!html.includes('aria-label="Projects"'), `${f} must not have a pager`);
    assert.ok(!html.includes('class="pager"'), f);
    assert.equal(count(html, '<nav aria-label="Main">'), 1, f);
  }
});

test("a single project gets no pager element at all", async () => {
  const { site, r } = await build({ "content/projects/only.md": proj({ title: "Only", date: "2024" }) });
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/only/index.html");
  assert.ok(!html.includes('aria-label="Projects"'));
  assert.ok(!html.includes('class="pager"'));
});

// ---------------------------------------------------------------------------
// Drafts (D-05)
// ---------------------------------------------------------------------------

test("a live build skips a draft: neighbours link to each other and nothing points at it", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(N({ midDraft: true }));
  assert.equal(r.code, 0, r.output);
  const nw = site.read("_site/new/index.html");
  assert.deepEqual(linksOf(nw), [
    `<a href="${prefix}old/" rel="next">Next: Old<span aria-hidden="true"> →</span></a>`,
  ]);
  const old = site.read("_site/old/index.html");
  assert.deepEqual(linksOf(old), [
    `<a href="${prefix}new/" rel="prev"><span aria-hidden="true">← </span>Previous: Newest</a>`,
  ]);
  for (const html of [nw, old]) assert.ok(!pagerOf(html).includes("mid/"));
});

test("under npm start (serve mode) drafts take part in the chain", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(N({ midDraft: true }), { serve: true });
  assert.equal(r.code, 0, r.output);
  const links = linksOf(site.read("_site/new/index.html"));
  assert.deepEqual(links, [
    `<a href="${prefix}mid/" rel="next">Next: Middle<span aria-hidden="true"> →</span></a>`,
  ]);
});

// ---------------------------------------------------------------------------
// Escaping and prefix
// ---------------------------------------------------------------------------

test("a neighbour title with an ampersand is escaped exactly once", async () => {
  const { site } = await build({
    "content/projects/a.md": proj({ title: "A & B", date: "2023" }),
    "content/projects/b.md": proj({ title: "Later", date: "2024" }),
  });
  const html = site.read("_site/b/index.html");
  assert.ok(pagerOf(html).includes("Next: A &amp; B<span"), pagerOf(html));
  assert.ok(!html.includes("&amp;amp;"));
});

test("a root-domain build links without the path prefix", async () => {
  const { site } = await build(N(), { prefix: "/" });
  const hrefs = linksOf(site.read("_site/mid/index.html")).map((l) => l.match(/href="([^"]+)"/)[1]);
  assert.deepEqual(hrefs, ["/new/", "/old/"]);
});
