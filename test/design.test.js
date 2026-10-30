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
  // the skip target must out-specify the (0,2,0) ring rule: main[tabindex] adds an attribute and a type
  assert.match(CSS, /main\[tabindex="-1"\]:focus-visible\s*{\s*outline:\s*none/);
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

// ---- Task 2: layout contract ----

test("named-line column grid on main and the header", () => {
  const cols = /grid-template-columns:\s*\[full-start\][^;]*\[content-start\][^;]*\[content-end\][^;]*\[full-end\]/;
  for (const sel of ["main", "body > header", "body > header, main", "main, body > header"]) {
    const body = rule(CSS, sel);
    if (body && cols.test(body.replace(/\s+/g, " "))) {
      assert.ok(body.includes("var(--page-margin)") && body.includes("var(--column-max)"));
      return;
    }
  }
  assert.fail("no rule gives main and body > header the named-line grid");
});

test("full blocks span full-start to full-end, children default to the content column", () => {
  assert.match(CSS, /main\s*>\s*\.full\s*{[^}]*grid-column:\s*full/);
  assert.match(CSS, /main\s*>\s*\*[^{]*{[^}]*grid-column:\s*content/);
  assert.match(CSS, /min-width:\s*0/);
});

test("prose is capped at the measure and nothing is centred", () => {
  assert.match(CSS, /max-width:\s*var\(--measure\)/);
  assert.ok(!/text-align:\s*center/.test(CSS));
  assert.ok(!/margin-inline:\s*auto/.test(CSS));
  assert.ok(!/margin:\s*0 auto/.test(CSS));
});

test("grids: gap, top alignment, columns and collapse queries", () => {
  const layout = rule(CSS, ".layout");
  assert.ok(layout, ".layout rule missing");
  assert.match(layout, /display:\s*grid/);
  assert.match(layout, /gap:\s*var\(--grid-gap\)/);
  assert.match(layout, /align-items:\s*start/);
  for (const n of [2, 3, 4]) {
    const body = rule(CSS, `.grid-${n}`);
    assert.ok(body, `.grid-${n} missing`);
    assert.ok(body.includes(`repeat(${n}, minmax(0, 1fr))`), `.grid-${n} columns`);
  }
  const tablet = /@media \(max-width: 59\.99em\)\s*{([\s\S]*?\n})/.exec(CSS);
  assert.ok(tablet, "59.99em query missing");
  assert.ok(/\.grid-3[\s\S]*\.grid-4[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/.test(tablet[1]));
  const phone = /@media \(max-width: 39\.99em\)\s*{([\s\S]*?\n})/.exec(CSS);
  assert.ok(phone, "39.99em query missing");
  assert.ok(/\.grid-2[\s\S]*\.grid-3[\s\S]*\.grid-4[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/.test(phone[1]));
});

test("grid images are never cropped", () => {
  const body = rule(CSS, ".layout img");
  assert.ok(body, ".layout img rule missing");
  assert.match(body, /width:\s*100%/);
  assert.match(body, /height:\s*auto/);
  assert.ok(!/object-fit/.test(CSS), "object-fit is forbidden");
  assert.ok(!/img[^{]*{[^}]*aspect-ratio/.test(CSS), "aspect-ratio on img is forbidden");
  assert.ok(!/overflow:\s*hidden/.test(CSS), "overflow clipping is forbidden");
});

test("only four font sizes and two weights", () => {
  const sizes = new Set([...CSS.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1].trim()));
  for (const s of sizes) assert.ok(["1.125rem", "0.875rem", "1.5rem", "2.5rem"].includes(s), `font-size ${s}`);
  const weights = new Set([...CSS.matchAll(/font-weight:\s*([^;]+);/g)].map((m) => m[1].trim()));
  for (const w of weights) assert.ok(["400", "700"].includes(w), `font-weight ${w}`);
});

test("embed frames reserve their ratio", () => {
  assert.match(rule(CSS, ".embed iframe") ?? "", /aspect-ratio:\s*16 \/ 9/);
  assert.match(rule(CSS, ".embed.itch") ?? "", /calc\(var\(--w\) \* 1px\)/);
  assert.match(rule(CSS, ".embed.itch iframe") ?? "", /aspect-ratio:\s*var\(--w\) \/ var\(--h\)/);
  assert.match(rule(CSS, ".embed.itch.full") ?? "", /max-width:\s*none/);
  assert.match(rule(CSS, ".embed video") ?? "", /height:\s*auto/);
  assert.ok(rule(CSS, ".visually-hidden"), ".visually-hidden missing");
});

test("full captions are inset to the column left edge", () => {
  assert.ok(
    CSS.includes("max(var(--page-margin), calc((100% - var(--column-max)) / 2))"),
    "figcaption inset expression missing"
  );
  assert.match(CSS, /\.full figcaption\s*{[^}]*padding-inline-start/);
});

test("raw HTML grid markup builds and is kept (class contract renders today)", async () => {
  const s = await makeSite({
    files: {
      "content/pages/raw.md":
        '---\ntitle: Raw\n---\n\n<div class="layout grid-3">\n<figure><img src="../../assets/a.webp" alt="A"></figure>\n<figure><img src="../../assets/a.webp" alt="B"></figure>\n<figure><img src="../../assets/a.webp" alt="C"></figure>\n</div>\n',
    },
    assets: { "a.webp": { width: 400, height: 300, format: "webp" } },
  });
  try {
    const r = s.build();
    assert.equal(r.code, 0, r.output);
    const html = s.read("_site/raw/index.html");
    assert.ok(html.includes('<div class="layout grid-3">'));
    assert.equal((html.match(/<figure>/g) || []).length, 3);
  } finally {
    s.cleanup();
  }
});
