import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { installBlocks } from "../lib/blocks.js";
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
