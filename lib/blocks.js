import markdownItAttrs from "markdown-it-attrs";
import markdownItContainer from "markdown-it-container";

// Responsive `sizes` per layout block (UI-SPEC "Image sizes per block").
export const LAYOUT_SIZES = {
  "grid-2": "(min-width: 90em) 632px, (min-width: 40em) 45vw, 90vw",
  "grid-3": "(min-width: 90em) 416px, (min-width: 60em) 30vw, (min-width: 40em) 45vw, 90vw",
  "grid-4": "(min-width: 90em) 308px, (min-width: 60em) 22vw, (min-width: 40em) 45vw, 90vw",
  full: "100vw",
};

// Embed handlers: block name -> handler(args, ctx) returning an HTML string.
// ctx = { file, line, fail(message) }. Plan 02-04 registers "video" and "itch".
export const EMBEDS = new Map();

// A paragraph holds only images when every inline child is an image, a soft break or blank text.
function isImageOnly(inline) {
  const kids = inline?.children ?? [];
  let images = 0;
  for (const c of kids) {
    if (c.type === "image") images++;
    else if (c.type === "softbreak") continue;
    else if (c.type === "text" && c.content.trim() === "") continue;
    else return false;
  }
  return images > 0;
}

function blockName(token) {
  return token.info.trim().split(/\s+/)[0];
}

// `{decorative}` marks an image whose alt is intentionally empty (A11Y-04). The marker is
// consumed here so it never reaches the HTML.
function stripDecorative(token) {
  const idx = token.attrIndex("decorative");
  if (idx < 0) return false;
  token.attrs.splice(idx, 1);
  return true;
}

function makeDecorative(img) {
  img.meta = { ...img.meta };
  img.meta.decorative = true;
  img.children = [];
  img.content = "";
}

export function installBlocks(md) {
  md.use(markdownItAttrs, { allowedAttributes: ["class", "decorative"] });

  // One catch-all container: unknown names reach the core rule instead of becoming paragraph text.
  md.use(markdownItContainer, "block", {
    validate: (params) => params.trim().length > 0,
    render(tokens, idx) {
      const t = tokens[idx];
      if (t.nesting === 1) return t.meta?.html ?? "";
      return t.meta?.embed ? "" : "</div>\n";
    },
  });

  md.core.ruler.push("blocks", (state) => {
    const tokens = state.tokens;
    let open = null; // name of the layout block we are inside, if any
    let paraDecorative = false;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const flagged = stripDecorative(token);
      if (token.type === "container_block_open") {
        const name = blockName(token);
        if (name in LAYOUT_SIZES) {
          token.meta = { html: `<div class="layout ${name}">\n` };
          open = name;
        }
      } else if (token.type === "container_block_close") {
        open = null;
      } else if (token.type === "paragraph_open") {
        paraDecorative = flagged;
        const inline = tokens[i + 1];
        if (!isImageOnly(inline)) continue;
        const titled = inline.children.some((c) => c.type === "image" && c.attrGet("title"));
        if (open || titled) {
          // One <figure> per image: drop the <p> and the soft breaks between the images.
          token.hidden = true;
          tokens[i + 2].hidden = true;
          inline.children = inline.children.filter((c) => c.type === "image");
          for (const img of inline.children) {
            img.meta = { ...img.meta, figure: true, block: open };
            if (open) img.attrSet("sizes", LAYOUT_SIZES[open]);
          }
        } else {
          token.attrJoin("class", "lone-image");
        }
      } else if (token.type === "paragraph_close") {
        paraDecorative = false;
      } else if (token.type === "inline") {
        for (const child of token.children ?? []) {
          const marked = stripDecorative(child);
          if (child.type === "image" && (marked || paraDecorative)) makeDecorative(child);
        }
      }
    }
  });

  // Images marked as figures render as <figure>; the title becomes the caption (D-02).
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (!token.meta?.figure) return defaultImage(tokens, idx, options, env, self);
    const title = token.attrGet("title");
    token.attrs = token.attrs.filter(([name]) => name !== "title");
    const img = defaultImage(tokens, idx, options, env, self);
    const caption = title ? `<figcaption>${md.utils.escapeHtml(title)}</figcaption>` : "";
    return `<figure>${img}${caption}</figure>\n`;
  };
}
