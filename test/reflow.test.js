import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeSite } from "./helpers/site.js";

// CI-safe half of A11Y-02 (WCAG 1.4.10 reflow, 1.4.4 resize). The real-browser measurement is
// `npm run check:reflow`, which needs Chrome and so stays local.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = fs.readFileSync(path.join(ROOT, "content", "style.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

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

// Every { selector, body } pair, media-query contents included.
function allRules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].replace(/\s+/g, " ").trim(), body: m[2] }));
}

// The inside of the first @media block whose head matches (balanced braces).
function mediaBody(css, headPattern) {
  const m = headPattern.exec(css);
  if (!m) return null;
  let depth = 0;
  const open = css.indexOf("{", m.index);
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  return null;
}

test("the break-word list covers headings, prose, lists, captions, links, blockquote, dt and summary", () => {
  const hit = allRules(CSS).find((r) => /overflow-wrap:\s*break-word/.test(r.body));
  assert.ok(hit, "no overflow-wrap: break-word rule");
  const selectors = hit.selector.split(",").map((s) => s.trim());
  for (const s of ["h1", "h2", "h3", "p", "li", "dd", "figcaption", "a", "blockquote", "dt", "summary"]) {
    assert.ok(selectors.includes(s), `${s} is missing from the overflow-wrap: break-word list`);
  }
});

test("pre, td and th use overflow-wrap: anywhere so tokens and columns shrink", () => {
  assert.match(rule(CSS, "pre, td, th") ?? "", /overflow-wrap:\s*anywhere/);
});

test("the project meta list can shrink: minmax(0, 1fr) column and dd min-width 0", () => {
  const wide = mediaBody(CSS, /@media \(min-width: 40em\)/);
  assert.ok(wide, "@media (min-width: 40em) block missing");
  assert.match(rule(wide, "dl") ?? "", /grid-template-columns:\s*auto minmax\(0, 1fr\)/);
  assert.match(rule(wide, "dd") ?? "", /min-width:\s*0/);
});

test("page children and the wrapping link rows keep min-width: 0", () => {
  assert.match(rule(CSS, "body > header > *, main > *") ?? "", /min-width:\s*0/);
  assert.match(rule(CSS, ".pager li, .filters li") ?? "", /min-width:\s*0/);
});

test("no fixed width or min-width of 100px or more", () => {
  for (const { selector, body } of allRules(CSS)) {
    for (const m of body.matchAll(/(?:^|[;\s])((?:min-)?width)\s*:\s*([^;]+)/g)) {
      assert.ok(!/\b\d{3,}(\.\d+)?px\b/.test(m[2]), `${selector}: ${m[1]}: ${m[2].trim()}`);
    }
  }
});

test("reflow is never faked: no 100vw, no overflow clipping", () => {
  assert.ok(!/100vw/.test(CSS), "100vw found");
  assert.ok(!/overflow(-x)?:\s*hidden/.test(CSS), "overflow: hidden / overflow-x: hidden found");
});

test("white-space: nowrap only appears in the skip link and the visually-hidden rule", () => {
  const found = allRules(CSS).filter((r) => /white-space:\s*nowrap/.test(r.body));
  assert.ok(found.length > 0, "expected the skip link and visually-hidden rules to use nowrap");
  for (const { selector } of found) {
    assert.ok([".skip-link", ".visually-hidden"].includes(selector), `white-space: nowrap on ${selector}`);
  }
});

// ---- built pages never block zoom ----

const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">';
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

test("every built page has exactly one viewport meta and nothing blocks zoom", () => {
  const pages = site.walk("_site").filter((f) => f.endsWith(".html"));
  assert.ok(pages.length >= 4, "expected the project, the page, home and 404");
  for (const p of pages) {
    const html = fs.readFileSync(p, "utf8");
    const metas = html.match(/<meta\s+name="viewport"[^>]*>/g) ?? [];
    assert.equal(metas.length, 1, `${p}: expected one viewport meta`);
    assert.equal(metas[0], VIEWPORT, `${p}: viewport meta`);
    assert.ok(!html.includes("user-scalable"), `${p}: user-scalable blocks zoom`);
    assert.ok(!html.includes("maximum-scale"), `${p}: maximum-scale blocks zoom`);
  }
});
