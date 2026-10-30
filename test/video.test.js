import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const front = `---
title: Movie
date: "2024-01-01"
tags: [games]
cover: ../../assets/a.webp
cover_alt: Cover
---
`;

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const CLIP = Buffer.from([0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50, 1, 2, 3, 4, 5, 6, 7, 8]);
const OTHER = Buffer.from([9, 9, 9, 9, 9, 9]);

const movie = (extra = "") => `${front}
::: video ../../assets/clip.mp4 "Crab walk loop"${extra}
:::
`;

const videoMarkup = (prefix) =>
  `<div class="embed"><video controls="" preload="metadata" src="${prefix}video/clip.mp4#t=0.001" aria-label="Crab walk loop">` +
  `<p>Your browser cannot play this video. <a href="${prefix}video/clip.mp4">Download "Crab walk loop"</a></p></video></div>`;

// ---------------------------------------------------------------------------
// Tracer: self-hosted video end to end
// ---------------------------------------------------------------------------

test("full build: a self-hosted video renders a native player under the default prefix and is published", async () => {
  const prefix = defaultPrefix();
  const site = await makeSite({
    files: { "content/projects/movie.md": movie() },
    assets: {
      "a.webp": { width: 1200, height: 800, format: "webp" },
      "clip.mp4": CLIP,
      "other.mp4": OTHER,
    },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/movie/index.html");
  assert.ok(html.includes(videoMarkup(prefix)), html);
  // Check the attributes of the <video> tag (the title "Crab walk loop" legitimately contains "loop").
  const tag = html.match(/<video[^>]*>/)[0];
  assert.doesNotMatch(tag, /\s(autoplay|loop|muted)(?==|\s|>)/);
  assert.doesNotMatch(html, /autoplay|muted/);
  assert.doesNotMatch(html, /<p>\s*<div class="embed"/);
  assert.ok(site.exists("_site/video/clip.mp4"));
  assert.deepEqual(fs.readFileSync(`${site.dir}/_site/video/clip.mp4`), CLIP);
  assert.equal(site.exists("_site/video/other.mp4"), false, "unreferenced video must not be published");
  assert.equal(site.exists("_site/assets"), false, "_site/assets must never exist");
});

test("full build: PATH_PREFIX=/ gives root-relative video URLs", async () => {
  const site = await makeSite({
    prefix: "/",
    files: { "content/projects/movie.md": movie() },
    assets: { "a.webp": { width: 1200, height: 800, format: "webp" }, "clip.mp4": CLIP },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/movie/index.html");
  assert.ok(html.includes(videoMarkup("/")), html);
  assert.ok(html.includes('src="/video/clip.mp4#t=0.001"'));
  assert.ok(site.exists("_site/video/clip.mp4"));
});
