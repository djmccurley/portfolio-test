// Alt-text lint (A11Y-04). Warns, never fails the build, never rewrites the alt text.

const PASTE_DEFAULT = "alt text";

const IMAGE_EXT = /\.(?:webp|png|jpe?g|gif|avif|svg|heic|heif)$/;
// Camera roll names: IMG_1234, DSC-0042, PXL_20261001_123456 (and their _suffix variants).
const CAMERA = /^(?:img|dscn?|pxl|gopr|mvimg)[ _-]?\d{3,}(?:[_-][a-z0-9]+)*$/;
// Screenshot names: "Screenshot 2026-10-01 at 10.00.00", "screen shot 2026-10-01".
const SCREENSHOT = /^screen ?shot[ _-]+\d{4}/;

const norm = (s) => s.normalize("NFC").toLowerCase();

// Percent-decoded basename of a src with any query string or fragment removed.
function basenameOf(src) {
  const clean = String(src ?? "").split(/[?#]/)[0];
  const raw = clean.slice(clean.lastIndexOf("/") + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// Returns "empty" | "paste-default" | "filename" | null for an alt string.
export function altIssue(alt, src) {
  const text = String(alt ?? "").trim();
  if (text === "") return "empty";
  const a = norm(text);
  if (a === PASTE_DEFAULT) return "paste-default";
  if (IMAGE_EXT.test(a) || CAMERA.test(a) || SCREENSHOT.test(a)) return "filename";
  const base = norm(basenameOf(src));
  if (base !== "") {
    const stem = base.replace(/\.[^.]+$/, "");
    if (a === base || (stem !== "" && a === stem)) return "filename";
  }
  return null;
}

// The exact UI-SPEC "Build warnings" copy. `{decorative}` in the first line is literal text.
export function altWarning(file, src, alt, kind) {
  switch (kind) {
    case "empty":
      return `WARN ${file}: image ${src} has empty alt text. Describe it, or add {decorative} if it is purely visual.`;
    case "paste-default":
      return `WARN ${file}: image ${src} still has the paste placeholder alt "${PASTE_DEFAULT}". Replace it with a description.`;
    case "filename":
      return `WARN ${file}: image ${src} has alt text that looks like a filename ("${alt}"). Describe what the image shows.`;
    default:
      throw new Error(`unknown alt issue kind: ${kind}`);
  }
}

// One warning per file|src|kind per build.
const seen = new Set();

export function resetAltWarnings() {
  seen.clear();
}

export function warnAlt(file, src, alt, decorative) {
  if (decorative) return;
  const kind = altIssue(alt, src);
  if (!kind) return;
  const key = `${file}|${src}|${kind}`;
  if (seen.has(key)) return;
  seen.add(key);
  console.warn(altWarning(file, src, alt, kind));
}

// Linear, non-nested matchers (T-02-08): one tag matcher and one attribute matcher.
const IMG_TAG = /<img\b[^>]*>/gi;

function attrValue(tag, name) {
  const m = new RegExp(`(?<=\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(tag);
  if (!m) return undefined;
  return m[1] ?? m[2] ?? m[3] ?? "";
}

// Lints every <img> in a raw HTML string. A missing alt attribute counts as empty;
// an explicit alt="" is the owner's own decorative marker, so it stays silent.
export function lintRawHtml(file, html) {
  for (const [tag] of String(html ?? "").matchAll(IMG_TAG)) {
    const src = attrValue(tag, "src");
    if (src === undefined) continue;
    const alt = attrValue(tag, "alt");
    if (alt === "") continue;
    warnAlt(file, src, alt ?? "", false);
  }
}
