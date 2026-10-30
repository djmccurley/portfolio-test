import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CSS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "content", "style.css");

// Accepts #rgb or #rrggbb, any case. Anything else is rejected so the owner
// gets a clear message instead of a silently wrong ratio.
export function parseHex(value) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value).trim());
  if (!m) throw new Error(`colour must be a hex value like #0000ee or #00e, got "${value}"`);
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function token(css, name) {
  const root = /:root\s*{([^}]*)}/.exec(css);
  assert.ok(root, "content/style.css has no :root block");
  const m = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(root[1]);
  assert.ok(m, `colour token ${name} is missing from the :root block of content/style.css`);
  return m[1].trim();
}

test("parseHex reads 3- and 6-digit hex case-insensitively", () => {
  assert.deepEqual(parseHex("#00e"), parseHex("#0000EE"));
  assert.deepEqual(parseHex("#fff"), [255, 255, 255]);
});

test("parseHex rejects non-hex values and asks for hex", () => {
  assert.throws(() => parseHex("rgb(0,0,0)"), /hex value/);
  assert.throws(() => parseHex("blue"), /hex value/);
  assert.throws(() => parseHex("#12345"), /hex value/);
});

test("ratio matches known values", () => {
  assert.equal(ratio("#000", "#fff").toFixed(2), "21.00");
  assert.equal(ratio("#0000ee", "#fff").toFixed(1), "9.4");
});

test("ink on paper is at least 4.5:1", () => {
  const css = fs.readFileSync(CSS, "utf8");
  const r = ratio(token(css, "--ink"), token(css, "--paper"));
  assert.ok(r >= 4.5, `--ink on --paper is ${r.toFixed(2)}:1, needs 4.5:1`);
});

test("accent on paper is at least 4.5:1 for text", () => {
  const css = fs.readFileSync(CSS, "utf8");
  const r = ratio(token(css, "--accent"), token(css, "--paper"));
  assert.ok(r >= 4.5, `--accent on --paper is ${r.toFixed(2)}:1, needs 4.5:1 for link text`);
});

test("accent focus outline is at least 3:1 against paper", () => {
  const css = fs.readFileSync(CSS, "utf8");
  const r = ratio(token(css, "--accent"), token(css, "--paper"));
  assert.ok(r >= 3, `--accent focus outline is ${r.toFixed(2)}:1 on --paper, needs 3:1`);
});

test("a missing token fails naming the token", () => {
  assert.throws(() => token(":root { --paper: #fff; }", "--accent"), /--accent is missing/);
});

test("a non-hex token value is reported by parseHex", () => {
  const css = ":root { --accent: rgb(0,0,238); }";
  assert.throws(() => parseHex(token(css, "--accent")), /hex value/);
});
