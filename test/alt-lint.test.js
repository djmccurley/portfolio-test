import test, { after, mock } from "node:test";
import assert from "node:assert/strict";
import { altIssue, lintRawHtml, resetAltWarnings } from "../lib/alt-lint.js";
import { makeSite } from "./helpers/site.js";

const front = `---
title: Alts
date: "2024-01-01"
tags: [games]
cover: ../../assets/a.webp
cover_alt: Cover
---
`;

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

test("altIssue flags the VS Code paste default, any case and padding", () => {
  assert.equal(altIssue("alt text", "x.webp"), "paste-default");
  assert.equal(altIssue("  Alt Text ", "x.webp"), "paste-default");
});

test("altIssue accepts a real description", () => {
  assert.equal(altIssue("A crab on a rock", "x.webp"), null);
});

test("a pasted image with the default alt warns once, names file and path, and the build still passes", async () => {
  const site = await makeSite({
    files: { "content/projects/alts.md": `${front}\n![alt text](../../assets/a.webp)\n` },
    assets: { "a.webp": { width: 800, height: 600, format: "webp" } },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const line =
    'WARN ./content/projects/alts.md: image ../../assets/a.webp still has the paste placeholder alt "alt text". Replace it with a description.';
  const hits = r.output.split("\n").filter((l) => l === line);
  assert.equal(hits.length, 1, r.output);
  assert.match(site.read("_site/alts/index.html"), /alt="alt text"/);
});

test("altIssue: empty and whitespace-only alt", () => {
  assert.equal(altIssue("", "x.webp"), "empty");
  assert.equal(altIssue("   ", "x.webp"), "empty");
});

test("altIssue: camera, screenshot and extension alts look like filenames", () => {
  for (const alt of [
    "IMG_1234",
    "img-1234",
    "DSC-0042",
    "PXL_20261001_123456",
    "Screenshot 2026-10-01 at 10.00.00",
    "screenshot-2026-10-01",
    "photo.png",
    "crab.WEBP",
  ]) {
    assert.equal(altIssue(alt, "x.webp"), "filename", alt);
  }
});

test("altIssue: alt equal to the basename or stem of the src, case-insensitive and percent-decoded", () => {
  assert.equal(altIssue("tidepool-game-image", "../../assets/tidepool-game-image.webp"), "filename");
  assert.equal(altIssue("my shot", "../../assets/My%20Shot.webp"), "filename");
  assert.equal(altIssue("My Shot.webp", "../../assets/My%20Shot.webp?v=2"), "filename");
  assert.equal(altIssue("my shot", "../../assets/bad%E0%A4%A.webp"), null);
});

test("altIssue: NFC normalisation on both sides", () => {
  const decomposed = "Cafe\u0301";
  assert.equal(altIssue(decomposed, "../../assets/Caf%C3%A9.webp"), "filename");
});

test("altIssue: real sentences and non-ASCII text do not warn", () => {
  for (const alt of ["A hermit crab in a shell", "Image 3 of the set", "Caf\u00e9 terrace at night", "\u6771\u4eac\u306e\u591c\u666f"]) {
    assert.equal(altIssue(alt, "../../assets/a.webp"), null, alt);
  }
});

function capture(fn) {
  const warn = mock.method(console, "warn", () => {});
  try {
    resetAltWarnings();
    fn();
    return warn.mock.calls.map((c) => c.arguments.join(" "));
  } finally {
    warn.mock.restore();
  }
}

test("lintRawHtml: missing alt warns empty, alt=\"\" is decorative, quotes styles are read", () => {
  assert.equal(capture(() => lintRawHtml("f.md", '<img src="a.webp">')).length, 1);
  assert.match(capture(() => lintRawHtml("f.md", '<img src="a.webp">'))[0], /has empty alt text/);
  assert.deepEqual(capture(() => lintRawHtml("f.md", '<img src="a.webp" alt="">')), []);
  assert.deepEqual(capture(() => lintRawHtml("f.md", "<img src='a.webp' alt=''>")), []);
  assert.match(capture(() => lintRawHtml("f.md", '<img alt="IMG_1234" src="a.webp">'))[0], /looks like a filename \("IMG_1234"\)/);
  assert.match(capture(() => lintRawHtml("f.md", "<img src='a.webp' alt='alt text'>"))[0], /paste placeholder/);
  assert.match(capture(() => lintRawHtml("f.md", "<IMG SRC=a.webp ALT=DSC-0042>"))[0], /looks like a filename \("DSC-0042"\)/);
  assert.deepEqual(capture(() => lintRawHtml("f.md", '<img src="a.webp" alt="A crab"> <img data-alt="x" src="b.webp" alt="Pool">')), []);
});

const lintMd = (long) => `${front}
![](../../assets/a.webp)

![](../../assets/b.webp){decorative}

::: grid-2
![](../../assets/b.webp){decorative}
![IMG_1234](../../assets/d.webp)
:::

![alt text](../../assets/f.webp)

![alt text](../../assets/f.webp)

<img src="../../assets/c.webp">

![${long}](../../assets/e.webp)
`;

test("build: every alt rule warns once on its own line, decorative is silent, exit 0, HTML untouched", async () => {
  const long = `IMG_${"1".repeat(176)}`;
  assert.equal(long.length, 180);
  const asset = { width: 400, height: 300, format: "webp" };
  const site = await makeSite({
    files: { "content/projects/lint.md": lintMd(long) },
    assets: { "a.webp": asset, "b.webp": asset, "c.webp": asset, "d.webp": asset, "e.webp": asset, "f.webp": asset },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const warns = r.output.split("\n").filter((l) => l.includes("WARN "));
  assert.ok(warns.every((l) => l.startsWith("WARN ")), "each WARN starts its own line");
  const f = "./content/projects/lint.md";
  assert.deepEqual(warns.sort(), [
    `WARN ${f}: image ../../assets/a.webp has empty alt text. Describe it, or add {decorative} if it is purely visual.`,
    `WARN ${f}: image ../../assets/c.webp has empty alt text. Describe it, or add {decorative} if it is purely visual.`,
    `WARN ${f}: image ../../assets/d.webp has alt text that looks like a filename ("IMG_1234"). Describe what the image shows.`,
    `WARN ${f}: image ../../assets/e.webp has alt text that looks like a filename ("${long}"). Describe what the image shows.`,
    `WARN ${f}: image ../../assets/f.webp still has the paste placeholder alt "alt text". Replace it with a description.`,
  ].sort());
  assert.ok(!r.output.includes("b.webp has"), "decorative b.webp is silent");
  const html = site.read("_site/lint/index.html");
  assert.match(html, /alt="alt text"/);
  assert.match(html, /alt="IMG_1234"/);
});

test("repo content builds with zero WARN lines and shows the grid, caption and full demo", async () => {
  const site = await makeSite({ useRepoContent: true });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  assert.doesNotMatch(r.output, /^WARN /m);
  const html = site.read("_site/tidepool-game/index.html");
  assert.match(html, /class="layout grid-2"/);
  assert.match(html, /class="layout full"/);
  assert.match(html, /<figcaption>/);
});
