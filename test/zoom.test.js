import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { installBlocks } from "../lib/blocks.js";
import { zoomHref, zoomPlugin } from "../lib/zoom.js";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const prefix = defaultPrefix();
const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const front = `---
title: Zoom
date: "2024-01-01"
tags: [games]
cover: ../../assets/small.webp
cover_alt: Cover
---
`;

const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#08f"/></svg>'
);

const assets = {
  "big.webp": { width: 3000, height: 2000, format: "webp" },
  "mid.webp": { width: 2000, height: 1000, format: "webp" },
  "small.webp": { width: 308, height: 200, format: "webp" },
  "anim.gif": { width: 64, height: 48, format: "gif", animated: true },
  "logo.svg": SVG,
};

const body = `${front}
::: grid-2
![Big picture](../../assets/big.webp)
![Mid picture](../../assets/mid.webp)
:::

![Small lone](../../assets/small.webp)

![Titled lone](../../assets/small.webp "A lone caption")

![Animated](../../assets/anim.gif)

![Logo mark](../../assets/logo.svg)

![](../../assets/small.webp)

::: full
![Full bleed](../../assets/big.webp)
:::

![Deco](../../assets/small.webp){decorative}

Words around ![Inline pic](../../assets/small.webp) in a paragraph.

[![Linked pic](../../assets/small.webp)](https://example.com)

<img src="../../assets/small.webp" alt="Raw html image">
`;

async function build(opts = {}) {
  const site = await makeSite({ files: { "content/projects/zoom.md": body }, assets, ...opts });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  return site;
}

const site = await build();
const html = site.read("_site/zoom/index.html");
const main = html.slice(html.indexOf("<main"));

// Every <a class="zoom" ...>...</a> in document order.
const zooms = [...main.matchAll(/<a class="zoom"([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
  attrs: m[1],
  inner: m[2],
  href: /href="([^"]*)"/.exec(m[1])?.[1],
  dw: /data-width="(\d+)"/.exec(m[1])?.[1],
  dh: /data-height="(\d+)"/.exec(m[1])?.[1],
  alt: /alt="([^"]*)"/.exec(m[2])?.[1],
}));
const byAlt = (alt) => zooms.find((z) => z.alt === alt);
const imgSize = (z) => ({
  w: /<img[^>]* width="(\d+)"/.exec(z.inner)?.[1],
  h: /<img[^>]* height="(\d+)"/.exec(z.inner)?.[1],
});

test("grid images link their largest published variant with its size", () => {
  const big = byAlt("Big picture");
  const mid = byAlt("Mid picture");
  assert.ok(big && mid, "both grid images are wrapped");
  assert.ok(big.href.startsWith(`${prefix}img/`), big.href);
  assert.match(big.href, /-2400\.webp$/);
  assert.equal(big.dw, "2400");
  assert.match(mid.href, /-1600\.webp$/);
  assert.equal(mid.dw, "1600");
  for (const z of [big, mid]) {
    assert.equal(z.dh, imgSize(z).h, "data-height matches the img height");
    assert.equal(z.dw, imgSize(z).w, "data-width matches the img width");
  }
  assert.match(main, /<figure><a class="zoom"/);
});

test("a lone untitled image sits in a lone-image paragraph and links its own size", () => {
  const z = byAlt("Small lone");
  assert.match(main, /<p class="lone-image"><a class="zoom"/);
  assert.match(z.href, /-308\.webp$/);
  assert.equal(z.dw, "308");
});

test("a titled lone image keeps its caption outside the link", () => {
  assert.match(main, /<figure><a class="zoom"[^>]*>(?:(?!<\/a>)[\s\S])*<\/a><figcaption>A lone caption<\/figcaption><\/figure>/);
  assert.ok(!byAlt("Titled lone").inner.includes("A lone caption"));
});

test("the accessible name is the alt plus a hidden full-size suffix", () => {
  for (const alt of ["Big picture", "Mid picture", "Small lone", "Titled lone", "Animated", "Logo mark"]) {
    assert.ok(
      byAlt(alt).inner.includes('<span class="visually-hidden"> (full size)</span>'),
      `${alt}: missing hidden suffix`
    );
  }
});

test("an animated gif links its published gif and an svg its published svg", () => {
  assert.match(byAlt("Animated").href, /\.gif$/);
  assert.match(byAlt("Logo mark").href, /\.svg$/);
});

test("an empty-alt image that is not decorative is still wrapped", () => {
  assert.ok(zooms.some((z) => z.alt === ""), "empty-alt image is wrapped");
});

test("full-bleed, decorative, mixed-with-text, linked and raw html images are not wrapped", () => {
  const alts = zooms.map((z) => z.alt);
  for (const alt of ["Full bleed", "Deco", "Inline pic", "Linked pic", "Raw html image"]) {
    assert.ok(!alts.includes(alt), `${alt} must not be wrapped`);
  }
  assert.match(main, /Full bleed/);
  assert.match(main, /Raw html image/);
  assert.match(main, /<a href="https:\/\/example\.com">/);
  assert.equal(zooms.length, 7);
});

