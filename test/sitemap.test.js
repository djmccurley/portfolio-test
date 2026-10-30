import test, { after } from "node:test";
import assert from "node:assert/strict";
import siteData from "../src/_data/site.js";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const proj = ({ title, tags, draft = false }) =>
  `---\ntitle: ${title}\ndate: "2024"\ntags: ${tags}\ncover: ../../assets/a.webp\ncover_alt: Cover\n${
    draft ? "draft: true\n" : ""
  }---\n\nBody.\n`;

const ASSETS = { "a.webp": { width: 1200, height: 800, format: "webp" } };

// Fixture S: ux is used only by the draft c.md, so tags/ux/ must never be listed.
const S = {
  "content/projects/a.md": proj({ title: "A", tags: "[games]" }),
  "content/projects/b.md": proj({ title: "B", tags: "[art, games]" }),
  "content/projects/c.md": proj({ title: "C", tags: "[ux]", draft: true }),
  "content/pages/cv.md": "---\ntitle: CV\n---\n\nCV.\n",
  "content/pages/teaching.md": "---\ntitle: Teaching\n---\n\nCourses.\n",
};

async function build(files, { prefix, serve = false, useRepoContent = false, assets = ASSETS } = {}) {
  const site = await makeSite({ files, assets, prefix, useRepoContent });
  sites.push(site);
  const r = serve ? site.buildServe() : site.build();
  return { site, r };
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

test("sitemap.xml lists every public page once, sorted, with absolute URLs", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(S);
  assert.equal(r.code, 0, r.output);
  const xml = site.read("_site/sitemap.xml");
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), xml.slice(0, 120));
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  const base = `${siteData.url}${prefix}`;
  assert.deepEqual(
    locs(xml),
    [base, ...["a/", "b/", "cv/", "tags/art/", "tags/games/", "teaching/", "work/"].map((p) => base + p)]
  );
});

test("no draft, draft-only tag page, 404, sitemap or robots is listed", async () => {
  const { site } = await build(S);
  const list = locs(site.read("_site/sitemap.xml"));
  for (const l of list) {
    for (const bad of ["404", "/c/", "tags/ux/", "sitemap.xml", "robots.txt"]) {
      assert.ok(!l.includes(bad), `${l} must not contain ${bad}`);
    }
  }
});

test("with several used tags every tag page is listed, not just the first", async () => {
  const { site } = await build(S);
  const list = locs(site.read("_site/sitemap.xml"));
  assert.equal(list.filter((l) => l.includes("/tags/")).length, 2);
});

test("robots.txt allows everything and ends with the absolute Sitemap line", async () => {
  const prefix = defaultPrefix();
  const { site } = await build(S);
  const txt = site.read("_site/robots.txt");
  const lines = txt.split("\n").map((l) => l.trimEnd());
  assert.ok(lines.includes("User-agent: *"), txt);
  assert.ok(lines.includes("Allow: /"), txt);
  assert.equal(lines.filter((l) => l).at(-1), `Sitemap: ${siteData.url}${prefix}sitemap.xml`);
});

test("neither file is HTML or carries a doubled prefix", async () => {
  const prefix = defaultPrefix();
  const { site } = await build(S);
  for (const f of ["_site/sitemap.xml", "_site/robots.txt"]) {
    const t = site.read(f);
    assert.ok(!t.includes("<html"), f);
    assert.ok(!t.includes(`${prefix}${prefix.replace(/^\//, "")}`), `${f} doubles the prefix`);
  }
});

test("a root-domain build has no path prefix in either file", async () => {
  const { site } = await build(S, { prefix: "/" });
  const xml = site.read("_site/sitemap.xml");
  const list = locs(xml);
  assert.ok(list.length > 1);
  for (const l of list) assert.ok(l.startsWith(`${siteData.url}/`), l);
  assert.equal(list[0], `${siteData.url}/`);
  const txt = site.read("_site/robots.txt");
  assert.ok(txt.includes(`Sitemap: ${siteData.url}/sitemap.xml`), txt);
  assert.ok(!xml.includes("/portfolio-test/") && !txt.includes("/portfolio-test/"));
});

test("serve mode builds the draft page but still never lists it or its tag page", async () => {
  const { site, r } = await build(S, { serve: true });
  assert.equal(r.code, 0, r.output);
  assert.ok(site.exists("_site/c/index.html"));
  const list = locs(site.read("_site/sitemap.xml"));
  for (const l of list) {
    assert.ok(!l.includes("/c/") && !l.includes("tags/ux/"), l);
  }
  assert.ok(list.some((l) => l.endsWith("/a/")));
});

test("the owner's real site lists its project", async () => {
  const { site, r } = await build({}, { useRepoContent: true });
  assert.equal(r.code, 0, r.output);
  const list = locs(site.read("_site/sitemap.xml"));
  assert.ok(list.some((l) => l.endsWith("tidepool-game/")), list.join("\n"));
});
