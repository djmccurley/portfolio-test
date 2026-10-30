import tags from "../src/_data/tags.js";
import { resolveAsset } from "./assets.js";
import { readFrontMatter, validDate } from "./frontmatter.js";

export const RESERVED_SLUGS = new Set(["tags", "404", "assets", "img", "css", "js", "projects", "pages", "video", "work", "pdf"]);
export const PROJECT_KEYS = ["title","date","tags","cover","cover_alt","summary","slug","role","client","tools","year","link","layout","permalink","eleventyExcludeFromCollections"];
export const PAGE_KEYS = ["title","summary","slug","layout","permalink","eleventyExcludeFromCollections"];

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

export function addValidation(eleventyConfig) {
  eleventyConfig.addCollection("_validated", (api) => {
    const items = api.getAll().map((t) => ({ inputPath: t.inputPath, fileSlug: t.fileSlug, data: t.data }));
    const tagErrors = validateTagDefs(tags);
    const tagSlugs = Array.isArray(tags)
      ? tags.filter((t) => t && typeof t.slug === "string" && SLUG_RE.test(t.slug)).map((t) => t.slug)
      : [];
    const errors = [
      ...tagErrors,
      ...validateContent(items, { tags: tagSlugs, resolveAsset, readFrontMatter }),
    ];
    if (errors.length) throw new Error("Content validation failed:\n" + errors.join("\n"));
    return items;
  });
}
