import tags from "../src/_data/tags.js";
import { resolveAsset } from "./assets.js";
import { readFrontMatter, validDate } from "./frontmatter.js";
import { findDrafts } from "./drafts.js";

export const RESERVED_SLUGS = new Set(["tags", "404", "assets", "img", "css", "js", "projects", "pages", "video", "work", "pdf"]);
export const PROJECT_KEYS = ["title","date","tags","cover","cover_alt","summary","description","slug","role","client","tools","year","link","draft","heading","hideHeading","layout","permalink","eleventyExcludeFromCollections"];
export const PAGE_KEYS = ["title","summary","description","slug","draft","heading","hideHeading","layout","permalink","eleventyExcludeFromCollections"];

const REQUIRED_PROJECT = ["title", "date", "tags", "cover", "cover_alt"];
const SLUG_RE = /^[a-z0-9-]+$/;
const missing = (v) => v === undefined || v === null || v === "";

// Checks the shape of src/_data/tags.js; returns a list of error strings.
export function validateTagDefs(defs) {
  const f = "src/_data/tags.js:";
  if (!Array.isArray(defs)) return [`${f} must export a list of tags, e.g. [{ slug: "ux", label: "UX" }].`];
  const errors = [];
  const seen = new Set();
  for (const d of defs) {
    const ok = d && typeof d === "object" && typeof d.slug === "string" && d.slug && typeof d.label === "string" && d.label;
    if (!ok) {
      errors.push(`${f} every tag needs a slug and a label, e.g. { slug: "ux", label: "UX" }.`);
      continue;
    }
    if (!SLUG_RE.test(d.slug)) errors.push(`${f} tag slug "${d.slug}" must match ^[a-z0-9-]+$.`);
    else if (seen.has(d.slug)) errors.push(`${f} tag slug "${d.slug}" is listed more than once.`);
    seen.add(d.slug);
  }
  return errors;
}

// Checks src/_data/site.js: the origin and default share image that link previews are built from (D-07, D-09).
// Returns a list of error strings.
const ORIGIN_RE = /^https:\/\/[A-Za-z0-9.-]+(:\d+)?$/;
export function validateSite(site, { resolveAsset: resolve }) {
  const f = "src/_data/site.js:";
  const s = site && typeof site === "object" ? site : {};
  const errors = [];
  const text = (v) => typeof v === "string" && v.trim() !== "";
  if (typeof s.url !== "string" || !ORIGIN_RE.test(s.url)) {
    errors.push(
      `${f} url must be the site origin only, like "https://djmccurley.github.io" (https, no path, no trailing slash); got ${JSON.stringify(s.url)}. Put a subpath in PATH_PREFIX in eleventy.config.js.`
    );
  }
  if (!text(s.defaultImage) || !resolve(s.defaultImage)) {
    errors.push(`${f} defaultImage "${s.defaultImage ?? ""}" not found in assets/. Add the image to assets/ or change defaultImage.`);
  }
  if (!text(s.defaultImageAlt)) errors.push(`${f} defaultImageAlt must describe the default share image.`);
  if (!text(s.description)) {
    errors.push(`${f} description must be a sentence for link previews of pages with no description or summary.`);
  }
  return errors;
}

