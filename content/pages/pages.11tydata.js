export default {
  layout: "base.njk",
  eleventyComputed: {
    permalink: (data) => {
      const s = data.slug || data.page.fileSlug;
      // Unsafe slugs write nothing; validation reports them with the file named.
      return /^[a-z0-9-]+$/.test(s) ? `/${s}/index.html` : false;
    },
  },
};
