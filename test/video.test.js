import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import sharp from "sharp";
import { installBlocks } from "../lib/blocks.js";
import { refreshAssets } from "../lib/assets.js";
import { POSTER_WIDTH } from "../lib/media.js";
import { VIDEO_MAX_BYTES } from "../lib/limits.js";
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

// ---------------------------------------------------------------------------
// Task 2: posters, every error, full, reserved slug
// ---------------------------------------------------------------------------

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "video-"));
const tmpAssets = path.join(tmp, "assets");
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

let ready;
async function setupAssets() {
  if (ready) return ready;
  ready = (async () => {
    fs.mkdirSync(tmpAssets, { recursive: true });
    fs.writeFileSync(path.join(tmpAssets, "clip.mp4"), CLIP);
    fs.writeFileSync(path.join(tmpAssets, "clip.mov"), CLIP);
    fs.writeFileSync(path.join(tmpAssets, "big.mp4"), Buffer.alloc(51 * 1024 * 1024));
    fs.writeFileSync(path.join(tmpAssets, "notes.txt"), "hello");
    await sharp({ create: { width: 2000, height: 1000, channels: 3, background: { r: 0, g: 128, b: 255 } } })
      .webp({ lossless: true })
      .toFile(path.join(tmpAssets, "crab.webp"));
    await refreshAssets(tmpAssets);
  })();
  return ready;
}

let n = 0;
async function render(body) {
  await setupAssets();
  const file = path.join(tmp, `case-${n++}.md`);
  fs.writeFileSync(file, body);
  const md = new MarkdownIt();
  installBlocks(md);
  return { file, html: () => md.render(body, { page: { inputPath: file } }) };
}

async function fails(body, line, message) {
  const { file, html } = await render(body);
  assert.throws(html, (err) => {
    assert.equal(err.message, `${file}:${line}: ${message}`);
    return true;
  });
}

test("a missing video fails with the not-found copy at the fence line", async () => {
  await fails('::: video ../../assets/nope.mp4 "T"\n:::\n', 1, "video not found in assets/: ../../assets/nope.mp4");
});

test("a non-.mp4/.webm video fails naming the file", async () => {
  await fails(
    '::: video ../../assets/clip.mov "T"\n:::\n',
    1,
    "video clip.mov must be .mp4 or .webm (export it in one of those formats)."
  );
});

test("a video over 50 MB fails with its size", async () => {
  assert.equal(VIDEO_MAX_BYTES, 50 * 1024 * 1024);
  await fails('::: video ../../assets/big.mp4 "T"\n:::\n', 1, "video big.mp4 is 51.0 MB; the limit is 50 MB.");
});

test("a file video without a title fails with the title copy", async () => {
  await fails('::: video ../../assets/clip.mp4\n:::\n', 1, 'video block needs a quoted title: ::: video <url> "Title"');
});

test("a missing poster fails with the poster-not-found copy", async () => {
  await fails(
    '::: video ../../assets/clip.mp4 "T" poster=../../assets/missing.webp\n:::\n',
    1,
    "poster not found in assets/: ../../assets/missing.webp"
  );
});

test("a non-image poster fails with the must-be-an-image copy", async () => {
  await fails(
    '::: video ../../assets/clip.mp4 "T" poster=../../assets/notes.txt\n:::\n',
    1,
    "poster notes.txt must be an image (.webp, .png, .jpg, .jpeg, .avif or .gif)."
  );
});

test("poster= on a URL target is still an unexpected token", async () => {
  const { file, html } = await render('::: video https://youtu.be/dQw4w9WgXcQ "T" poster=x.webp\n:::\n');
  assert.throws(html, (err) => {
    assert.ok(err.message.startsWith(`${file}:1: unexpected "poster=x.webp" in video block.`), err.message);
    return true;
  });
});

test("any other extra token on a file video is unexpected and shows the new usage", async () => {
  const { file, html } = await render('::: video ../../assets/clip.mp4 "T" extra\n:::\n');
  assert.throws(html, (err) => {
    assert.equal(
      err.message,
      `${file}:1: unexpected "extra" in video block. Use: ::: video [full] <url-or-assets-file> "Title" [poster=<assets-image>]`
    );
    return true;
  });
});

test("full gives the edge-to-edge embed class", async () => {
  const { html } = await render('::: video full ../../assets/clip.mp4 "T"\n:::\n');
  assert.match(html(), /<div class="embed full"><video controls=""/);
});

