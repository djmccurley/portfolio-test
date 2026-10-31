import test, { after } from "node:test";
import assert from "node:assert/strict";
import siteData from "../src/_data/site.js";
import { makeSite } from "./helpers/site.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

// Homepage markdown for a fixture site; `extra` is added to the front matter.
const HOME = (extra = "") => `---\nlayout: home.njk\npermalink: /index.html\n${extra}---\n\nIntro.\n`;

const h1s = (html) => html.match(/<h1[ >][\s\S]*?<\/h1>/g) ?? [];

async function buildHome(extra) {
  const site = await makeSite({ files: { "content/index.md": HOME(extra) } });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  return site.read("_site/index.html");
}

test("default: no heading and no hideHeading leaves the h1 as the site name", async () => {
  const html = await buildHome();
  assert.deepEqual(h1s(html), [`<h1>${siteData.name}</h1>`]);
});

test("heading overrides the h1 only; title, og:title and the header keep the site name", async () => {
  const html = await buildHome("heading: Maker of things\n");
  assert.deepEqual(h1s(html), ["<h1>Maker of things</h1>"]);
  assert.ok(html.includes(`<title>${siteData.name}</title>`));
  assert.ok(html.includes(`<meta property="og:title" content="${siteData.name}">`));
  assert.match(html, new RegExp(`class="site-name"[^>]*>${siteData.name}<\\/a>`));
});

test("heading text is escaped exactly once", async () => {
  const html = await buildHome('heading: "Art & <Games>"\n');
  assert.deepEqual(h1s(html), ["<h1>Art &amp; &lt;Games&gt;</h1>"]);
  assert.ok(!html.includes("&amp;amp;"));
  assert.ok(!html.includes("<Games>"));
});

test("hideHeading: true hides the h1 on screen but keeps exactly one h1", async () => {
  const html = await buildHome("heading: Maker of things\nhideHeading: true\n");
  assert.deepEqual(h1s(html), ['<h1 class="visually-hidden">Maker of things</h1>']);
});

test("only boolean true hides the heading: no and false stay visible", async () => {
  for (const v of ["no", "false"]) {
    const html = await buildHome(`hideHeading: ${v}\n`);
    assert.deepEqual(h1s(html), [`<h1>${siteData.name}</h1>`], `hideHeading: ${v}`);
  }
});
