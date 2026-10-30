// Local reflow check (A11Y-02): serves _site under the real path prefix, loads every page, a stress page of
// worst-case content and a canary in headless Chrome at 320 and 640 CSS px, and fails on any horizontal overflow.
// Not part of `npm test` or CI because it needs a browser. Usage: node scripts/check-reflow.mjs [siteDir]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIDTHS = [320, 640];
const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">';
const SKIP_DIRS = new Set(["img", "video", "pdf"]);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const siteDir = path.resolve(process.argv[2] ?? "_site");

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((c) => c && fs.existsSync(c));
}

// Same default as test/helpers/site.js defaultPrefix(), unless PATH_PREFIX is set.
function readPrefix() {
  let p = process.env.PATH_PREFIX;
  if (p === undefined) {
    const cfg = fs.readFileSync(path.join(ROOT, "eleventy.config.js"), "utf8");
    const m = cfg.match(/PATH_PREFIX \?\? "([^"]+)"/);
    if (!m) throw new Error("PATH_PREFIX default not found in eleventy.config.js");
    p = m[1];
  }
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function listPages(dir, rel = "") {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (rel === "" && SKIP_DIRS.has(e.name)) continue;
      out.push(...listPages(dir, path.posix.join(rel, e.name)));
    } else if (e.name === "index.html") {
      out.push(rel === "" ? "" : `${rel}/`);
    }
  }
  return out;
}

function stressPage(prefix) {
  const word = (n, c) => c.repeat(n);
  const link = `https://example.com/${word(180, "a")}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${VIEWPORT}
<title>Reflow stress</title>
<link rel="stylesheet" href="${prefix}style.css">
</head>
<body>
<header><div class="header-row"><a class="site-name" href="${prefix}">Reflow stress</a><nav aria-label="Main"><ul>
<li><a href="${prefix}work/">Work</a></li><li><a href="${prefix}cv/">CV</a></li><li><a href="${prefix}teaching/">Teaching</a></li>
</ul></nav></div></header>
<main id="main">
<h1>${word(80, "H")}</h1>
<p>${word(90, "p")}</p>
<dl>
<dt>Role</dt><dd>Design</dd>
<dt>Link</dt><dd><a href="${link}">${link}</a></dd>
</dl>
<blockquote>${word(90, "q")}</blockquote>
<figure><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" width="1" height="1"><figcaption>${word(90, "c")}</figcaption></figure>
<pre>${word(200, "x")}</pre>
<table><thead><tr><th>${word(40, "A")}</th><th>${word(40, "B")}</th><th>${word(40, "C")}</th><th>${word(40, "D")}</th><th>${word(40, "E")}</th><th>${word(40, "F")}</th></tr></thead>
<tbody><tr><td>${word(40, "a")}</td><td>${word(40, "b")}</td><td>${word(40, "c")}</td><td>${word(40, "d")}</td><td>${word(40, "e")}</td><td>${word(40, "f")}</td></tr></tbody></table>
<ul class="filters">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<li><a href="${prefix}tags/t${n}/">Filter number ${n}</a></li>`).join("")}</ul>
<nav class="pager" aria-label="Projects"><ul>
<li><a href="${prefix}a/" rel="prev"><span aria-hidden="true">← </span>Previous: ${word(60, "P")}</a></li>
<li><a href="${prefix}b/" rel="next">Next: ${word(60, "N")}<span aria-hidden="true"> →</span></a></li>
</ul></nav>
</main>
</body>
</html>
`;
}

function canaryPage(prefix) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${VIEWPORT}
<title>Reflow canary</title>
<link rel="stylesheet" href="${prefix}style.css">
</head>
<body>
<main id="main"><div style="width: 2000px">canary</div></main>
</body>
</html>
`;
}