test("every zoom href names a published pipeline file and none points at assets/", () => {
  for (const f of site.walk("_site").filter((p) => p.endsWith(".html"))) {
    const text = fs.readFileSync(f, "utf8");
    for (const m of text.matchAll(/<a class="zoom"[^>]*href="([^"]*)"/g)) {
      assert.ok(!m[1].includes("/assets/"), `${f}: ${m[1]}`);
    }
  }
  for (const z of zooms) {
    const rel = z.href.slice(prefix.length);
    assert.ok(rel.startsWith("img/"), z.href);
    assert.ok(site.exists(`_site/${rel}`), `${rel} is not published`);
  }
});

test("under PATH_PREFIX=/ the zoom hrefs start /img/", async () => {
  const root = await build({ prefix: "/" });
  const page = root.read("_site/zoom/index.html");
  const hrefs = [...page.matchAll(/<a class="zoom"[^>]*href="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(hrefs.length, 7);
  for (const h of hrefs) assert.ok(h.startsWith("/img/"), h);
});

// ---- markdown-only units ----

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zoom-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function render(text) {
  const file = path.join(tmp, "case.md");
  fs.writeFileSync(file, text);
  const md = new MarkdownIt();
  installBlocks(md);
  return md.render(text, { page: { inputPath: file } });
}

test("remote and data: lone images are not wrapped", () => {
  assert.doesNotMatch(render("![Remote](https://example.com/a.png)\n"), /class="zoom"/);
  assert.doesNotMatch(render("![Data](data:image/png;base64,AAAA)\n"), /class="zoom"/);
});

test("a grid image renders an unfinished zoom wrapper before the transform", () => {
  const out = render("::: grid-2\n![One](a.webp)\n![Two](b.webp)\n:::\n");
  assert.match(out, /<figure><a class="zoom"><img /);
  assert.doesNotMatch(out, /<a class="zoom" href/);
  assert.match(out, /<span class="visually-hidden"> \(full size\)<\/span><\/a><\/figure>/);
});

test("::: full images are not wrapped in markdown either", () => {
  assert.doesNotMatch(render("::: full\n![One](a.webp)\n:::\n"), /class="zoom"/);
});

// ---- zoomHref / zoomPlugin units ----

const el = (tag, attrs = {}, content = []) => ({ tag, attrs, content });
const anchor = (...content) => el("a", { class: "zoom" }, content);

test("zoomHref picks the last webp candidate of the first source", () => {
  const a = anchor(
    el("picture", {}, [
      el("source", { type: "image/webp", srcset: "/img/x-480.webp 480w, /img/x-960.webp 960w, /img/x-1600.webp 1600w" }),
      el("img", { src: "/img/x-1600.jpeg", width: "1600", height: "900", srcset: "/img/x-480.jpeg 480w" }),
    ])
  );
  const hit = zoomHref(a);
  assert.equal(hit.href, "/img/x-1600.webp");
  assert.equal(hit.img.attrs.width, "1600");
});

test("zoomHref keeps a gif and falls back to the img src without a source", () => {
  const gif = anchor(
    el("picture", {}, [
      el("source", { type: "image/webp", srcset: "/img/g-64.webp 64w" }),
      el("img", { src: "/img/g-64.gif", srcset: "/img/g-32.gif 32w, /img/g-64.gif 64w", width: "64", height: "48" }),
    ])
  );
  assert.equal(zoomHref(gif).href, "/img/g-64.gif");
  const gifNoSet = anchor(el("img", { src: "/img/g-64.gif", width: "64", height: "48" }));
  assert.equal(zoomHref(gifNoSet).href, "/img/g-64.gif");
  const svg = anchor(el("img", { src: "/img/l.svg", width: "100", height: "100" }));
  assert.equal(zoomHref(svg).href, "/img/l.svg");
  assert.equal(zoomHref(anchor(el("span", {}, ["text"]))), null);
});

test("zoomPlugin unwraps an anchor with no image and drops the hidden suffix", () => {
  const span = el("span", { class: "visually-hidden" }, [" (full size)"]);
  const a = anchor("kept", span);
  const tree = { match(pattern, fn) { this.result = fn(a); } };
  zoomPlugin()(tree);
  assert.equal(tree.result.tag, false);
  assert.deepEqual(tree.result.content, ["kept"]);
});

test("zoomPlugin sets href, data-width and data-height on a finished anchor", () => {
  const a = anchor(el("img", { src: "/img/l.svg", width: "100", height: "80" }));
  const tree = { match(pattern, fn) { this.result = fn(a); } };
  zoomPlugin()(tree);
  assert.equal(tree.result.attrs.href, "/img/l.svg");
  assert.equal(tree.result.attrs["data-width"], "100");
  assert.equal(tree.result.attrs["data-height"], "80");
});
