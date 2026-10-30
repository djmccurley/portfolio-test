// Finishes the zoom links the markdown renderer starts (IMG-05, D-01, D-02).
//
// lib/blocks.js writes `<a class="zoom">` around the images that may be opened full-size, without an
// href: the file names are hashed by eleventy-img, so they only exist once its HTML transform has run.
// This PostHTML plugin runs right after eleventy-img (priority -1) and right before HtmlBasePlugin
// (priority -2), so it reads the final hashed names and the path prefix is added afterwards
// (RESEARCH Pitfall 2). It links the largest variant the pipeline already published, never an original.

const find = (nodes, tag) => {
  for (const n of Array.isArray(nodes) ? nodes : [nodes]) {
    if (!n || typeof n !== "object") continue;
    if (n.tag === tag) return n;
    const hit = n.content && find(n.content, tag);
    if (hit) return hit;
  }
  return null;
};

const candidates = (srcset) =>
  srcset
    .split(",")
    .map((s) => s.trim().split(/\s+/)[0])
    .filter(Boolean);

// { href, img } for the largest published variant inside an `a.zoom` node, or null without an image.
export function zoomHref(a) {
  const img = find(a.content, "img");
  if (!img?.attrs?.src) return null;
  const fallback = img.attrs.srcset ? candidates(img.attrs.srcset).at(-1) : img.attrs.src;
  // Keep an animation animated: link the published gif, not the still webp.
  if (/\.gif($|\?)/i.test(img.attrs.src)) return { href: fallback, img };
  const pic = find(a.content, "picture");
  const source = pic && find(pic.content, "source");
  const href = source?.attrs?.srcset ? candidates(source.attrs.srcset).at(-1) : fallback;
  return { href, img };
}

export function zoomPlugin() {
  return (tree) => {
    tree.match({ tag: "a", attrs: { class: "zoom" } }, (a) => {
      const hit = zoomHref(a);
      if (!hit) {
        // No image survived the transform: leave no link without an href behind.
        return { tag: false, content: (a.content ?? []).filter((n) => !(n && n.attrs?.class === "visually-hidden")) };
      }
      a.attrs.href = hit.href;
      a.attrs["data-width"] = hit.img.attrs.width;
      a.attrs["data-height"] = hit.img.attrs.height;
      return a;
    });
    return tree;
  };
}
