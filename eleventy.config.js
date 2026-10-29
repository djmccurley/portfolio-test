import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { imageOptions } from "./lib/images.js";
import { installAssetResolver } from "./lib/markdown.js";
import { refreshAssets } from "./lib/assets.js";
import { parseFrontMatter } from "./lib/frontmatter.js";

// THE one base-path value. Use "/" for a custom domain or user site (PUB-02, D-20).
const PATH_PREFIX = process.env.PATH_PREFIX ?? "/portfolio-test/";

export default async function (eleventyConfig) {
  eleventyConfig.setFrontMatterParsingOptions({ engines: { yaml: { parse: parseFrontMatter } } });

  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, imageOptions);

  eleventyConfig.amendLibrary("md", (md) => installAssetResolver(md));
  await refreshAssets();
  eleventyConfig.on("eleventy.before", () => refreshAssets());

  // assets/ is never copied (IMG-03); only the stylesheet is passed through.
  eleventyConfig.addPassthroughCopy({ "content/style.css": "style.css" });

  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("content/projects/*.md")
      .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)))
  );

  return {
    dir: { input: "content", includes: "../src/_includes", data: "../src/_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: PATH_PREFIX,
  };
}
