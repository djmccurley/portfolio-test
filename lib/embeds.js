// Embed blocks: `::: video <url> "Title"` and `::: itch ...`. Handlers are registered in
// lib/blocks.js (EMBEDS) and return the HTML for the whole block.
// The iframe src is always rebuilt from a parsed ID, never copied from the pasted URL.

export const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
export const ITCH_EMBED_SUFFIXES = [".itch.io", ".itch.zone"];
export const ITCH_PAGE_SUFFIXES = [".itch.io"];

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Splits fence text into bare words and "quoted strings".
export function parseFenceArgs(args) {
  const out = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(args)) !== null) {
    if (m[1] !== undefined) out.push({ value: m[1], quoted: true });
    else out.push({ value: m[2], quoted: false });
  }
  return out;
}

function parseUrl(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function youtubeId(u) {
  const parts = u.pathname.split("/").filter(Boolean);
  if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") return parts[0];
  if (parts[0] === "watch") return u.searchParams.get("v");
  if (["embed", "shorts", "live", "v"].includes(parts[0])) return parts[1];
  return null;
}

// Returns the privacy-friendly player src for a YouTube URL, or null when it is not recognised.
export function videoEmbedSrc(url) {
  const u = parseUrl(url);
  if (!u || (u.protocol !== "https:" && u.protocol !== "http:")) return null;
  if (YT_HOSTS.has(u.hostname)) {
    const id = youtubeId(u);
    return id && YT_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (VIMEO_HOSTS.has(u.hostname)) return vimeoSrc(u);
  return null;
}

// vimeo.com/<id>, vimeo.com/<id>/<hash>, vimeo.com/<id>?h=<hash>, player.vimeo.com/video/<id>
function vimeoSrc(u) {
  const parts = u.pathname.split("/").filter(Boolean);
  if (u.hostname === "player.vimeo.com") {
    if (parts[0] !== "video") return null;
    parts.shift();
  }
  if (!parts[0] || !/^\d+$/.test(parts[0])) return null;
  let hash = null;
  const queryHash = u.searchParams.get("h");
  if (queryHash !== null) {
    if (!/^[0-9a-f]+$/i.test(queryHash)) return null;
    hash = queryHash;
  } else if (parts[1] && /^[0-9a-f]+$/i.test(parts[1])) {
    hash = parts[1];
  }
  return `https://player.vimeo.com/video/${parts[0]}?${hash ? `h=${hash}&` : ""}dnt=1`;
}

export function renderVideo(args, ctx) {
  const tokens = parseFenceArgs(args);
  let full = false;
  if (tokens.length && !tokens[0].quoted && tokens[0].value === "full") {
    full = true;
    tokens.shift();
  }
  const [target, title, ...rest] = tokens;
  if (!target || target.quoted || !title || !title.quoted || title.value.trim() === "") {
    ctx.fail('video block needs a quoted title: ::: video <url> "Title"');
  }
  if (rest.length) {
    ctx.fail(`unexpected "${rest[0].value}" in video block. Use: ::: video [full] <url> "Title"`);
  }
  const src = /^https?:\/\//i.test(target.value) ? videoEmbedSrc(target.value) : null;
  if (!src) {
    ctx.fail(
      `video URL not recognised: ${target.value}. Use a youtube.com, youtu.be or vimeo.com link, or a file in assets/.`
    );
  }
  return (
    `<div class="${full ? "embed full" : "embed"}"><iframe src="${escapeAttr(src)}" title="${escapeAttr(title.value)}" ` +
    `loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen="" ` +
    `referrerpolicy="strict-origin-when-cross-origin"></iframe></div>\n`
  );
}

const ITCH_NEEDS = 'itch block needs: ::: itch <embed-url> <W>x<H> "Title" <itch-page-url>';

const hostMatches = (host, root, suffixes) => host === root || suffixes.some((s) => host.endsWith(s));

export function renderItch(args, ctx) {
  const tokens = parseFenceArgs(args);
  let full = false;
  if (tokens.length && !tokens[0].quoted && tokens[0].value === "full") {
    full = true;
    tokens.shift();
  }
  const [embed, dims, title, page, ...rest] = tokens;
  const size = dims && !dims.quoted ? /^(\d{2,5})x(\d{2,5})$/.exec(dims.value) : null;
  if (
    !embed || embed.quoted || !size || !title || !title.quoted || title.value.trim() === "" ||
    !page || page.quoted || rest.length
  ) {
    ctx.fail(ITCH_NEEDS);
  }
  const embedUrl = parseUrl(embed.value);
  const pageUrl = parseUrl(page.value);
  if (!embedUrl || !pageUrl) ctx.fail(ITCH_NEEDS);
  if (embedUrl.protocol !== "https:" || !hostMatches(embedUrl.hostname, "itch.io", ITCH_EMBED_SUFFIXES)) {
    ctx.fail(
      `itch embed URL host "${embedUrl.hostname}" is not allowed. Copy the iframe src from the game's itch.io "Embed game" page ` +
        "(allowed: itch.io, *.itch.io, *.itch.zone; widen ITCH_EMBED_SUFFIXES in lib/embeds.js if itch changes it)."
    );
  }
  if (pageUrl.protocol !== "https:" || !hostMatches(pageUrl.hostname, "itch.io", ITCH_PAGE_SUFFIXES)) {
    ctx.fail(`itch page URL must be an https link on itch.io: ${page.value}`);
  }
  const safeTitle = escapeAttr(title.value);
  return (
    `<div class="${full ? "embed itch full" : "embed itch"}" style="--w:${size[1]};--h:${size[2]}">` +
    `<iframe src="${escapeAttr(embedUrl.href)}" title="${safeTitle}" loading="lazy" allow="fullscreen" allowfullscreen=""></iframe></div>\n` +
    `<p class="embed-link"><a href="${escapeAttr(pageUrl.href)}">Play on itch.io` +
    `<span class="visually-hidden">: ${safeTitle}</span></a></p>\n`
  );
}
