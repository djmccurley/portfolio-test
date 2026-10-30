import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeSite, defaultPrefix } from "./helpers/site.js";
import { VIDEO_EXTS } from "../lib/limits.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function htmlFiles(site) {
  return site.walk("_site").filter((f) => f.endsWith(".html"));
}

function urlsIn(html) {
  const urls = [];
  for (const m of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/\bsrcset="([^"]*)"/g)) {
    for (const part of m[1].split(",")) urls.push(part.trim().split(/\s+/)[0]);
  }
  return urls;
}

const project = (title, body, date = '"2024-01-01"') => `---
title: ${title}
date: ${date}
tags: [games]
cover: ../../assets/a.webp
cover_alt: Cover
---

${body}
`;

const img = { width: 1200, height: 700, format: "webp" };

test("project page builds", async () => {
  const site = await makeSite({ useRepoContent: true });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    const html = site.read("_site/tidepool-game/index.html");
    assert.match(html, /<picture/);
    assert.match(html, /type="image\/webp"/);
    assert.match(html, /480w/);
    // The widest image carries the responsive attributes (a 308px source has no srcset to size).
    const widthOf = (t) => Number(t.match(/ width="(\d+)"/)?.[1] ?? 0);
    const imgTag = html.match(/<img[^>]*>/g).sort((a, b) => widthOf(b) - widthOf(a))[0];
    assert.ok(imgTag, "img with width");
    assert.match(imgTag, /height=/);
    assert.match(imgTag, /decoding="async"/);
    assert.match(imgTag, /sizes=/);
  } finally {
    site.cleanup();
  }
});

test("first image eager, rest lazy", async () => {
  const site = await makeSite({
    assets: { "a.webp": img, "b.webp": img },
    files: {
      "content/projects/two.md": project("Two", "![A](../../assets/a.webp)\n\n![B](../../assets/b.webp)"),
    },
  });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    const imgs = site.read("_site/two/index.html").match(/<img[^>]*>/g);
    assert.equal(imgs.length, 2);
    assert.match(imgs[0], /loading="eager"/);
    assert.match(imgs[0], /fetchpriority="high"/);
    assert.match(imgs[1], /loading="lazy"/);
  } finally {
    site.cleanup();
  }
});

test("originals not published", async () => {
  const site = await makeSite({ useRepoContent: true });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    assert.equal(site.exists("_site/assets"), false);
    const originals = new Set(fs.readdirSync(path.join(site.dir, "assets")));
    assert.ok(originals.size > 0);
    const videoDir = path.join(site.dir, "_site", "video");
    for (const f of site.walk("_site")) {
      // Videos are published as-is by design (D-07); posters are always hashed derivatives, never originals.
      if (path.dirname(f) === videoDir && VIDEO_EXTS.has(path.extname(f).toLowerCase())) continue;
      assert.ok(!originals.has(path.basename(f)), `${f} is an original`);
    }
    assert.ok(site.walk("_site/img").some((f) => f.endsWith(".webp")));
  } finally {
    site.cleanup();
  }
});

test("default prefix", async () => {
  const prefix = defaultPrefix();
  const site = await makeSite({ useRepoContent: true });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    assert.ok(site.exists("_site/style.css"));
    for (const f of htmlFiles(site)) {
      for (const u of urlsIn(fs.readFileSync(f, "utf8"))) {
        if (u.startsWith("/")) assert.ok(u.startsWith(prefix), `${f}: ${u} lacks ${prefix}`);
      }
    }
    assert.ok(site.read("_site/tidepool-game/index.html").includes(`href="${prefix}style.css"`));
  } finally {
    site.cleanup();
  }
});

test("root prefix", async () => {
  const prefix = defaultPrefix();
  const site = await makeSite({ useRepoContent: true, prefix: "/" });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    for (const f of htmlFiles(site)) {
      assert.ok(!fs.readFileSync(f, "utf8").includes(prefix), `${f} contains ${prefix}`);
    }
    assert.ok(site.read("_site/tidepool-game/index.html").includes('href="/style.css"'));
  } finally {
    site.cleanup();
  }
});

test("unquoted year", async () => {
  const site = await makeSite({
    assets: { "a.webp": img },
    files: { "content/projects/yr.md": project("Year", "![A](../../assets/a.webp)", "2024") },
  });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    const html = site.read("_site/yr/index.html");
    assert.match(html, />\s*2024\s*</);
    assert.ok(!html.includes("2024-01-01"));
    assert.ok(!/Jan/.test(html));
  } finally {
    site.cleanup();
  }
});

test("missing image fails with file name", async () => {
  const site = await makeSite({
    assets: { "a.webp": img },
    files: { "content/projects/bad.md": project("Bad", "![X](../../assets/nope.webp)") },
  });
  try {
    const r = site.build();
    assert.notEqual(r.code, 0);
    assert.match(r.output, /content\/projects\/bad\.md/);
    assert.match(r.output, /nope\.webp/);
  } finally {
    site.cleanup();
  }
});
