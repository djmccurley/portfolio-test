import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { installBlocks } from "../lib/blocks.js";
import { videoEmbedSrc, parseFenceArgs, escapeAttr } from "../lib/embeds.js";
import { makeSite } from "./helpers/site.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "embeds-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

let n = 0;
function render(body) {
  const file = path.join(tmp, `case-${n++}.md`);
  fs.writeFileSync(file, body);
  const md = new MarkdownIt();
  installBlocks(md);
  return { file, html: () => md.render(body, { page: { inputPath: file } }) };
}

// Asserts the render throws exactly `${file}:${line}: ${message}`.
function fails(body, line, message) {
  const { file, html } = render(body);
  assert.throws(html, (err) => {
    assert.equal(err.message, `${file}:${line}: ${message}`);
    return true;
  });
}

const front = `---
title: Video
date: "2024-01-01"
tags: [games]
cover: ../../assets/a.webp
cover_alt: Cover
---
`;

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const YT =
  '<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="Tidepool trailer" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen="" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';

// ---------------------------------------------------------------------------
// Tracer: YouTube link to privacy iframe on the built page
// ---------------------------------------------------------------------------

test("full build: a youtu.be link becomes the privacy iframe, no paragraph, no script", async () => {
  const site = await makeSite({
    files: {
      "content/projects/vid.md": `${front}
::: video https://youtu.be/dQw4w9WgXcQ "Tidepool trailer"
:::
`,
    },
    assets: { "a.webp": { width: 1200, height: 800, format: "webp" } },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/vid/index.html");
  assert.ok(html.includes(YT), html);
  assert.doesNotMatch(html, /<p>\s*<div class="embed"/);
  assert.doesNotMatch(html, /<script/);
});

test("a video block without a quoted title fails at the fence line", () => {
  fails(
    'Intro.\n\n::: video https://youtu.be/dQw4w9WgXcQ\n:::\n',
    3,
    'video block needs a quoted title: ::: video <url> "Title"'
  );
});

test("a look-alike host fails with the not-recognised message quoting the URL", () => {
  const url = "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ";
  fails(
    `::: video ${url} "X"\n:::\n`,
    1,
    `video URL not recognised: ${url}. Use a youtube.com, youtu.be or vimeo.com link, or a file in assets/.`
  );
});

// ---------------------------------------------------------------------------
// Task 2: URL variants, Vimeo, itch, full, escaping, errors
// ---------------------------------------------------------------------------

const ID = "dQw4w9WgXcQ";
const NOCOOKIE = `https://www.youtube-nocookie.com/embed/${ID}`;

test("every YouTube URL shape maps to the nocookie embed", () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${ID}&t=10s`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `http://youtu.be/${ID}`,
  ]) {
    assert.equal(videoEmbedSrc(url), NOCOOKIE, url);
  }
});

test("Vimeo URLs map to the player with dnt=1 and keep an unlisted hash", () => {
  const plain = "https://player.vimeo.com/video/123456789?dnt=1";
  assert.equal(videoEmbedSrc("https://vimeo.com/123456789"), plain);
  assert.equal(videoEmbedSrc("https://player.vimeo.com/video/123456789"), plain);
  const hashed = "https://player.vimeo.com/video/123456789?h=abcdef1234&dnt=1";
  assert.equal(videoEmbedSrc("https://vimeo.com/123456789/abcdef1234"), hashed);
  assert.equal(videoEmbedSrc("https://vimeo.com/123456789?h=abcdef1234"), hashed);
});

test("hostile or malformed video URLs return null", () => {
  for (const url of [
    `https://youtube.com.evil.com/watch?v=${ID}`,
    `https://evil.com/youtu.be/${ID}`,
    "javascript:alert(1)",
    "https://youtube.com/watch?v=short",
    "https://vimeo.com/channels/staffpicks",
    "https://vimeo.com/123456789?h=<script>",
    "not a url",
  ]) {
    assert.equal(videoEmbedSrc(url), null, url);
  }
});

