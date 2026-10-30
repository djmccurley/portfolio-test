export default {
  layout: "base.njk",
  section: "work", // Work is the current nav section on every tag page
  pagination: { data: "collections.tagPages", size: 1, alias: "tag" },
  // JS functions, not Nunjucks strings: the label is then escaped once by `{{ title }}` in the layout.
  eleventyComputed: {
    title: (data) => `Work: ${data.tag.label}`,
    permalink: (data) => `/tags/${data.tag.slug}/index.html`,
  },
};