export function validateContent(items, { tags: allowedTags, resolveAsset: resolve, readFrontMatter: readFm }) {
  const errors = [];
  const slugs = new Map();
  for (const item of items) {
    const p = item.inputPath;
    if (!/^\.\/content\/(projects|pages)\//.test(p)) continue;
    const isProject = p.includes("/projects/");
    const err = (msg) => errors.push(`${p}: ${msg}`);

    let raw;
    try {
      raw = readFm(p);
    } catch (e) {
      err(`cannot read front matter: ${e.message}`);
      continue;
    }

    const allowed = isProject ? PROJECT_KEYS : PAGE_KEYS;
    for (const k of Object.keys(raw)) {
      if (!allowed.includes(k)) err(`unknown front matter key "${k}" (allowed: ${allowed.join(", ")})`);
    }

    if (Object.hasOwn(raw, "draft") && typeof raw.draft !== "boolean") {
      err(`"draft" must be true or false (got ${JSON.stringify(raw.draft)})`);
    }

    if (Object.hasOwn(raw, "hideHeading") && typeof raw.hideHeading !== "boolean") {
      err(`"hideHeading" must be true or false (got ${JSON.stringify(raw.hideHeading)})`);
    }

    if (Object.hasOwn(raw, "description") && !missing(raw.description) && typeof raw.description !== "string") {
      err(`"description" must be text, e.g. description: A one-sentence summary for link previews`);
    }

    const required = isProject ? REQUIRED_PROJECT : ["title"];
    for (const k of required) {
      if (missing(raw[k])) err(`missing front matter field "${k}"`);
    }

    if (isProject && !missing(raw.tags)) {
      const list = Array.isArray(raw.tags) ? raw.tags : [raw.tags];
      if (list.length === 0) err(`"tags" must list at least one tag`);
      for (const t of list) {
        if (!allowedTags.includes(t)) err(`unknown tag "${t}" (allowed: ${allowedTags.join(", ")})`);
      }
    }

    if (!missing(raw.date) && !validDate(raw.date)) {
      err(`date "${raw.date}" must be YYYY, YYYY-MM or YYYY-MM-DD`);
    }

    if (isProject && !missing(raw.cover) && !resolve(String(raw.cover))) {
      err(`cover not found in assets/: ${raw.cover}`);
    }

    const slug = String(raw.slug ?? item.fileSlug);
    if (!SLUG_RE.test(slug)) err(`slug "${slug}" must match ^[a-z0-9-]+$`);
    else if (RESERVED_SLUGS.has(slug)) err(`slug "${slug}" is reserved`);
    else if (slugs.has(slug)) err(`slug "${slug}" already used by ${slugs.get(slug)}`);
    else slugs.set(slug, p);
  }
  return errors;
}

// Turns the featured slug list into project items, in list order. `projects` is a list of
// { slug, item } pairs. Every bad entry becomes an error; nothing is dropped silently.
export function resolveFeatured(slugs, projects, { draftSlugs = new Set(), warn = () => {} } = {}) {
  const f = "src/_data/featured.js:";
  if (!Array.isArray(slugs)) {
    return { errors: [`${f} must export a list of project slugs, e.g. export default ["tidepool-game"];`], items: [] };
  }
  const errors = [];
  const items = [];
  const seen = new Set();
  for (const entry of slugs) {
    if (typeof entry !== "string") {
      errors.push(`${f} every entry must be a project slug string; got ${JSON.stringify(entry)}.`);
      continue;
    }
    if (seen.has(entry)) {
      errors.push(`${f} "${entry}" is listed more than once. List each featured project once.`);
      continue;
    }
    seen.add(entry);
    const match = projects.find((p) => p.slug === entry);
    if (!match) {
      // A draft is not built in the live run, so it has no match; leave it off the homepage instead of failing (D-16).
      if (draftSlugs.has(entry)) {
        warn(`WARN src/_data/featured.js: "${entry}" is a draft, so it is left off the homepage on the live site.`);
        continue;
      }
      errors.push(`${f} featured project "${entry}" does not match any project in content/projects/. Fix the spelling or remove it from the list.`);
      continue;
    }
    items.push(match.item);
  }
  return { errors, items };
}

export function addValidation(eleventyConfig) {
  eleventyConfig.addCollection("_validated", (api) => {
    const items = api.getAll().map((t) => ({ inputPath: t.inputPath, fileSlug: t.fileSlug, data: t.data }));
    const tagErrors = validateTagDefs(tags);
    const tagSlugs = Array.isArray(tags)
      ? tags.filter((t) => t && typeof t.slug === "string" && SLUG_RE.test(t.slug)).map((t) => t.slug)
      : [];
    // Read from the data cascade, not an import, so editing site.js updates a running `npm start` (same as `featured`).
    const site = api.getAll()[0]?.data?.site ?? {};
    const errors = [
      ...tagErrors,
      ...validateSite(site, { resolveAsset }),
      ...validateContent(items, { tags: tagSlugs, resolveAsset, readFrontMatter }),
    ];
    if (errors.length) throw new Error("Content validation failed:\n" + errors.join("\n"));
    return items;
  });
  // The homepage's featured projects, in the order of src/_data/featured.js (never re-sorted).
  eleventyConfig.addCollection("featured", (api) => {
    const projects = api
      .getFilteredByGlob("content/projects/*.md")
      .map((item) => ({ slug: String(item.data.slug ?? item.fileSlug), item }));
    // Read from the data cascade, not an import, so editing featured.js updates a running `npm start`.
    const slugs = api.getAll()[0]?.data?.featured ?? [];
    const draftSlugs = new Set(findDrafts().filter((d) => d.kind === "project").map((d) => d.slug));
    const { errors, items } = resolveFeatured(slugs, projects, { draftSlugs, warn: console.warn });
    if (errors.length) throw new Error("Content validation failed:\n" + errors.join("\n"));
    return items;
  });
}
