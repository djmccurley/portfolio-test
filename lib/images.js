// Prepend "avif" to enable AVIF output (D-21).
export const FORMATS = ["webp", "jpeg"];

export const imageOptions = {
  formats: FORMATS,
  widths: [480, 960, 1600, 2400],
  urlPath: "/img/",
  outputDir: "_site/img/",
  failOnError: true,
  sharpOptions: { animated: true },
  // The default also filters "animated", which wrongly treats static webp as animated and drops its jpeg fallback.
  formatFiltering: ["transparent"],
  // A raw <img> with no alt attribute is reported by lib/alt-lint.js (A11Y-04); without this default
  // eleventy-img would abort the build instead. Markdown images always carry an alt attribute.
  defaultAttributes: { alt: "" },
  htmlOptions: {
    imgAttributes: {
      loading: "lazy",
      decoding: "async",
      sizes: "(min-width: 90em) 1280px, 90vw",
    },
  },
};
