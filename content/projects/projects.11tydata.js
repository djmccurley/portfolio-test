import tagDefs from "../../src/_data/tags.js";

export default {
  layout: "base.njk",
  section: "work", // Work is the current nav section on every project page
  eleventyComputed: {
    // The project's own tags as { slug, label } entries, in front matter order. Templates use this,
    // never plain `tags`, which pages without tags of their own inherit as the global list.
    projectTags: (data) => {
      const own = Array.isArray(data.tags) ? data.tags : [data.tags]; // no concat onto [] here: the data Proxy throws
      const defs = Array.isArray(tagDefs) ? tagDefs : [];
      return own.map((slug) => defs.find((t) => t?.slug === slug)).filter(Boolean);
    },
    permalink: (data) => {
      const s = data.slug || data.page.fileSlug;
      // Unsafe slugs write nothing; validation (plan 02) reports them with the file named.
      return /^[a-z0-9-]+$/.test(s) ? `/${s}/index.html` : false;
    },
  },
};
