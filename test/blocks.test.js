import test, { after } from "node:test";
import assert from "node:assert/strict";
import { makeSite } from "./helpers/site.js";

const front = `---
title: Grid
date: "2024-01-01"
tags: [games]
cover: ../../assets/a.webp
cover_alt: Cover
---
`;

const GRID2_SIZES = "(min-width: 90em) 632px, (min-width: 40em) 45vw, 90vw";

const gridMd = `${front}
A paragraph before the block.

::: grid-2
![Crab on a rock](../../assets/a.webp "The crab & friend")
![Pool at low tide](../../assets/b.webp)
:::
`;

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

async function build(files, assets) {
  const site = await makeSite({ files, assets });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  return site;
}

const gridSite = await build(
  { "content/projects/grid.md": gridMd },
  {
    "a.webp": { width: 1200, height: 800, format: "webp" },
    "b.webp": { width: 800, height: 1200, format: "webp" },
  }
);
const gridHtml = gridSite.read("_site/grid/index.html");

test("grid-2 renders a layout div with one figure per image", () => {
  const m = gridHtml.match(/<div class="layout grid-2">([\s\S]*?)\n?<\/div>/);
  assert.ok(m, "layout grid-2 div present");
  const figures = m[1].match(/<figure>[\s\S]*?<\/figure>/g);
  assert.equal(figures.length, 2);
  assert.match(figures[0], /<figcaption>The crab &amp; friend<\/figcaption>/);
  assert.doesNotMatch(figures[1], /<figcaption>/);
});

test("figures are not wrapped in a paragraph", () => {
  assert.doesNotMatch(gridHtml, /<p>\s*<figure>/);
  assert.doesNotMatch(gridHtml, /<\/figure>\s*<\/p>/);
});

test("grid images and sources carry the grid-2 sizes value", () => {
  const block = gridHtml.match(/<div class="layout grid-2">[\s\S]*<\/div>/)[0];
  const sizes = block.match(/sizes="[^"]*"/g);
  assert.ok(sizes.length >= 4, `expected sizes on sources and imgs, got ${sizes.length}`);
  for (const s of sizes) assert.equal(s, `sizes="${GRID2_SIZES}"`);
});

test("first grid image is eager, alt is kept and no img has a title attribute", () => {
  const imgs = gridHtml.match(/<img[^>]*>/g);
  assert.match(imgs[0], /alt="Crab on a rock"/);
  assert.match(imgs[0], /loading="eager"/);
  assert.match(imgs[0], /fetchpriority="high"/);
  assert.match(imgs[1], /loading="lazy"/);
  for (const i of imgs) assert.doesNotMatch(i, /\stitle=/);
});

// ---------------------------------------------------------------------------
// Mixed page: every layout, lone images, decorative marker and raw HTML together
// ---------------------------------------------------------------------------

const GRID3_SIZES = "(min-width: 90em) 416px, (min-width: 60em) 30vw, (min-width: 40em) 45vw, 90vw";
const GRID4_SIZES = "(min-width: 90em) 308px, (min-width: 60em) 22vw, (min-width: 40em) 45vw, 90vw";
const LONE_SIZES = "(min-width: 90em) 1280px, 90vw";

const mixedMd = `${front.replace("title: Grid", "title: Mixed")}
Intro paragraph.

::: grid-3
![Alpha](../../assets/a.webp)
![Bravo](../../assets/b.webp "Bee caption")
![Charlie](../../assets/c.webp)
![Delta](../../assets/d.webp)
:::

Middle paragraph.

::: full
![Wide one](../../assets/a.webp "Wide shot")
![Wide two](../../assets/c.webp)
:::

## Heading

::: grid-4
![Solo](../../assets/b.webp)
:::

::: grid-2
![One](../../assets/a.webp)

![Two](../../assets/b.webp)
:::

![Tide](../../assets/d.webp "Tide caption")

![Lone untitled](../../assets/c.webp)

![Pair first](../../assets/a.webp)
![Pair second](../../assets/b.webp "Second title")

A sentence with an inline ![Inline](../../assets/c.webp "Inline tip") image here.

![](../../assets/c.webp){decorative}

![Click](../../assets/a.webp){onclick=alert(1)}

![Wide class](../../assets/d.webp){.wide}

<div class="note"><p>Raw <em>HTML</em></p></div>

<img src="../../assets/a.webp" alt="Raw image">
`;

