import path from "node:path";
import { resolveAsset } from "./assets.js";

const REMOTE = /^([a-z][a-z0-9+.-]*:)?\/\//i;

export function installAssetResolver(md) {
  md.core.ruler.push("asset_resolver", (state) => {
    const page = state.env?.page;
    if (!page?.inputPath) return;
    let first = false;
    for (const block of state.tokens) {
      for (const t of block.children ?? []) {
        if (t.type !== "image") continue;
        const src = t.attrGet("src");
        if (REMOTE.test(src) || /^data:/i.test(src)) continue;
        const abs = resolveAsset(src);
        if (!abs) throw new Error(`${page.inputPath}: image not found in assets/: ${src}`);
        t.attrSet("src", path.relative(path.dirname(page.inputPath), abs));
        if (!first) {
          t.attrSet("loading", "eager");
          t.attrSet("fetchpriority", "high");
          first = true;
        }
      }
    }
  });
}
