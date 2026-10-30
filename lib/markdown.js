import fs from "node:fs";
import path from "node:path";
import { resolveAsset, hasAlpha } from "./assets.js";
import { locator } from "./locate.js";
import { warnAlt, lintRawHtml } from "./alt-lint.js";
import { PDF_MAX_BYTES, PDF_MAX_MB } from "./limits.js";
import { registerPdf, formatPdfSize } from "./media.js";

const REMOTE = /^([a-z][a-z0-9+.-]*:)?\/\//i;
// Any scheme (mailto:, https:, ...) or protocol-relative URL: never an assets/ file.
const SCHEME = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

export function installAssetResolver(md) {
  md.core.ruler.push("asset_resolver", (state) => {
    const page = state.env?.page;
    if (!page?.inputPath) return;
    const loc = locator(state);
    let first = false;
    for (const block of state.tokens) {
      if (block.type === "html_block") lintRawHtml(loc.file, block.content);
      const children = block.children ?? [];
      let row = 0; // soft/hard breaks seen so far in this block, so a link error points at its own line
      for (let i = 0; i < children.length; i++) {
        const t = children[i];
        if (t.type === "softbreak" || t.type === "hardbreak") row += 1;
        if (t.type === "link_open") {
          // A plain markdown link to a PDF in assets/ becomes a /pdf/ link labelled with type and size (D-17).
          const href = t.attrGet("href") ?? "";
          const cut = href.search(/[?#]/);
          const pathPart = cut === -1 ? href : href.slice(0, cut);
          const keep = cut === -1 ? "" : href.slice(cut);
          if (!/\.pdf$/i.test(pathPart) || SCHEME.test(href)) continue;
          const fail = (message) =>
            block.map ? loc.failAtLine(block.map[0] + row, message) : loc.fail(block, message);
          const abs = resolveAsset(pathPart);
          if (!abs) fail(`PDF not found in assets/: ${href}`);
          const name = path.basename(abs);
          const bytes = fs.statSync(abs).size;
          if (bytes > PDF_MAX_BYTES) {
            fail(`PDF ${name} is ${(bytes / 1048576).toFixed(1)} MB; the limit is ${PDF_MAX_MB} MB.`);
          }
          registerPdf(abs);
          // Root-absolute so HtmlBasePlugin adds the path prefix. No target, no download.
          t.attrSet("href", `/pdf/${encodeURIComponent(name)}${keep}`);
          // Links cannot nest in CommonMark, so the first link_close after this one is its match.
          const close = children.findIndex((c, j) => j > i && c.type === "link_close");
          if (close !== -1) {
            const suffix = new state.Token("text", "", 0);
            suffix.content = ` (PDF, ${formatPdfSize(bytes)})`;
            children.splice(close, 0, suffix);
          }
          continue;
        }
        if (t.type === "html_inline") lintRawHtml(loc.file, t.content);
        if (t.type !== "image") continue;
        const src = t.attrGet("src");
        warnAlt(loc.file, src, t.content, Boolean(t.meta?.decorative));
        if (REMOTE.test(src) || /^data:/i.test(src)) continue;
        const abs = resolveAsset(src);
        if (!abs) loc.fail(t.meta?.lineIndex === undefined ? block : t, `image not found in assets/: ${src}`);
        t.attrSet("src", path.relative(path.dirname(page.inputPath), abs));
        const base = path.basename(abs).toLowerCase();
        if (base.endsWith(".svg")) t.attrSet("eleventy:formats", "svg");
        else if (base.endsWith(".gif")) t.attrSet("eleventy:formats", "webp,gif");
        else if (hasAlpha(base)) t.attrSet("eleventy:formats", "webp,png");
        if (!first) {
          t.attrSet("loading", "eager");
          t.attrSet("fetchpriority", "high");
          first = true;
        }
      }
    }
  });
}