test("parseFenceArgs splits bare words and quoted strings", () => {
  assert.deepEqual(parseFenceArgs('full https://a.b "Two words" x'), [
    { value: "full", quoted: false },
    { value: "https://a.b", quoted: false },
    { value: "Two words", quoted: true },
    { value: "x", quoted: false },
  ]);
});

test("escapeAttr escapes & < > and quotes", () => {
  assert.equal(escapeAttr('a&b<c>"d'), "a&amp;b&lt;c&gt;&quot;d");
});

test("video full adds the full class and Vimeo hashes are escaped in the attribute", () => {
  const a = render('::: video full https://vimeo.com/123456789 "Reel"\n:::\n').html();
  assert.match(a, /<div class="embed full"><iframe src="https:\/\/player\.vimeo\.com\/video\/123456789\?dnt=1"/);
  const b = render('::: video https://vimeo.com/123456789/abcdef1234 "Reel"\n:::\n').html();
  assert.ok(b.includes('src="https://player.vimeo.com/video/123456789?h=abcdef1234&amp;dnt=1"'), b);
});

const ITCH_EMBED = "https://itch.io/embed-upload/1234567?color=333333&x=1";
const ITCH_PAGE = "https://dmc.itch.io/tidepool";
const ITCH_OPEN = `::: itch ${ITCH_EMBED} 640x380 "Tidepool" ${ITCH_PAGE}\n:::\n`;
const ITCH_NEEDS = 'itch block needs: ::: itch <embed-url> <W>x<H> "Title" <itch-page-url>';

test("itch renders a titled lazy iframe and a visible play link", () => {
  const out = render(ITCH_OPEN).html();
  assert.equal(
    out,
    '<div class="embed itch" style="--w:640;--h:380"><iframe src="https://itch.io/embed-upload/1234567?color=333333&amp;x=1" title="Tidepool" loading="lazy" allow="fullscreen" allowfullscreen=""></iframe></div>\n' +
      '<p class="embed-link"><a href="https://dmc.itch.io/tidepool">Play on itch.io<span class="visually-hidden">: Tidepool</span></a></p>\n'
  );
});

test("itch full adds the class and html.itch.zone embeds are accepted", () => {
  const a = render(`::: itch full ${ITCH_EMBED} 640x380 "T" ${ITCH_PAGE}\n:::\n`).html();
  assert.match(a, /<div class="embed itch full" style="--w:640;--h:380">/);
  const b = render(`::: itch https://html.itch.zone/html/123/index.html 640x380 "T" ${ITCH_PAGE}\n:::\n`).html();
  assert.match(b, /src="https:\/\/html\.itch\.zone\/html\/123\/index\.html"/);
});

test("itch argument mistakes fail with the needs copy at the fence line", () => {
  for (const args of [
    `${ITCH_EMBED} 640x380 "T"`,
    `${ITCH_EMBED} 640by380 "T" ${ITCH_PAGE}`,
    `${ITCH_EMBED} 640x380 T ${ITCH_PAGE}`,
    `640x380 ${ITCH_EMBED} "T" ${ITCH_PAGE}`,
    `${ITCH_EMBED} 640x380 "T" ${ITCH_PAGE} extra`,
    `${ITCH_EMBED} 640x380 "" ${ITCH_PAGE}`,
    "",
  ]) {
    fails(`Intro.\n\n::: itch ${args}\n:::\n`, 3, ITCH_NEEDS);
  }
});

test("itch embed and page hosts are allow-listed", () => {
  fails(
    `::: itch http://itch.io/embed-upload/1 640x380 "T" ${ITCH_PAGE}\n:::\n`,
    1,
    'itch embed URL host "itch.io" is not allowed. Copy the iframe src from the game\'s itch.io "Embed game" page (allowed: itch.io, *.itch.io, *.itch.zone; widen ITCH_EMBED_SUFFIXES in lib/embeds.js if itch changes it).'
  );
  fails(
    `::: itch https://evil.com/embed 640x380 "T" ${ITCH_PAGE}\n:::\n`,
    1,
    'itch embed URL host "evil.com" is not allowed. Copy the iframe src from the game\'s itch.io "Embed game" page (allowed: itch.io, *.itch.io, *.itch.zone; widen ITCH_EMBED_SUFFIXES in lib/embeds.js if itch changes it).'
  );
  fails(
    `::: itch ${ITCH_EMBED} 640x380 "T" https://evil.com/game\n:::\n`,
    1,
    "itch page URL must be an https link on itch.io: https://evil.com/game"
  );
  fails(
    `::: itch https://evilitch.io/embed 640x380 "T" ${ITCH_PAGE}\n:::\n`,
    1,
    'itch embed URL host "evilitch.io" is not allowed. Copy the iframe src from the game\'s itch.io "Embed game" page (allowed: itch.io, *.itch.io, *.itch.zone; widen ITCH_EMBED_SUFFIXES in lib/embeds.js if itch changes it).'
  );
});

