// Alt-text lint (A11Y-04). Warns, never fails the build, never rewrites the alt text.

const PASTE_DEFAULT = "alt text";

// Returns "empty" | "paste-default" | null for an alt string (Task 2 adds "filename").
export function altIssue(alt, src) {
  const text = String(alt ?? "").trim();
  if (text === "") return "empty";
  if (text.toLowerCase() === PASTE_DEFAULT) return "paste-default";
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
