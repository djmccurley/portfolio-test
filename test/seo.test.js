import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import siteData from "../src/_data/site.js";
import { pruneImages } from "../scripts/prune-img.js";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const proj = ({ title, date = "2024", cover = "cover.webp", alt = "Tide cover", summary, description }) =>
  [
    "---",
    `title: ${title}`,
    `date: "${date}"`,
    "tags: [games]",
    `cover: ../../assets/${cover}`,
    `cover_alt: ${alt}`,
    summary !== undefined ? `summary: ${summary}` : null,
    description !== undefined ? `description: ${description}` : null,
    "---",
    "",
    "Body.",
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");

const page = ({ title, description }) =>
  ["---", `title: ${title}`, description !== undefined ? `description: ${description}` : null, "---", "", "Body.", ""]
    .filter((l) => l !== null)
    .join("\n");

const COVER = { "cover.webp": { width: 1600, height: 1000, format: "webp" } };

const P = {
  "content/projects/tide.md": proj({ title: "Tide", summary: "A short game about tides." }),
  "content/pages/about.md": page({ title: "About" }),
};

async function build(files, { assets = COVER, ...opts } = {}) {
  const site = await makeSite({ files, assets, ...opts });
  sites.push(site);
  const r = site.build();
  return { site, r };
}

const count = (html, needle) => html.split(needle).length - 1;
const once = (html, needle) => assert.equal(count(html, needle), 1, `expected exactly one of: ${needle}\n${html.slice(0, 2500)}`);
const metaOf = (html, key) => {
  const m = html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)">`));
  return m ? m[1] : null;
};
const allHtml = (site) => site.walk("_site").filter((f) => f.endsWith(".html"));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------------------
// Tracer: a shared project link previews with its title, summary and processed cover
// ---------------------------------------------------------------------------

test("a project page carries the full preview tag set with absolute URLs under the prefix", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/tide/index.html");
  const url = `${siteData.url}${prefix}tide/`;

  once(html, '<meta name="description" content="A short game about tides.">');
  once(html, `<link rel="canonical" href="${url}">`);
  once(html, '<meta property="og:title" content="Tide">');
  once(html, '<meta property="og:description" content="A short game about tides.">');
  once(html, '<meta property="og:type" content="article">');
  once(html, `<meta property="og:url" content="${url}">`);
  once(html, `<meta property="og:site_name" content="${siteData.name}">`);
  once(html, '<meta property="og:image:alt" content="Tide cover">');
  once(html, '<meta name="twitter:card" content="summary_large_image">');
  assert.ok(html.includes("<title>Tide</title>"));
});

test("og:image is a processed 1200px derivative of the cover, not the original", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/tide/index.html");

  const img = metaOf(html, "og:image");
  assert.match(img, new RegExp(`^${escRe(siteData.url + prefix)}img/[^/]+-1200\\.jpeg$`), img);
  const file = img.split("/").pop();
  assert.notEqual(file, "cover.webp");
  assert.ok(site.exists(`_site/img/${file}`), `${file} missing from _site/img/`);
  assert.equal((await sharp(path.join(site.dir, "_site", "img", file)).metadata()).width, 1200);

  // survives npm run prune:img (IMG-03, T-04-09)
  const res = pruneImages(path.join(site.dir, "_site"));
  assert.ok(!res.removed.includes(file), `prune removed ${file}`);
  assert.ok(site.exists(`_site/img/${file}`));
});

test("the preview tags sit between </title> and the Chivo stylesheet link", async () => {
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/tide/index.html");
  const from = html.indexOf("</title>");
  const to = html.indexOf("fonts.googleapis.com/css2");
  assert.ok(from > 0 && to > from);
  const head = html.slice(from, to);
  for (const needle of ['name="description"', 'rel="canonical"', "og:title", "og:image", "twitter:card"]) {
    assert.ok(head.includes(needle), `${needle} not between </title> and the fonts link`);
  }
});

test("a standalone page is og:type website with its own canonical and the site description", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/about/index.html");
  once(html, '<meta property="og:type" content="website">');
  once(html, `<link rel="canonical" href="${siteData.url}${prefix}about/">`);
  once(html, `<meta name="description" content="${siteData.description}">`);
});

test("the Work page titles its preview Work", async () => {
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  once(site.read("_site/work/index.html"), '<meta property="og:title" content="Work">');
});

test("a root-domain build has no path prefix in any preview URL", async () => {
  const { site, r } = await build(P, { prefix: "/" });
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/tide/index.html");
  once(html, `<meta property="og:url" content="${siteData.url}/tide/">`);
  assert.ok(metaOf(html, "og:image").startsWith(`${siteData.url}/img/`), metaOf(html, "og:image"));
  for (const f of allHtml(site)) {
    assert.ok(!fs.readFileSync(f, "utf8").includes("/portfolio-test/"), `${f} contains /portfolio-test/`);
  }
});

test("link previews add no client script", async () => {
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  for (const f of allHtml(site)) {
    const html = fs.readFileSync(f, "utf8");
    const head = html.slice(0, html.indexOf("</head>"));
    for (const s of head.match(/<script[^>]*>/g) ?? []) {
      assert.match(s, /lightbox\.js/, `${f}: unexpected ${s}`);
    }
  }
});
