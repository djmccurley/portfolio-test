import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { imageOptions } from "./lib/images.js";
import { installBlocks } from "./lib/blocks.js";
import { installAssetResolver } from "./lib/markdown.js";
import { refreshAssets } from "./lib/assets.js";
import { resetAltWarnings } from "./lib/alt-lint.js";
import { parseFrontMatter } from "./lib/frontmatter.js";
import { addValidation } from "./lib/validate.js";

// THE one base-path value. Use "/" for a custom domain or user site (PUB-02, D-20).
const PATH_PREFIX = process.env.PATH_PREFIX ?? "/portfolio-test/";

// Eleventy throws its own error on dates it cannot parse. Hide those so lib/validate.js
// can report them with the file named (D-23). The raw value is re-read there.
function lenientFrontMatter(str) {
  const data = parseFrontMatter(str);
  if (typeof data.date === "string" && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(data.date)) delete data.date;
  return data;
}

export default async function (eleventyConfig) {
  eleventyConfig.setFrontMatterParsingOptions({ engines: { yaml: { parse: lenientFrontMatter } } });

  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, imageOptions);

  eleventyConfig.amendLibrary("md", (md) => {
    installBlocks(md);
    installAssetResolver(md);
  });
  await refreshAssets();
  eleventyConfig.on("eleventy.before", () => {
    resetAltWarnings(); // each rebuild under `npm start` prints the current warnings again
    return refreshAssets();
  });

  // assets/ is never copied (IMG-03); only the stylesheet is passed through.
  eleventyConfig.addPassthroughCopy({ "content/style.css": "style.css" });

  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("content/projects/*.md")
      .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)))
  );

  addValidation(eleventyConfig);

  return {
    dir: { input: "content", includes: "../src/_includes", data: "../src/_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: PATH_PREFIX,
  };
}
