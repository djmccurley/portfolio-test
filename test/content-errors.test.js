import test from "node:test";
import assert from "node:assert/strict";
import { makeSite, defaultPrefix } from "./helpers/site.js";
import { buildIndex } from "../lib/assets.js";

const img = { width: 400, height: 300, format: "webp" };

function fm(over = {}, omit = []) {
  const base = {
    title: "T",
    date: '"2024-01-01"',
    tags: "[games]",
    cover: "../../assets/fixture.webp",
    cover_alt: "Cover",
  };
  const all = { ...base, ...over };
  for (const k of omit) delete all[k];
  return `---\n${Object.entries(all).map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n\nBody\n`;
}

async function fails(files, fragments, assets = { "fixture.webp": img }) {
  const site = await makeSite({ files, assets });
  try {
    const r = site.build();
    assert.notEqual(r.code, 0, r.output);
    for (const f of fragments) assert.ok(r.output.includes(f), `missing "${f}" in:\n${r.output}`);
  } finally {
    site.cleanup();
  }
}

const P = "content/projects/";

test("missing field cover_alt", () =>
  fails({ [P + "a.md"]: fm({}, ["cover_alt"]) }, [P + "a.md", 'missing front matter field "cover_alt"']));

test("unknown tag", () =>
  fails({ [P + "a.md"]: fm({ tags: "[games, bogus]" }) }, [P + "a.md", 'unknown tag "bogus"', "allowed: graphic, ux, art, games"]));

test("empty tags", () =>
  fails({ [P + "a.md"]: fm({ tags: "[]" }) }, [P + "a.md", '"tags" must list at least one tag']));

test("bad date", () =>
  fails({ [P + "a.md"]: fm({ date: '"March 2019"' }) }, [P + "a.md", "must be YYYY, YYYY-MM or YYYY-MM-DD"]));

test("slug collision", () =>
  fails(
    { [P + "about.md"]: fm(), "content/pages/about.md": "---\ntitle: About\n---\nHi\n" },
    ['slug "about" already used by', P + "about.md", "content/pages/about.md"]
  ));

test("reserved slug", () =>
  fails({ [P + "a.md"]: fm({ slug: "tags" }) }, [P + "a.md", 'slug "tags" is reserved']));

test("bad slug format", () =>
  fails({ [P + "a.md"]: fm({ slug: '"../evil"' }) }, [P + "a.md", "must match ^[a-z0-9-]+$"]));

test("draft not yet supported", () =>
  fails({ [P + "a.md"]: fm({ draft: "true" }) }, [P + "a.md", 'unknown front matter key "draft"']));

test("missing cover", () =>
  fails({ [P + "a.md"]: fm({ cover: "../../assets/gone.webp" }) }, [P + "a.md", "cover not found in assets/", "gone.webp"]));

test("unknown key typo", () =>
  fails({ [P + "a.md"]: fm({ tag: "games" }) }, [P + "a.md", 'unknown front matter key "tag"']));

test("aggregation", () =>
  fails(
    { [P + "a.md"]: fm({ tags: "[bogus]" }), [P + "b.md"]: fm({}, ["title"]) },
    [P + "a.md", 'unknown tag "bogus"', P + "b.md", 'missing front matter field "title"']
  ));

test("malformed YAML", () =>
  fails({ [P + "a.md"]: '---\ntitle: "oops\n---\nBody\n' }, [P + "a.md"]));

test("case-only duplicates in assets", () => {
  assert.throws(() => buildIndex(["Shot.webp", "shot.webp"], "assets"), /Shot\.webp.*shot\.webp/);
});

test("page needs only title", async () => {
  const site = await makeSite({ files: { "content/pages/about.md": "---\ntitle: About\n---\nHi\n" } });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    assert.ok(site.exists("_site/about/index.html"));
  } finally {
    site.cleanup();
  }
});

test("partial date shown as written", async () => {
  const site = await makeSite({
    assets: { "fixture.webp": img },
    files: { [P + "a.md"]: fm({ date: "2019-03" }) },
  });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    const html = site.read("_site/a/index.html");
    assert.ok(html.includes("2019-03"));
    assert.ok(!html.includes("2019-03-01"));
  } finally {
    site.cleanup();
  }
});

test("metadata dl only when present", async () => {
  const site = await makeSite({
    assets: { "fixture.webp": img },
    files: {
      [P + "with.md"]: fm({ role: "Designer", client: "Acme" }),
      [P + "without.md"]: fm(),
    },
  });
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    const w = site.read("_site/with/index.html");
    assert.match(w, /<dl/);
    assert.match(w, /<dt>Role<\/dt>\s*<dd>Designer<\/dd>/);
    assert.ok(!site.read("_site/without/index.html").includes("<dl"));
  } finally {
    site.cleanup();
  }
});

test("404 page", async () => {
  const site = await makeSite({});
  try {
    const r = site.build();
    assert.equal(r.code, 0, r.output);
    const html = site.read("_site/404.html");
    assert.ok(html.includes("Page not found"));
    assert.ok(html.includes(`href="${defaultPrefix()}"`));
  } finally {
    site.cleanup();
  }
});
