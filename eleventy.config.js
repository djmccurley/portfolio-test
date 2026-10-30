import path from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";
import Image, { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { imageOptions } from "./lib/images.js";
import { installBlocks } from "./lib/blocks.js";
import { zoomPlugin } from "./lib/zoom.js";
import { installAssetResolver } from "./lib/markdown.js";
import { refreshAssets, resolveAsset, hasAlpha } from "./lib/assets.js";
import { copyMedia } from "./lib/media.js";
import { resetAltWarnings } from "./lib/alt-lint.js";
import { parseFrontMatter, validDate } from "./lib/frontmatter.js";
import { addValidation, validateTagDefs } from "./lib/validate.js";
import { showDrafts, findDrafts, NAV_PAGES, navDraftWarning, hiddenNavSlugs } from "./lib/drafts.js";
import tagDefs from "./src/_data/tags.js";

// THE one base-path value. Use "/" for a custom domain or user site (PUB-02, D-20).
const PATH_PREFIX = process.env.PATH_PREFIX ?? "/portfolio-test/";

// Eleventy throws its own error on dates it cannot parse. Hide those so lib/validate.js
// can report them with the file named (D-23). The raw value is re-read there.
function lenientFrontMatter(str) {
  const data = parseFrontMatter(str);
  if (typeof data.date === "string" && !validDate(data.date)) delete data.date;
  return data;
}

export default async function (eleventyConfig) {
  // The global `tags` list (src/_data/tags.js) must not merge into each project's own `tags`.
  eleventyConfig.setDataDeepMerge(false);
  // Eleventy reads the global `tags` as every page's own tags and aborts on anything but a list, with a
  // message that does not name the file. Report that case here, before it gets that far.
  if (!Array.isArray(tagDefs)) throw new Error("Content validation failed:\n" + validateTagDefs(tagDefs).join("\n"));
  eleventyConfig.setFrontMatterParsingOptions({ engines: { yaml: { parse: lenientFrontMatter } } });
  // A skipped template never renders, joins no collection and registers no media, which covers D-14 and D-17
  // in one place. Strict `=== true`: any non-boolean `draft` stays in the build so validation can reject it (D-19).
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft === true && !showDrafts()) return false;
  });

  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, imageOptions);
  // Priorities are descending: eleventy-img (-1) runs first and publishes the hashed variants, then the
  // zoom links are finished from them, then HtmlBasePlugin (-2) adds the path prefix to their hrefs.
  eleventyConfig.htmlTransformer.addPosthtmlPlugin("html", zoomPlugin, { priority: -1.5 });

  // Read by the header nav in src/_includes/base.njk. A function, so it runs after Eleventy has set the run mode.
  eleventyConfig.addGlobalData("hiddenNav", () => hiddenNavSlugs());

  eleventyConfig.amendLibrary("md", (md) => {
    installBlocks(md);
    installAssetResolver(md);
  });
  await refreshAssets();
  eleventyConfig.on("eleventy.before", () => {
    resetAltWarnings(); // each rebuild under `npm start` prints the current warnings again
    // A drafted CV/Teaching page loses its header link on the live site; tell the owner in either run mode (D-18).
    for (const d of findDrafts()) if (d.kind === "page" && NAV_PAGES.has(d.slug)) console.warn(navDraftWarning(d));
    return refreshAssets();
  });
  // Publish only the videos (and processed posters) that a `::: video` block named.
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    await copyMedia(dir.output);
  });

  // assets/ is never copied (IMG-03); only the stylesheet and the lightbox script are passed through.
  eleventyConfig.addPassthroughCopy({ "content/style.css": "style.css", "content/lightbox.js": "lightbox.js" });

  // A card cover is a bare asset name or link; eleventy-img resolves a relative src against the page
  // being rendered, so the path is rewritten relative to that page (a function, so `this.page` is bound).
  eleventyConfig.addFilter("assetSrc", function (cover) {
    const abs = resolveAsset(String(cover));
    if (!abs) throw new Error(`${this.page.inputPath}: cover not found in assets/: ${cover}`);
    return path.relative(path.dirname(this.page.inputPath), abs);
  });

  // The link-preview image: a 1200px JPEG derivative of a cover or the default share image (PNG when the source has
  // transparency). Own options on purpose: imageOptions' transparent format filtering would drop the JPEG for an alpha
  // source and its animated sharp option is wrong for a GIF cover. eleventy-img never upscales (D-08).
  eleventyConfig.addFilter("ogImage", async function (src) {
    const abs = resolveAsset(String(src));
    if (!abs) throw new Error(`${this.page.inputPath}: share image not found in assets/: ${src}`);
    const fmt = hasAlpha(path.basename(abs).toLowerCase()) ? "png" : "jpeg";
    const meta = await Image(abs, { widths: [1200], formats: [fmt], urlPath: "/img/", outputDir: "_site/img/", failOnError: true });
    return meta[fmt][0];
  });

  // Newest first by the written date string; identical dates fall back to the input path so the
  // order is the same on every build.
  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("content/projects/*.md")
      .sort(
        (a, b) =>
          String(b.data.date).localeCompare(String(a.data.date)) || a.inputPath.localeCompare(b.inputPath)
      )
  );

  // Projects carrying a tag slug (a single string or a list in front matter).
  eleventyConfig.addFilter("withTag", (items, slug) =>
    (items ?? []).filter((item) => {
      const t = item.data.tags;
      return (Array.isArray(t) ? t : [t]).includes(slug);
    })
  );

  // Tag definitions with at least one project, in src/_data/tags.js order: one page and one filter link each.
  eleventyConfig.addCollection("tagPages", (api) => {
    if (!Array.isArray(tagDefs)) return [];
    const used = new Set();
    for (const item of api.getFilteredByGlob("content/projects/*.md")) {
      const t = item.data.tags;
      for (const s of Array.isArray(t) ? t : [t]) used.add(s);
    }
    return tagDefs.filter((t) => t?.slug && used.has(t.slug));
  });

  addValidation(eleventyConfig);

  return {
    dir: { input: "content", includes: "../src/_includes", data: "../src/_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: PATH_PREFIX,
  };
}
