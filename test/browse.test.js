import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import siteData from "../src/_data/site.js";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const proj = ({ title, date, tags = "[games]", cover = "a.webp", alt = "Cover", extra = "" }) =>
  `---\ntitle: ${title}\ndate: ${date}\ntags: ${tags}\ncover: ../../assets/${cover}\ncover_alt: ${alt}\n${extra}---\n\nBody.\n`;

const ASSETS = {
  "a.webp": { width: 1200, height: 800, format: "webp" },
  "b.webp": { width: 800, height: 1200, format: "webp" },
};

const SIZES = "(min-width: 90em) 416px, (min-width: 60em) 30vw, (min-width: 40em) 45vw, 90vw";

async function build(files, { prefix, assets = ASSETS } = {}) {
  const site = await makeSite({ files, assets, prefix });
  sites.push(site);
  const r = site.build();
  return { site, r };
}

const fixtureA = {
  "content/projects/older.md": proj({ title: "Older", date: '"2023"', alt: "Older cover" }),
  "content/projects/newer.md": proj({ title: "Newer", date: '"2024-05"', cover: "b.webp", alt: "Newer cover" }),
  "content/pages/teaching.md": "---\ntitle: Teaching\n---\n\nCourses.\n",
};

// The <ul class="cards"> markup of a built page (empty string when absent).
const cardsOf = (html) => (html.match(/<ul class="cards">[\s\S]*?<\/ul>/) ?? [""])[0];
const cardItems = (html) => cardsOf(html).match(/<li>[\s\S]*?<\/li>/g) ?? [];

// ---------------------------------------------------------------------------
// Tracer: the /work/ feed end to end
// ---------------------------------------------------------------------------

test("/work/ lists every project as a card, newest first, under the path prefix", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build(fixtureA);
  assert.equal(r.code, 0, r.output);
  const html = site.read("_site/work/index.html");

  assert.match(html, /<title>Work<\/title>/);
  assert.match(html, /<h1>Work<\/h1>/);
  assert.equal((html.match(/<ul class="cards">/g) || []).length, 1);

  const items = cardItems(html);
  assert.equal(items.length, 2);
  const hrefs = items.map((li) => li.match(/<a class="card" href="([^"]+)"/)[1]);
  assert.deepEqual(hrefs, [`${prefix}newer/`, `${prefix}older/`]);

  const first = items[0];
  assert.match(first, /<picture>/);
  assert.match(first, /<img [^>]*alt="Newer cover"/);
  for (const m of first.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of m[1].split(",")) {
      assert.ok(candidate.trim().startsWith(`${prefix}img/`), `srcset candidate ${candidate}`);
    }
  }
  assert.ok(first.includes(`sizes="${SIZES}"`), "grid-3 sizes");
  assert.ok(first.includes('<span class="card-title">Newer</span>'));
  assert.ok(first.includes('<time class="card-date" datetime="2024-05">2024-05</time>'));
  assert.match(items[1], /alt="Older cover"/);
  assert.ok(items[1].includes('<time class="card-date" datetime="2023">2023</time>'));
});

test("only the first card cover is eager with high fetch priority", async () => {
  const { site } = await build(fixtureA);
  const [first, second] = cardItems(site.read("_site/work/index.html"));
  const img = (li) => li.match(/<img [^>]*>/)[0];
  assert.match(img(first), /loading="eager"/);
  assert.match(img(first), /fetchpriority="high"/);
  assert.match(img(second), /loading="lazy"/);
  assert.ok(!/fetchpriority/.test(img(second)));
});

test("cards show no tags and no standalone page", async () => {
  const prefix = defaultPrefix();
  const { site } = await build(fixtureA);
  const cards = cardsOf(site.read("_site/work/index.html"));
  assert.ok(!cards.includes("/tags/"));
  assert.ok(!cards.includes(`${prefix}teaching/`));
  assert.ok(!cards.includes("Courses"));
});

test("under PATH_PREFIX=/ the card links and srcsets are root-relative", async () => {
  const { site, r } = await build(fixtureA, { prefix: "/" });
  assert.equal(r.code, 0, r.output);
  const items = cardItems(site.read("_site/work/index.html"));
  assert.deepEqual(
    items.map((li) => li.match(/<a class="card" href="([^"]+)"/)[1]),
    ["/newer/", "/older/"]
  );
  for (const m of items.join("").matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of m[1].split(",")) assert.ok(candidate.trim().startsWith("/img/"), candidate);
  }
});

test("identical dates keep input-path order and equal titles stay two cards", async () => {
  const prefix = defaultPrefix();
  const { site, r } = await build({
    "content/projects/b-tie.md": proj({ title: "Same", date: '"2024"' }),
    "content/projects/a-tie.md": proj({ title: "Same", date: '"2024"' }),
    "content/projects/c-old.md": proj({ title: "Old", date: '"2020"' }),
  });
  assert.equal(r.code, 0, r.output);
  const items = cardItems(site.read("_site/work/index.html"));
  assert.deepEqual(
    items.map((li) => li.match(/href="([^"]+)"/)[1]),
    [`${prefix}a-tie/`, `${prefix}b-tie/`, `${prefix}c-old/`]
  );
  assert.equal(items.filter((li) => li.includes('<span class="card-title">Same</span>')).length, 2);
});

test("zero projects show the empty state, one project shows one card", async () => {
  const empty = await build({});
  assert.equal(empty.r.code, 0, empty.r.output);
  const emptyHtml = empty.site.read("_site/work/index.html");
  assert.ok(emptyHtml.includes("<p>No projects yet. Check back soon.</p>"));
  assert.ok(!emptyHtml.includes('<ul class="cards">'));

  const one = await build({ "content/projects/solo.md": proj({ title: "Solo", date: '"2024"' }) });
  assert.equal(one.r.code, 0, one.r.output);
  const oneHtml = one.site.read("_site/work/index.html");
  assert.equal(cardItems(oneHtml).length, 1);
  assert.ok(!oneHtml.includes("No projects yet"));
});

