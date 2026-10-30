import test, { after } from "node:test";
import assert from "node:assert/strict";
import { altIssue } from "../lib/alt-lint.js";
import { makeSite } from "./helpers/site.js";

const front = `---
title: Alts
date: "2024-01-01"
tags: [games]
cover: ../../assets/a.webp
cover_alt: Cover
---
`;

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

test("altIssue flags the VS Code paste default, any case and padding", () => {
  assert.equal(altIssue("alt text", "x.webp"), "paste-default");
  assert.equal(altIssue("  Alt Text ", "x.webp"), "paste-default");
});

test("altIssue accepts a real description", () => {
  assert.equal(altIssue("A crab on a rock", "x.webp"), null);
});

test("a pasted image with the default alt warns once, names file and path, and the build still passes", async () => {
  const site = await makeSite({
    files: { "content/projects/alts.md": `${front}\n![alt text](../../assets/a.webp)\n` },
    assets: { "a.webp": { width: 800, height: 600, format: "webp" } },
  });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  const line =
    'WARN ./content/projects/alts.md: image ../../assets/a.webp still has the paste placeholder alt "alt text". Replace it with a description.';
  const hits = r.output.split("\n").filter((l) => l === line);
  assert.equal(hits.length, 1, r.output);
  assert.match(site.read("_site/alts/index.html"), /alt="alt text"/);
});
