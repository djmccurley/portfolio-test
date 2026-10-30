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