const MIXED_ASSETS = {
  "a.webp": { width: 1200, height: 800, format: "webp" },
  "b.webp": { width: 800, height: 1200, format: "webp" },
  "c.webp": { width: 1000, height: 1000, format: "webp" },
  "d.webp": { width: 1600, height: 900, format: "webp" },
};
const RATIOS = { Alpha: 1200 / 800, Bravo: 800 / 1200, Charlie: 1, Delta: 1600 / 900 };

const mixedSite = await build({ "content/projects/mixed.md": mixedMd }, MIXED_ASSETS);
const mixedHtml = mixedSite.read("_site/mixed/index.html");

const VOID = new Set(["img", "source", "br", "hr", "input", "meta", "link", "wbr"]);

// Top-level elements of a fragment as { tag, cls, html }.
function topLevel(fragment) {
  const out = [];
  const re = /<(\/?)([a-z0-9]+)([^>]*)>/gi;
  let depth = 0;
  let cur = null;
  let m;
  while ((m = re.exec(fragment))) {
    const tag = m[2].toLowerCase();
    if (VOID.has(tag)) continue;
    if (!m[1]) {
      if (depth === 0) {
        cur = { tag, cls: (m[3].match(/class="([^"]*)"/) ?? [])[1] ?? "", start: m.index };
        out.push(cur);
      }
      depth++;
    } else {
      depth--;
      if (depth === 0) cur.html = fragment.slice(cur.start, re.lastIndex);
    }
  }
  return out;
}

const mainInner = mixedHtml.match(/<main[^>]*>([\s\S]*)<\/main>/)[1];
const topEls = topLevel(mainInner);
const body = topEls.slice(2); // skip the Phase 1 h1 and date paragraph

const block = (cls) => body.find((e) => e.tag === "div" && e.cls === cls);
const figuresOf = (el) => el.html.match(/<figure>[\s\S]*?<\/figure>/g) ?? [];
const sizesOf = (html) => [...html.matchAll(/sizes="([^"]*)"/g)].map((m) => m[1]);
const imgsOf = (html) => html.match(/<img[^>]*>/g) ?? [];

test("mixed page keeps blocks, headings, lone images and raw HTML as flat siblings in source order", () => {
  const seq = body.map((e) => `${e.tag}${e.cls ? "." + e.cls.replace(/ /g, ".") : ""}`);
  assert.deepEqual(seq, [
    "p",
    "div.layout.grid-3",
    "p",
    "div.layout.full",
    "h2",
    "div.layout.grid-4",
    "div.layout.grid-2",
    "figure",
    "p.lone-image",
    "figure",
    "figure",
    "p",
    "p.lone-image",
    "p.lone-image",
    "p.lone-image",
    "div.note",
    "picture",
  ]);
});

test("grid-3 holds four figures in source order with the grid-3 sizes", () => {
  const el = block("layout grid-3");
  const figs = figuresOf(el);
  assert.equal(figs.length, 4);
  ["Alpha", "Bravo", "Charlie", "Delta"].forEach((alt, i) => assert.match(figs[i], new RegExp(`alt="${alt}"`)));
  assert.match(figs[1], /<figcaption>Bee caption<\/figcaption>/);
  const sizes = sizesOf(el.html);
  assert.ok(sizes.length >= 8);
  for (const s of sizes) assert.equal(s, GRID3_SIZES);
});

test("grid-4 with one image renders one figure with the grid-4 sizes", () => {
  const el = block("layout grid-4");
  assert.equal(figuresOf(el).length, 1);
  for (const s of sizesOf(el.html)) assert.equal(s, GRID4_SIZES);
});

test("grid-2 images in separate paragraphs still make two figures", () => {
  const el = block("layout grid-2");
  assert.equal(figuresOf(el).length, 2);
  for (const s of sizesOf(el.html)) assert.equal(s, GRID2_SIZES);
});

test("full holds two figures in order, 100vw, only the first captioned", () => {
  const el = block("layout full");
  const figs = figuresOf(el);
  assert.equal(figs.length, 2);
  assert.match(figs[0], /alt="Wide one"/);
  assert.match(figs[0], /<figcaption>Wide shot<\/figcaption>/);
  assert.match(figs[1], /alt="Wide two"/);
  assert.doesNotMatch(figs[1], /<figcaption>/);
  const sizes = sizesOf(el.html);
  assert.ok(sizes.length >= 4);
  for (const s of sizes) assert.equal(s, "100vw");
});

test("grid figures keep their own aspect ratio within 1%", () => {
  const el = block("layout grid-3");
  for (const [alt, ratio] of Object.entries(RATIOS)) {
    const img = imgsOf(el.html).find((i) => i.includes(`alt="${alt}"`));
    const w = Number(img.match(/\swidth="(\d+)"/)[1]);
    const h = Number(img.match(/\sheight="(\d+)"/)[1]);
    assert.ok(Math.abs(w / h / ratio - 1) < 0.01, `${alt}: ${w}x${h} vs ${ratio}`);
  }
});

test("lone titled image is a figure outside a paragraph, lone untitled image keeps a lone-image paragraph", () => {
  const tide = body[7];
  assert.equal(tide.tag, "figure");
  assert.match(tide.html, /<figcaption>Tide caption<\/figcaption>/);
  const lone = body[8];
  assert.match(lone.html, /alt="Lone untitled"/);
  assert.doesNotMatch(lone.html, /<figcaption>/);
  assert.doesNotMatch(lone.html, /<figure>/);
  for (const s of sizesOf(tide.html + lone.html)) assert.equal(s, LONE_SIZES);
});

test("an image-only paragraph with a title makes one figure per image", () => {
  assert.equal(body[9].tag, "figure");
  assert.match(body[9].html, /alt="Pair first"/);
  assert.doesNotMatch(body[9].html, /<figcaption>/);
  assert.equal(body[10].tag, "figure");
  assert.match(body[10].html, /alt="Pair second"/);
  assert.match(body[10].html, /<figcaption>Second title<\/figcaption>/);
});

test("an image inside a sentence stays inline", () => {
  const p = body[11];
  assert.equal(p.cls, "");
  assert.match(p.html, /A sentence with an inline/);
  assert.match(p.html, /alt="Inline"/);
  assert.doesNotMatch(p.html, /<figure>/);
});

test("decorative marker renders empty alt and never reaches the HTML", () => {
  assert.match(body[12].html, /alt=""/);
  assert.doesNotMatch(mixedHtml, /decorative/);
});

test("disallowed brace attributes are dropped, class is kept", () => {
  assert.doesNotMatch(mixedHtml, /onclick/);
  assert.match(body[13].html, /alt="Click"/);
  assert.match(body[14].html, /class="wide"/);
});

test("raw HTML passes through and raw img still becomes a responsive picture", () => {
  assert.ok(mixedHtml.includes('<div class="note"><p>Raw <em>HTML</em></p></div>'));
  const pic = body[16].html;
  assert.match(pic, /srcset="[^"]+"/);
  assert.match(pic, /alt="Raw image"/);
  for (const s of sizesOf(pic)) assert.equal(s, LONE_SIZES);
});

test("only the first image on the page is eager", () => {
  const imgs = imgsOf(mixedHtml);
  assert.match(imgs[0], /alt="Alpha"/);
  assert.match(imgs[0], /loading="eager"/);
  assert.match(imgs[0], /fetchpriority="high"/);
  for (const i of imgs.slice(1)) assert.match(i, /loading="lazy"/);
});

test("a decorative marker after the image text applies to every image in the paragraph", async () => {
  const site = await build(
    {
      "content/projects/deco.md": `${front.replace("title: Grid", "title: Deco")}
Text.

![First](../../assets/a.webp)
![Second](../../assets/b.webp) {decorative}
`,
    },
    MIXED_ASSETS
  );
  const html = site.read("_site/deco/index.html");
  assert.doesNotMatch(html, /decorative/);
  const imgs = imgsOf(html);
  assert.equal(imgs.length, 2);
  for (const i of imgs) assert.match(i, /alt=""/);
});
