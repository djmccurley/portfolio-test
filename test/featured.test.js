import test, { after } from "node:test";
import assert from "node:assert/strict";
import siteData from "../src/_data/site.js";
import { makeSite, defaultPrefix } from "./helpers/site.js";
import { resolveFeatured } from "../lib/validate.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const proj = ({ title, date, slug }) =>
  `---\ntitle: ${title}\ndate: "${date}"\ntags: [games]\ncover: ../../assets/a.webp\ncover_alt: Cover of ${title}\n${slug ? `slug: ${slug}\n` : ""}---\n\nBody.\n`;

const ASSETS = { "a.webp": { width: 1200, height: 800, format: "webp" } };

const PROJECTS = {
  "content/projects/a.md": proj({ title: "A", date: "2024" }),
  "content/projects/b.md": proj({ title: "B", date: "2020" }),
  "content/projects/x.md": proj({ title: "X", date: "2022", slug: "custom" }),
};

const featuredFile = (expr) => ({ "src/_data/featured.js": `export default ${expr};\n` });

async function build(files, opts = {}) {
  const site = await makeSite({ files, assets: ASSETS, ...opts });
  sites.push(site);
  const r = site.build();
  return { site, r };
}

const cardsOf = (html) => (html.match(/<ul class="cards">[\s\S]*?<\/ul>/) ?? [""])[0];
const cardItems = (html) => cardsOf(html).match(/<li>[\s\S]*?<\/li>/g) ?? [];

// ---------------------------------------------------------------------------
// Tracer: featured slugs -> ordered Selected work grid
// ---------------------------------------------------------------------------

test("homepage shows name, intro, featured cards in file order and an All work link", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build({ ...PROJECTS, ...featuredFile('["b", "custom", "a"]') });
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/index.html");

  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
  const tags = [...main.matchAll(/<(h1|p|h2|ul)[ >]/g)].map((m) => m[1]);
  assert.deepEqual(tags, ["h1", "p", "h2", "ul", "p"]);
  assert.match(main, /<h1>[^<]+<\/h1>/);
  assert.match(main, /<h2>Selected work<\/h2>/);
  assert.ok(main.includes(`<p><a href="${prefix}work/">All work</a></p>`), main);

  const hrefs = cardItems(html).map((li) => li.match(/<a class="card" href="([^"]+)"/)[1]);
  assert.deepEqual(hrefs, [`${prefix}b/`, `${prefix}custom/`, `${prefix}a/`]);

  const first = cardItems(html)[0].match(/<img [^>]*>/)[0];
  assert.match(first, /loading="eager"/);
  const second = cardItems(html)[1].match(/<img [^>]*>/)[0];
  assert.match(second, /loading="lazy"/);
});

test("homepage title and h1 are the site name", async () => {
  const { site, r } = await build({ ...PROJECTS, ...featuredFile('["a"]') });
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/index.html");
  assert.ok(html.includes(`<title>${siteData.name}</title>`));
  assert.ok(html.includes(`<h1>${siteData.name}</h1>`));
});

test("a site name with & and < is escaped exactly once in title, h1 and header", async () => {
  const { site, r } = await build({
    ...PROJECTS,
    ...featuredFile('["a"]'),
    "src/_data/site.js": `export default ${JSON.stringify({ ...siteData, name: "Ann & <Bo>" })};\n`,
  });
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/index.html");
  assert.ok(html.includes("<title>Ann &amp; &lt;Bo&gt;</title>"), html);
  assert.ok(html.includes("<h1>Ann &amp; &lt;Bo&gt;</h1>"));
  assert.match(html, /class="site-name"[^>]*>Ann &amp; &lt;Bo&gt;<\/a>/);
  assert.ok(!html.includes("&amp;amp;"));
});

test("an empty featured list omits Selected work and the grid but keeps All work", async () => {
  const { site, r } = await build(PROJECTS);
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/index.html");
  assert.ok(!html.includes("Selected work"));
  assert.ok(!html.includes('<ul class="cards">'));
  assert.ok(html.includes(`<p><a href="${defaultPrefix()}work/">All work</a></p>`));
});

test("one featured project renders exactly one card", async () => {
  const { site, r } = await build({ ...PROJECTS, ...featuredFile('["a"]') });
  assert.equal(r.code, 0, r.output);
  assert.equal(cardItems(site.read("_site/index.html")).length, 1);
});

// ---------------------------------------------------------------------------
// Build errors
// ---------------------------------------------------------------------------

const UNKNOWN = (s) =>
  `src/_data/featured.js: featured project "${s}" does not match any project in content/projects/. Fix the spelling or remove it from the list.`;
const DUP = (s) => `src/_data/featured.js: "${s}" is listed more than once. List each featured project once.`;

test("an unknown featured slug fails the build and says how to fix it", async () => {
  const { r } = await build({ ...PROJECTS, ...featuredFile('["nope"]') });
  assert.notEqual(r.code, 0);
  assert.ok(r.output.includes(UNKNOWN("nope")), r.output);
});

test("a repeated featured slug fails the build", async () => {
  const { r } = await build({ ...PROJECTS, ...featuredFile('["a", "a"]') });
  assert.notEqual(r.code, 0);
  assert.ok(r.output.includes(DUP("a")), r.output);
});

test("a non-string featured entry fails the build", async () => {
  const { r } = await build({ ...PROJECTS, ...featuredFile('["a", 42]') });
  assert.notEqual(r.code, 0);
  assert.ok(
    r.output.includes("src/_data/featured.js: every entry must be a project slug string; got 42."),
    r.output
  );
});

test("unknown and duplicate entries are both reported in one build", async () => {
  const { r } = await build({ ...PROJECTS, ...featuredFile('["nope", "a", "a"]') });
  assert.notEqual(r.code, 0);
  assert.ok(r.output.includes(UNKNOWN("nope")), r.output);
  assert.ok(r.output.includes(DUP("a")), r.output);
});

// ---------------------------------------------------------------------------
// resolveFeatured (unit) and the shipped list
// ---------------------------------------------------------------------------

const NOT_LIST = 'src/_data/featured.js: must export a list of project slugs, e.g. export default ["tidepool-game"];';
const pairs = [
  { slug: "a", item: { id: "A" } },
  { slug: "b", item: { id: "B" } },
];

test("resolveFeatured returns items in list order with no errors", () => {
  const r = resolveFeatured(["b", "a"], pairs);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.items.map((i) => i.id), ["B", "A"]);
});

test("resolveFeatured of an empty list returns nothing", () => {
  assert.deepEqual(resolveFeatured([], pairs), { errors: [], items: [] });
});

test("resolveFeatured rejects a non-list export with one error", () => {
  for (const bad of ["a", {}]) {
    const r = resolveFeatured(bad, pairs);
    assert.deepEqual(r.errors, [NOT_LIST]);
    assert.deepEqual(r.items, []);
  }
});

test("a non-list featured.js fails the build", async () => {
  const { r } = await build({ ...PROJECTS, ...featuredFile('"a"') });
  assert.notEqual(r.code, 0);
  assert.ok(r.output.includes(NOT_LIST), r.output);
});

test("the repo build features tidepool-game on the homepage", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build({}, { useRepoContent: true });
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/index.html");
  assert.ok(html.includes("<h2>Selected work</h2>"));
  assert.ok(html.includes(`<a class="card" href="${prefix}tidepool-game/">`), html);
});
