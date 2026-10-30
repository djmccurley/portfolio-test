import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_CSS = fs.readFileSync(path.join(ROOT, "content", "style.css"), "utf8");
const CSS = RAW_CSS.replace(/\/\*[\s\S]*?\*\//g, "");

// Remove one @media block (balanced braces) from css.
function stripMedia(css, headPattern) {
  const m = headPattern.exec(css);
  if (!m) return css;
  let depth = 0;
  let i = css.indexOf("{", m.index);
  const start = m.index;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) break;
  }
  return css.slice(0, start) + css.slice(i + 1);
}

// Body of the first rule whose selector list matches `selector` exactly (after whitespace squash).
function rule(css, selector) {
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    if (norm(m[1]) === norm(selector)) return m[2];
  }
  return null;
}

const prefix = defaultPrefix();
let site;

before(async () => {
  site = await makeSite({
    files: {
      "content/projects/shell.md":
        '---\ntitle: Shell\ndate: "2024-01-01"\ntags: [games]\ncover: ../../assets/fixture.webp\ncover_alt: Cover\n---\n\nBody text.\n',
      "content/pages/blank.md": "---\ntitle: Blank\n---\n",
    },
    assets: { "fixture.webp": { width: 400, height: 300, format: "webp" } },
  });
  const r = site.build();
  assert.equal(r.code, 0, r.output);
});

after(() => site?.cleanup());

const PAGES = ["_site/shell/index.html", "_site/blank/index.html", "_site/404.html", "_site/index.html"];

test("every page starts with the skip link and has the #main target", () => {
  for (const p of PAGES) {
    const html = site.read(p);
    const body = html.slice(html.indexOf("<body>") + "<body>".length).trimStart();
    assert.ok(
      body.startsWith('<a class="skip-link" href="#main">Skip to main content</a>'),
      `${p}: skip link is not the first element in body`
    );
    assert.ok(html.includes('<main id="main" tabindex="-1">'), `${p}: missing main#main`);
  }
});

test("head loads Chivo from Google Fonts before the stylesheet", () => {
  for (const p of PAGES) {
    const html = site.read(p);
    assert.ok(html.includes('<link rel="preconnect" href="https://fonts.googleapis.com">'), p);
    assert.match(html, /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin(="")?>/, p);
    const fonts = html.indexOf("family=Chivo:ital,wght@0,100..900;1,100..900");
    assert.ok(fonts > 0, `${p}: Chivo link missing`);
    assert.ok(html.includes("display=swap"), p);
    const own = html.indexOf(`href="${prefix}style.css"`);
    assert.ok(own > fonts, `${p}: style.css must come after the fonts link`);
  }
});

test("no page contains a script or a referrer meta tag", () => {
  for (const p of site.walk("_site").filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(p, "utf8");
    assert.ok(!html.includes("<script"), `${p} contains <script`);
    assert.ok(!html.includes('name="referrer"'), `${p} contains a referrer meta`);
  }
});

test("style.css declares the design tokens", () => {
  const root = rule(CSS, ":root");
  assert.ok(root, ":root block missing");
  const want = {
    "--paper": "#fff",
    "--ink": "#000",
    "--accent": "#0000ee",
    "--page-margin": "clamp(1rem, 5vw, 4rem)",
    "--column-max": "80rem",
    "--measure": "40rem",
    "--grid-gap": "1rem",
    "--block-gap": "2rem",
  };
  for (const [k, v] of Object.entries(want)) {
    assert.ok(root.includes(`${k}: ${v}`), `${k}: ${v} missing`);
  }
  assert.match(root, /--font:\s*"Chivo",\s*system-ui/);
  assert.match(root, /color-scheme:\s*light/);
});

test("focus ring, skip link and reduced-motion guard", () => {
  assert.match(CSS, /:focus-visible\s*{[^}]*outline:\s*3px solid var\(--accent\)/);
  assert.match(CSS, /:focus-visible\s*{[^}]*outline-offset:\s*3px/);
  assert.match(CSS, /main:focus\s*{\s*outline:\s*none/);
  const skip = [...CSS.matchAll(/([^{}]*\.skip-link[^{}]*)\{([^{}]*)\}/g)].map((m) => m[2]).join("\n");
  assert.ok(skip.length > 0, ".skip-link rules missing");
  assert.ok(!/display:\s*none|visibility:\s*hidden/.test(skip), "skip link must stay in the tab order");
  assert.match(CSS, /@media \(prefers-reduced-motion: reduce\)/);
});

test("no motion outside the reduced-motion guard", () => {
  const outside = stripMedia(CSS, /@media \(prefers-reduced-motion: reduce\)/);
  assert.ok(!/transition/.test(outside), "transition found");
  assert.ok(!/animation/.test(outside), "animation found");
  assert.ok(!/scroll-behavior:\s*smooth/.test(outside), "smooth scroll found");
});
