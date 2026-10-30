import markdownItAttrs from "markdown-it-attrs";
import markdownItContainer from "markdown-it-container";
import { locator } from "./locate.js";
import { renderVideo, renderItch } from "./embeds.js";

// Responsive `sizes` per layout block (UI-SPEC "Image sizes per block").
export const LAYOUT_SIZES = {
  "grid-2": "(min-width: 90em) 632px, (min-width: 40em) 45vw, 90vw",
  "grid-3": "(min-width: 90em) 416px, (min-width: 60em) 30vw, (min-width: 40em) 45vw, 90vw",
  "grid-4": "(min-width: 90em) 308px, (min-width: 60em) 22vw, (min-width: 40em) 45vw, 90vw",
  full: "100vw",
};

// Embed handlers: block name -> handler(args, ctx) returning an HTML string.
// ctx = { file, line, fail(message) }.
export const EMBEDS = new Map();
EMBEDS.set("video", renderVideo);
EMBEDS.set("itch", renderItch);

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

const CLOSER = /^\s*:{3,}\s*$/;
const ONLY_IMAGES = "may only contain images. Move the text outside the block or use raw HTML.";

const isBreak = (c) => c.type === "softbreak" || c.type === "hardbreak";

// Index of the first inline child that is not an image, a line break or blank text.
function firstNonImage(inline) {
  return (inline?.children ?? []).findIndex(
    (c) => !(c.type === "image" || isBreak(c) || (c.type === "text" && c.content.trim() === ""))
  );
}

// Body-relative line of inline child `index` (each line break moves down one source line).
function childLine(inline, index) {
  return inline.map[0] + inline.children.slice(0, index).filter(isBreak).length;
}

// Remember the source line of every image so errors can point at the right line of a multi-line paste.
function annotateImageLines(tokens) {
  for (const t of tokens) {
    if (t.type !== "inline" || !t.map) continue;
    let row = t.map[0];
    for (const c of t.children ?? []) {
      if (isBreak(c)) row++;
      else if (c.type === "image") c.meta = { ...c.meta, lineIndex: row };
    }
  }
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
    const loc = locator(state);
    const tokens = state.tokens;
    const lines = state.src.split("\n");
    annotateImageLines(tokens);

    let current = null; // the block we are inside: { name, token, layout, embed, images }
    let paraDecorative = false;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const flagged = stripDecorative(token);
      switch (token.type) {
        case "container_block_open": {
          const name = blockName(token);
          if (current) {
            loc.fail(
              token,
              `blocks cannot be nested: "::: ${name}" is inside "::: ${current.name}". Close the first block with ":::" before opening the next.`
            );
          }
          if (token.level > 0) {
            loc.fail(
              token,
              `block "::: ${name}" cannot go inside a list or quote. Start the fence at the beginning of a line.`
            );
          }
          const layout = Object.hasOwn(LAYOUT_SIZES, name);
          const embed = EMBEDS.has(name);
          if (!layout && !embed) {
            const valid = [...Object.keys(LAYOUT_SIZES), ...EMBEDS.keys()].join(", ");
            loc.fail(token, `unknown block "::: ${name}". Valid blocks: ${valid}.`);
          }
          // The container plugin silently ends an unclosed block at the end of its parent.
          if (!CLOSER.test(lines[token.map[1]] ?? "")) {
            loc.fail(token, `block "::: ${name}" is never closed. Add ":::" on its own line after the content.`);
          }
          current = { name, token, layout, embed, images: 0 };
          if (layout) {
            token.meta = { html: `<div class="layout ${name}">\n` };
          } else {
            const args = token.info.trim().slice(name.length).trim();
            const ctx = { file: loc.file, line: loc.lineOf(token), fail: (message) => loc.fail(token, message) };
            token.meta = { embed: true, html: EMBEDS.get(name)(args, ctx) };
            if (tokens[i + 1]?.type !== "container_block_close") {
              ctx.fail(`block "::: ${name}" takes no content. Put ":::" on the line right after the fence.`);
            }
          }
          break;
        }
        case "container_block_close": {
          if (current.layout && current.images === 0) {
            loc.fail(current.token, `block "::: ${current.name}" has no images.`);
          }
          if (current.embed) token.meta = { embed: true };
          current = null;
          break;
        }
        case "paragraph_open": {
          paraDecorative = flagged;
          const inline = tokens[i + 1];
          const open = current?.layout ? current.name : null;
          if (open && !isImageOnly(inline)) {
            loc.failAtLine(childLine(inline, firstNonImage(inline)), `block "::: ${open}" ${ONLY_IMAGES}`);
          }
          if (!open && !current) {
            const stray = inline.content.split("\n").findIndex((line) => CLOSER.test(line));
            if (stray >= 0) loc.failAtLine(token.map[0] + stray, '":::" has no block to close. Remove it.');
          }
          if (!isImageOnly(inline)) break;
          if (open) current.images += inline.children.filter((c) => c.type === "image").length;
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
          break;
        }
        case "paragraph_close":
          paraDecorative = false;
          break;
        case "inline":
          for (const child of token.children ?? []) {
            const marked = stripDecorative(child);
            if (child.type === "image" && (marked || paraDecorative)) makeDecorative(child);
          }
          break;
        default:
          // Headings, lists, quotes, code, raw HTML and rules have no place in a layout block.
          if (current?.layout) loc.fail(token, `block "::: ${current.name}" ${ONLY_IMAGES}`);
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
