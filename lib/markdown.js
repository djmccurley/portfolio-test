import path from "node:path";
import { resolveAsset, hasAlpha } from "./assets.js";
import { locator } from "./locate.js";

const REMOTE = /^([a-z][a-z0-9+.-]*:)?\/\//i;

export function installAssetResolver(md) {
  md.core.ruler.push("asset_resolver", (state) => {
    const page = state.env?.page;
    if (!page?.inputPath) return;
    const loc = locator(state);
    let first = false;
    for (const block of state.tokens) {
      for (const t of block.children ?? []) {
        if (t.type !== "image") continue;
        const src = t.attrGet("src");
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
