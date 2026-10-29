import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import sharp from "sharp";
import { makeSite } from "./helpers/site.js";

const md = `---
title: Specials
date: "2024-01-01"
tags: [games]
cover: ../../assets/opaque.webp
cover_alt: Cover
---

![Opaque](../../assets/opaque.webp)

![Clear](../../assets/clear.webp)

![Loop](../../assets/loop.gif)

![Logo](../../assets/logo.svg)
`;

async function build() {
  const site = await makeSite({
    assets: {
      "opaque.webp": { width: 1200, height: 800, format: "webp" },
      "clear.webp": { width: 800, height: 600, format: "webp", alpha: true },
      "loop.gif": { width: 200, height: 150, format: "gif", animated: true },
      "logo.svg": { width: 300, height: 100, format: "svg" },
    },
    files: { "content/projects/specials.md": md },
  });
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/specials/index.html");
  // chunks in document order: <picture>..</picture> or standalone <img>
  const chunks = html.match(/<picture[\s\S]*?<\/picture>|<img[^>]*>/g);
  return { site, html, chunks };
}

const imgTag = (chunk) => chunk.match(/<img[^>]*>/)[0];

test("opaque keeps webp + jpeg", async () => {
  const { site, chunks } = await build();
  try {
    assert.match(chunks[0], /type="image\/webp"/);
    assert.match(imgTag(chunks[0]), /src="[^"]*\.jpeg"/);
  } finally {
    site.cleanup();
  }
});

test("transparent gets png fallback, no jpeg", async () => {
  const { site, chunks } = await build();
  try {
    assert.doesNotMatch(chunks[1], /\.jpeg/);
    assert.match(imgTag(chunks[1]), /src="[^"]*\.png"/);
  } finally {
    site.cleanup();
  }
});

test("animated gif keeps frames and gif fallback", async () => {
  const { site, chunks } = await build();
  try {
    assert.match(imgTag(chunks[2]), /src="[^"]*\.gif"/);
    const m = chunks[2].match(/<source[^>]*type="image\/webp"[^>]*>/);
    assert.ok(m, "webp source present");
    const set = m[0].match(/srcset="([^"]*)"/)[1];
    const urls = set.split(",").map((p) => p.trim().split(/\s+/));
    urls.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
    const file = path.join(site.dir, "_site", "img", path.basename(urls[0][0]));
    const meta = await sharp(file, { animated: true }).metadata();
    assert.ok((meta.pages ?? 1) >= 2, `expected >=2 frames, got ${meta.pages}`);
  } finally {
    site.cleanup();
  }
});

test("svg is a single img with dimensions", async () => {
  const { site, chunks } = await build();
  try {
    assert.doesNotMatch(chunks[3], /<source/);
    const tag = imgTag(chunks[3]);
    assert.match(tag, /src="[^"]*\.svg"/);
    assert.match(tag, /width="300"/);
    assert.match(tag, /height="100"/);
  } finally {
    site.cleanup();
  }
});

test("all images have dimensions, only first eager", async () => {
  const { chunks, site } = await build();
  try {
    const tags = chunks.map(imgTag);
    assert.equal(tags.length, 4);
    for (const t of tags) {
      assert.match(t, /width=/);
      assert.match(t, /height=/);
    }
    assert.match(tags[0], /loading="eager"/);
    for (const t of tags.slice(1)) assert.doesNotMatch(t, /loading="eager"/);
  } finally {
    site.cleanup();
  }
});
