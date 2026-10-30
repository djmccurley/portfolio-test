export default {
  // A JS function (not a template string) so the name is escaped once, by base.njk.
  eleventyComputed: { title: (data) => data.site.name },
};
