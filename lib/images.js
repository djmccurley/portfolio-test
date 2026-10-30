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
  htmlOptions: {
    imgAttributes: {
      loading: "lazy",
      decoding: "async",
      sizes: "(min-width: 90em) 1280px, 90vw",
    },
  },
};
