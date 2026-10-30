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
  return null;
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
