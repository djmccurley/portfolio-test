// Prepend "avif" to enable AVIF output (D-21).
export const FORMATS = ["webp", "jpeg"];

export const imageOptions = {
  formats: FORMATS,
  widths: [480, 960, 1600, 2400],
  urlPath: "/img/",
  outputDir: "_site/img/",
  failOnError: true,
  htmlOptions: {
    imgAttributes: {
      loading: "lazy",
      decoding: "async",
      sizes: "(min-width: 60em) 60em, 100vw",
    },
  },
};