test("an unquoted year shows exactly as written on its card", async () => {
  const { site, r } = await build({ "content/projects/y.md": proj({ title: "Year", date: "2024" }) });
  assert.equal(r.code, 0, r.output);
  assert.ok(site.read("_site/work/index.html").includes('datetime="2024">2024<'));
});

test("a title with & and < is escaped once", async () => {
  const { site, r } = await build({
    "content/projects/fish.md": proj({ title: '"Fish & <Chips>"', date: '"2024"' }),
  });
  assert.equal(r.code, 0, r.output);
  assert.ok(site.read("_site/work/index.html").includes('<span class="card-title">Fish &amp; &lt;Chips&gt;</span>'));
});

test("a project whose cover file is missing still fails the build naming the file", async () => {
  const { r } = await build({
    "content/projects/broken.md": proj({ title: "Broken", date: '"2024"', cover: "gone.webp" }),
  });
  assert.notEqual(r.code, 0);
  assert.ok(r.output.includes("content/projects/broken.md"), r.output);
});

// ---------------------------------------------------------------------------
// Site header and navigation
// ---------------------------------------------------------------------------

const fixtureNav = {
  ...fixtureA,
  "content/pages/cv.md": "---\ntitle: CV\n---\n\nExperience.\n",
};

const headerOf = (html) => html.match(/<header>[\s\S]*?<\/header>/)[0];
// Every <a> in the header as { href, label, current } in order.
const headerLinks = (html) =>
  [...headerOf(html).matchAll(/<a ([^>]*)>([^<]*)<\/a>/g)].map((m) => ({
    href: m[1].match(/href="([^"]+)"/)[1],
    label: m[2],
    current: (m[1].match(/aria-current="([^"]+)"/) ?? [])[1],
  }));

test("every page has the header row, the owner name and the Main nav in order", async () => {
  const prefix = defaultPrefix();
  const { site: s, r } = await build(fixtureNav);
  assert.equal(r.code, 0, r.output);
  const html = s.read("_site/work/index.html");
  assert.match(
    html,
    new RegExp(
      `<header><div class="header-row"><a class="site-name" href="${prefix}">${siteData.name}</a><nav aria-label="Main"><ul>\\s*<li>`
    )
  );
  assert.deepEqual(
    headerLinks(html).map((l) => [l.href, l.label]),
    [
      [prefix, siteData.name],
      [`${prefix}work/`, "Work"],
      [`${prefix}cv/`, "CV"],
      [`${prefix}teaching/`, "Teaching"],
    ]
  );
});

test("aria-current marks the current page, and Work on project pages", async () => {
  const { site: s, r } = await build(fixtureNav);
  assert.equal(r.code, 0, r.output);
  const cur = (file) => Object.fromEntries(headerLinks(s.read(file)).map((l) => [l.label, l.current]));

  assert.deepEqual(cur("_site/work/index.html"), { [siteData.name]: undefined, Work: "page", CV: undefined, Teaching: undefined });
  assert.deepEqual(cur("_site/newer/index.html"), { [siteData.name]: undefined, Work: "true", CV: undefined, Teaching: undefined });
  assert.deepEqual(cur("_site/index.html"), { [siteData.name]: "page", Work: undefined, CV: undefined, Teaching: undefined });
  assert.deepEqual(cur("_site/cv/index.html"), { [siteData.name]: undefined, Work: undefined, CV: "page", Teaching: undefined });
  assert.deepEqual(cur("_site/teaching/index.html"), { [siteData.name]: undefined, Work: undefined, CV: undefined, Teaching: "page" });
  assert.ok(!s.read("_site/404.html").includes("aria-current"), "404 has no current item");
  assert.ok(headerLinks(s.read("_site/404.html")).length === 4, "404 carries the header");
});

test("every built page has exactly one Main nav", async () => {
  const { site: s } = await build(fixtureNav);
  const pages = s.walk("_site").filter((f) => f.endsWith(".html"));
  assert.ok(pages.length >= 6);
  for (const p of pages) {
    const html = fs.readFileSync(p, "utf8");
    assert.equal((html.match(/<nav aria-label="Main">/g) || []).length, 1, p);
  }
});

test("the header nav is identical under PATH_PREFIX=/", async () => {
  const { site: s } = await build(fixtureNav, { prefix: "/" });
  assert.deepEqual(
    headerLinks(s.read("_site/cv/index.html")).map((l) => l.href),
    ["/", "/work/", "/cv/", "/teaching/"]
  );
});

test("project slugs work and pdf are reserved; cv and teaching are not", async () => {
  for (const slug of ["work", "pdf"]) {
    const { r } = await build({
      "content/projects/clash.md": proj({ title: "Clash", date: '"2024"', extra: `slug: ${slug}\n` }),
    });
    assert.notEqual(r.code, 0, slug);
    assert.ok(r.output.includes("content/projects/clash.md"), r.output);
    assert.ok(r.output.includes(`slug "${slug}" is reserved`), r.output);
  }
  const { r } = await build({
    "content/projects/cv.md": proj({ title: "CV project", date: '"2024"' }),
    "content/pages/cv.md": "---\ntitle: CV\n---\n",
  });
  assert.notEqual(r.code, 0);
  assert.ok(r.output.includes('slug "cv" already used by'), r.output);
  assert.ok(!r.output.includes('slug "cv" is reserved'), r.output);
});
