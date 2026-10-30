import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import siteData from "../src/_data/site.js";
import { pruneImages } from "../scripts/prune-img.js";
import { makeSite, defaultPrefix } from "./helpers/site.js";
import * as validate from "../lib/validate.js";

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

// ---------------------------------------------------------------------------
// Default share image
// ---------------------------------------------------------------------------

test("every page without a cover previews with the default image and its alt", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  const re = new RegExp(`^${escRe(siteData.url + prefix)}img/[^/]+-1200\\.jpeg$`);
  for (const rel of ["index.html", "work/index.html", "tags/games/index.html", "about/index.html", "404.html"]) {
    const html = site.read(`_site/${rel}`);
    const img = metaOf(html, "og:image");
    assert.match(img, re, `${rel}: ${img}`);
    assert.ok(site.exists(`_site/img/${img.split("/").pop()}`), `${rel}: ${img} not written`);
    assert.equal(metaOf(html, "og:image:alt"), siteData.defaultImageAlt, rel);
  }
});

test("the default image's original name never appears in the built HTML", async () => {
  const { site, r } = await build(P);
  assert.equal(r.code, 0, r.output);
  for (const f of allHtml(site)) {
    assert.ok(!fs.readFileSync(f, "utf8").includes(siteData.defaultImage), `${f} names ${siteData.defaultImage}`);
  }
});

test("a transparent cover keeps PNG and a small cover is not upscaled", async () => {
  const { site, r } = await build(
    {
      "content/projects/clear.md": proj({ title: "Clear", cover: "t.webp", alt: "Clear cover" }),
      "content/projects/small.md": proj({ title: "Small", cover: "s.webp", alt: "Small cover" }),
    },
    {
      assets: {
        "t.webp": { width: 800, height: 600, format: "webp", alpha: true },
        "s.webp": { width: 900, height: 600, format: "webp" },
      },
    }
  );
  assert.equal(r.code, 0, r.output);
  assert.match(metaOf(site.read("_site/clear/index.html"), "og:image"), /-800\.png$/);
  assert.match(metaOf(site.read("_site/small/index.html"), "og:image"), /-900\.jpeg$/);
});

test("the owner's real site builds with a default-image preview on the homepage", async () => {
  const site = await makeSite({ useRepoContent: true });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const img = metaOf(site.read("_site/index.html"), "og:image");
  assert.ok(img && site.exists(`_site/img/${img.split("/").pop()}`), img);
});

test("a fixture can supply its own default image file", async () => {
  const { site, r } = await build(P, {
    assets: { ...COVER, [siteData.defaultImage]: { width: 600, height: 315, format: "webp" } },
  });
  assert.equal(r.code, 0, r.output);
  assert.match(metaOf(site.read("_site/index.html"), "og:image"), /-600\.jpeg$/);
});

// ---------------------------------------------------------------------------
// description front matter, escaping, site.js validation
// ---------------------------------------------------------------------------

test("description beats summary, summary beats the site description (D-06 chain)", async () => {
  const { site, r } = await build({
    "content/projects/jam.md": proj({ title: "Jam", summary: "Shown on the page.", description: "Made for the 2024 jam." }),
    "content/projects/plain.md": proj({ title: "Plain", summary: "Only a summary." }),
    "content/pages/about.md": page({ title: "About", description: "About the maker." }),
    "content/pages/cv.md": page({ title: "CV" }),
  });
  assert.equal(r.code, 0, r.output);
  const jam = site.read("_site/jam/index.html");
  assert.equal(metaOf(jam, "description"), "Made for the 2024 jam.");
  assert.equal(metaOf(jam, "og:description"), "Made for the 2024 jam.");
  assert.ok(jam.includes("<p>Shown on the page.</p>"), "the on-page summary still shows the summary");
  assert.equal(metaOf(site.read("_site/plain/index.html"), "description"), "Only a summary.");
  assert.equal(metaOf(site.read("_site/about/index.html"), "description"), "About the maker.");
  assert.equal(metaOf(site.read("_site/cv/index.html"), "description"), siteData.description);
});

test("quotes, angle brackets and ampersands in preview text are escaped exactly once", async () => {
  const { site, r } = await build({
    "content/projects/q.md": proj({
      title: "'Tide & \"Pool\"'",
      description: "'Say \"hi\" <b> & bye'",
      alt: "'Alt \"x\" & <i>'",
    }),
  });
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/q/index.html");
  const head = html.slice(0, html.indexOf("</head>"));
  assert.equal(metaOf(html, "description"), "Say &quot;hi&quot; &lt;b&gt; &amp; bye");
  assert.equal(metaOf(html, "og:description"), "Say &quot;hi&quot; &lt;b&gt; &amp; bye");
  assert.equal(metaOf(html, "og:title"), "Tide &amp; &quot;Pool&quot;");
  assert.equal(metaOf(html, "og:image:alt"), "Alt &quot;x&quot; &amp; &lt;i&gt;");
  for (const f of allHtml(site)) assert.ok(!fs.readFileSync(f, "utf8").includes("&amp;amp;"), `${f} double-escapes`);
  assert.ok(!head.includes("<b>"), "raw <b> in the head");
});

test("a description that is not text fails the build naming the file", async () => {
  const { r } = await build({ "content/projects/x.md": proj({ title: "X", description: "42" }) });
  assert.notEqual(r.code, 0);
  assert.ok(r.output.includes('content/projects/x.md: "description" must be text'), r.output);
});

const SITE_ERR = {
  url: 'src/_data/site.js: url must be the site origin only, like "https://djmccurley.github.io" (https, no path, no trailing slash)',
  image: (n) => `src/_data/site.js: defaultImage "${n}" not found in assets/. Add the image to assets/ or change defaultImage.`,
  alt: "src/_data/site.js: defaultImageAlt must describe the default share image.",
  description: "src/_data/site.js: description must be a sentence for link previews of pages with no description or summary.",
};

const siteFile = (over) => ({ "src/_data/site.js": `export default ${JSON.stringify({ ...siteData, ...over })};\n` });

for (const [label, over, msg] of [
  ["a url with a path", { url: "https://example.org/portfolio-test" }, SITE_ERR.url],
  ["an http url", { url: "http://example.org" }, SITE_ERR.url],
  ["a url with a trailing slash", { url: "https://example.org/" }, SITE_ERR.url],
  ["a missing url", { url: undefined }, SITE_ERR.url],
  ["a default image that is not in assets/", { defaultImage: "nope.webp" }, SITE_ERR.image("nope.webp")],
  ["an empty default image alt", { defaultImageAlt: "" }, SITE_ERR.alt],
  ["an empty site description", { description: "" }, SITE_ERR.description],
]) {
  test(`${label} in site.js fails the build naming site.js`, async () => {
    const { r } = await build({ ...P, ...siteFile(over) });
    assert.notEqual(r.code, 0);
    assert.ok(r.output.includes(msg), r.output);
  });
}

test("validateSite accepts the repo settings and an origin with a port", () => {
  const ok = { resolveAsset: () => "/x" };
  assert.deepEqual(validate.validateSite({ ...siteData }, ok), []);
  assert.deepEqual(validate.validateSite({ ...siteData, url: "https://example.org:8443" }, ok), []);
});
