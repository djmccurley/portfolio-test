import tags from "../src/_data/tags.js";
import { resolveAsset } from "./assets.js";
import { readFrontMatter } from "./frontmatter.js";

export const RESERVED_SLUGS = new Set(["tags", "404", "assets", "img", "css", "js", "projects", "pages", "video"]);
export const PROJECT_KEYS = ["title","date","tags","cover","cover_alt","summary","slug","role","client","tools","year","link","layout","permalink","eleventyExcludeFromCollections"];
export const PAGE_KEYS = ["title","summary","slug","layout","permalink","eleventyExcludeFromCollections"];

const REQUIRED_PROJECT = ["title", "date", "tags", "cover", "cover_alt"];
const SLUG_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const missing = (v) => v === undefined || v === null || v === "";

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

    if (!missing(raw.date) && !DATE_RE.test(String(raw.date))) {
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
    const errors = validateContent(items, { tags, resolveAsset, readFrontMatter });
    if (errors.length) throw new Error("Content validation failed:\n" + errors.join("\n"));
    return items;
  });
}