test("titles are escaped in aria-label and the fallback link", async () => {
  const { html } = await render('::: video ../../assets/clip.mp4 "A <b> & \'q\'"\n:::\n');
  const out = html();
  assert.ok(out.includes('aria-label="A &lt;b&gt; &amp; \'q\'"'), out);
  assert.ok(out.includes('Download "A &lt;b&gt; &amp; \'q\'"'), out);
});

// G-02-4 / D-07: a poster block gets a plain src; a no-poster block keeps the iOS first-frame fragment.
const videoTag = (out) => out.match(/<video[^>]*>/)[0];

test("poster block: plain src with the poster attribute and no #t= fragment", async () => {
  const { html } = await render('::: video ../../assets/clip.mp4 "T" poster=../../assets/crab.webp\n:::\n');
  const out = html();
  assert.match(
    out,
    /<div class="embed"><video controls="" preload="metadata" src="\/video\/clip\.mp4" poster="\/video\/crab-[0-9a-f]{8}\.webp" aria-label="T">/
  );
  assert.doesNotMatch(videoTag(out), /#t=/);
});

test("poster + full + escaped title: plain src, full class, escaped label and link", async () => {
  const { html } = await render(
    '::: video full ../../assets/clip.mp4 "A <b> & \'q\'" poster=../../assets/crab.webp\n:::\n'
  );
  const out = html();
  assert.match(
    out,
    /<div class="embed full"><video controls="" preload="metadata" src="\/video\/clip\.mp4" poster="\/video\/crab-[0-9a-f]{8}\.webp" aria-label="A &lt;b&gt; &amp; 'q'">/
  );
  assert.ok(out.includes('<a href="/video/clip.mp4">Download "A &lt;b&gt; &amp; \'q\'"</a>'), out);
  assert.doesNotMatch(videoTag(out), /#t=/);
});

test("no-poster block keeps the #t=0.001 first-frame fragment and has no poster attribute", async () => {
  const { html } = await render('::: video ../../assets/clip.mp4 "T"\n:::\n');
  const out = html();
  assert.ok(
    out.includes('<div class="embed"><video controls="" preload="metadata" src="/video/clip.mp4#t=0.001" aria-label="T">'),
    out
  );
  assert.doesNotMatch(videoTag(out), /poster=/);
});

test("no-poster full block keeps the #t=0.001 fragment", async () => {
  const { html } = await render('::: video full ../../assets/clip.mp4 "T"\n:::\n');
  assert.ok(
    html().includes(
      '<div class="embed full"><video controls="" preload="metadata" src="/video/clip.mp4#t=0.001" aria-label="T">'
    )
  );
});

test("full build: a poster is published as a processed WebP no wider than 1600px", async () => {
  const prefix = defaultPrefix();
  const site = await makeSite({
    files: { "content/projects/movie.md": movie(" poster=../../assets/crab.webp") },
    assets: {
      "a.webp": { width: 1200, height: 800, format: "webp" },
      "clip.mp4": CLIP,
      "crab.webp": { width: 2000, height: 1000, format: "webp" },
    },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/movie/index.html");
  // G-02-4: a poster block must carry a plain src (no #t= media fragment), or the browser seeks
  // on load and shows the video frame instead of the poster.
  const m = html.match(
    new RegExp(
      `<video controls="" preload="metadata" src="${prefix}video/clip\\.mp4" poster="${prefix}video/(crab-[0-9a-f]{8}\\.webp)" aria-label="Crab walk loop">`
    )
  );
  assert.ok(m, html);
  assert.doesNotMatch(html.match(/<video[^>]*>/)[0], /#t=/);
  assert.ok(html.includes(`<a href="${prefix}video/clip.mp4">`), html);
  const file = path.join(site.dir, "_site/video", m[1]);
  assert.ok(fs.existsSync(file), file);
  const meta = await sharp(file).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, POSTER_WIDTH);
  assert.equal(site.exists("_site/video/crab.webp"), false, "poster original must not be copied");
  assert.equal(site.exists("_site/assets"), false);
  assert.doesNotMatch(html.match(/<video[^>]*>/)[0], /\s(autoplay|loop|muted)(?==|\s|>)/);
});

test("full build: a project with slug: video fails because the slug is reserved", async () => {
  const site = await makeSite({
    files: { "content/projects/movie.md": movie().replace("tags:", "slug: video\ntags:") },
    assets: { "a.webp": { width: 1200, height: 800, format: "webp" }, "clip.mp4": CLIP },
  });
  sites.push(site);
  const r = site.build();
  assert.notEqual(r.code, 0);
  assert.match(r.output, /slug "video" is reserved/);
});