// The wrapper loads the target in an iframe of exactly w CSS px: headless Chrome will not shrink its own window
// below about 500px. Per-element scrollWidth is used for diagnostics because overflowing text does not change
// its box rect.
function wrapperPage(w, p) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>measure</title></head>
<body style="margin:0">
<iframe id="f" src="${esc(p)}" style="width:${w}px;height:800px;border:0;display:block"></iframe>
<pre id="out">pending</pre>
<script>
var f = document.getElementById("f");
f.addEventListener("load", function () {
  setTimeout(function () {
    var d = f.contentDocument;
    var root = d.documentElement;
    var bad = [];
    d.body.querySelectorAll("*").forEach(function (el) {
      if (el.closest(".skip-link, .visually-hidden")) return;
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
        var c = el.classList[0];
        bad.push(el.tagName.toLowerCase() + (c ? "." + c : ""));
      }
    });
    document.getElementById("out").textContent =
      "RESULT scrollWidth=" + root.scrollWidth + " clientWidth=" + root.clientWidth + " offenders=" + bad.join(",");
  }, 500);
});
</script>
</body></html>
`;
}

function makeServer(prefix) {
  return http.createServer((req, res) => {
    const send = (code, type, body) => {
      res.writeHead(code, { "content-type": type });
      res.end(body);
    };
    let url;
    try {
      url = new URL(req.url, "http://127.0.0.1");
    } catch {
      return send(400, "text/plain", "bad request");
    }
    const pathname = url.pathname;
    if (pathname === "/__measure") {
      const w = Number(url.searchParams.get("w"));
      const p = url.searchParams.get("p") ?? "";
      if (!Number.isInteger(w) || w < 200 || w > 2000) return send(400, "text/plain", "bad w");
      if (!(p.startsWith(prefix) || p.startsWith("/__reflow/"))) return send(400, "text/plain", "bad p");
      return send(200, TYPES[".html"], wrapperPage(w, p));
    }
    if (pathname === "/__reflow/stress/") return send(200, TYPES[".html"], stressPage(prefix));
    if (pathname === "/__reflow/canary/") return send(200, TYPES[".html"], canaryPage(prefix));
    if (!pathname.startsWith(prefix)) return send(404, "text/plain", "not found");

    let rel;
    try {
      rel = decodeURIComponent(pathname.slice(prefix.length));
    } catch {
      return send(400, "text/plain", "bad path");
    }
    let file = path.resolve(siteDir, rel);
    if (file !== siteDir && !file.startsWith(siteDir + path.sep)) return send(404, "text/plain", "not found");
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      const type = TYPES[path.extname(file).toLowerCase()];
      if (!type) return send(404, "text/plain", "not found");
      return send(200, type, fs.readFileSync(file));
    } catch {
      return send(404, "text/plain", "not found");
    }
  });
}

async function measure(chrome, profile, base, w, p) {
  const url = `${base}/__measure?w=${w}&p=${encodeURIComponent(p)}`;
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profile}`,
    "--virtual-time-budget=5000",
    "--dump-dom",
    url,
  ];
  let stdout = "";
  try {
    ({ stdout } = await run(chrome, args, { timeout: 60000, maxBuffer: 32 * 1024 * 1024 }));
  } catch (e) {
    stdout = e.stdout ?? "";
  }
  const m = /RESULT scrollWidth=(\d+) clientWidth=(\d+) offenders=([^\n<]*)/.exec(stdout);
  if (!m) return { ok: false, text: "no RESULT" };
  const scrollWidth = Number(m[1]);
  const clientWidth = Number(m[2]);
  return { ok: scrollWidth === clientWidth, scrollWidth, clientWidth, offenders: m[3].trim(), overflow: scrollWidth > clientWidth };
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error("check-reflow: Chrome not found. Set CHROME_BIN to a Chrome or Chromium binary.");
    return 2;
  }
  if (!fs.existsSync(path.join(siteDir, "index.html"))) {
    console.error(`check-reflow: ${path.relative(process.cwd(), siteDir) || siteDir}/index.html not found. Run npm run build first.`);
    return 2;
  }
  const prefix = readPrefix();
  const pages = listPages(siteDir).map((d) => `${prefix}${d}`);
  if (fs.existsSync(path.join(siteDir, "404.html"))) pages.push(`${prefix}404.html`);
  pages.sort();
  const targets = [...pages, "/__reflow/stress/"];

  const server = makeServer(prefix);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "reflow-chrome-"));
  let failed = false;
  try {
    for (const p of targets) {
      for (const w of WIDTHS) {
        const r = await measure(chrome, profile, base, w, p);
        if (r.ok) {
          console.log(`ok   ${w} ${p}`);
        } else {
          failed = true;
          if (r.text) console.log(`FAIL ${w} ${p} ${r.text}`);
          else console.log(`FAIL ${w} ${p} scrollWidth=${r.scrollWidth} clientWidth=${r.clientWidth} offenders=${r.offenders}`);
        }
      }
    }
    let canaryOverflowed = true;
    for (const w of WIDTHS) {
      const r = await measure(chrome, profile, base, w, "/__reflow/canary/");
      if (!r.overflow) canaryOverflowed = false;
    }
    if (!canaryOverflowed) {
      failed = true;
      console.log("FAIL canary did not overflow: the check is not measuring");
    } else {
      console.log("ok   canary overflowed at both widths (the check is measuring)");
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    server.closeAllConnections?.();
    fs.rmSync(profile, { recursive: true, force: true });
  }
  if (failed) return 1;
  console.log(`check-reflow: ${targets.length} pages x ${WIDTHS.length} widths, no horizontal overflow`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
