import fs from "node:fs";

const lineCount = (text) => text.replace(/\n+$/, "").split("\n").length;

// markdown-it only sees the body: Eleventy strips the front matter first, so token.map
// is relative to the body. The offset is how many raw file lines were removed (0 when
// the file cannot be read, e.g. in unit tests that render strings).
function frontMatterOffset(file, src) {
  try {
    const raw = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
    return Math.max(0, lineCount(raw) - lineCount(src));
  } catch {
    return 0;
  }
}

// Reports positions in terms of the authored file: "{file}:{line}: message".
export function locator(state) {
  const file = state.env?.page?.inputPath ?? "markdown";
  const offset = frontMatterOffset(file, state.src);
  // `meta.lineIndex` (body-relative, 0-based) is set by the blocks rule for images, which can
  // sit on any line of a multi-line paragraph; otherwise the token's first line is used.
  const lineOf = (token) => {
    const index = token.meta?.lineIndex ?? token.map?.[0];
    return index === undefined ? "?" : index + 1 + offset;
  };
  return {
    file,
    lineOf,
    fail(token, message) {
      throw new Error(`${file}:${lineOf(token)}: ${message}`);
    },
    failAtLine(lineIndex, message) {
      throw new Error(`${file}:${lineIndex + 1 + offset}: ${message}`);
    },
  };
}