test("titles are HTML-escaped in attributes and text nodes", () => {
  const v = render('::: video https://youtu.be/dQw4w9WgXcQ "Crabs <b> & friends"\n:::\n').html();
  assert.ok(v.includes('title="Crabs &lt;b&gt; &amp; friends"'), v);
  const i = render(`::: itch ${ITCH_EMBED} 640x380 "Crabs <b> & friends" ${ITCH_PAGE}\n:::\n`).html();
  assert.ok(i.includes('title="Crabs &lt;b&gt; &amp; friends"'), i);
  assert.ok(i.includes('<span class="visually-hidden">: Crabs &lt;b&gt; &amp; friends</span>'), i);
});

test("a title cannot break out of its attribute", () => {
  const out = render('::: video https://youtu.be/dQw4w9WgXcQ "x"\n:::\n').html();
  assert.doesNotMatch(out, /onload/);
  fails(
    '::: video https://youtu.be/dQw4w9WgXcQ "a" onload=alert(1)\n:::\n',
    1,
    'unexpected "onload=alert(1)" in video block. Use: ::: video [full] <url-or-assets-file> "Title" [poster=<assets-image>]'
  );
});

test("embed blocks take no content", () => {
  fails(
    'Intro.\n\n::: video https://youtu.be/dQw4w9WgXcQ "T"\nsome text\n:::\n',
    3,
    'block "::: video" takes no content. Put ":::" on the line right after the fence.'
  );
  fails(
    `::: itch ${ITCH_EMBED} 640x380 "T" ${ITCH_PAGE}\n![a](x.webp)\n:::\n`,
    1,
    'block "::: itch" takes no content. Put ":::" on the line right after the fence.'
  );
});

test("the unknown-block list names video and itch", () => {
  fails(
    "::: grid-5\n![a](x.webp)\n:::\n",
    1,
    'unknown block "::: grid-5". Valid blocks: grid-2, grid-3, grid-4, full, video, itch.'
  );
});

test("an unexpected extra token in a video block is named", () => {
  fails(
    '::: video https://youtu.be/dQw4w9WgXcQ "T" poster=x.webp\n:::\n',
    1,
    'unexpected "poster=x.webp" in video block. Use: ::: video [full] <url-or-assets-file> "Title" [poster=<assets-image>]'
  );
});

test("full build: YouTube, full-width Vimeo and itch blocks keep absolute URLs and add no script", async () => {
  const site = await makeSite({
    files: {
      "content/projects/many.md": `${front}
::: video https://youtu.be/${ID} "Trailer"
:::

::: video full https://vimeo.com/123456789 "Reel"
:::

::: itch ${ITCH_EMBED} 640x380 "Tidepool" ${ITCH_PAGE}
:::
`,
    },
    assets: { "a.webp": { width: 1200, height: 800, format: "webp" } },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/many/index.html");
  assert.ok(html.includes(`src="${NOCOOKIE}"`), html);
  assert.ok(html.includes('<div class="embed full"><iframe src="https://player.vimeo.com/video/123456789?dnt=1"'), html);
  assert.ok(html.includes('src="https://itch.io/embed-upload/1234567?color=333333&amp;x=1"'), html);
  assert.ok(html.includes('<a href="https://dmc.itch.io/tidepool">Play on itch.io'), html);
  assert.doesNotMatch(html, /<script/);
});
