import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = fs.readFileSync(path.join(ROOT, "content", "lightbox.js"), "utf8");

// ---- a minimal fake DOM, just wide enough for content/lightbox.js ----

class El {
  constructor(tag) {
    this.tag = tag;
    this.attrs = {};
    this.children = [];
    this.parent = null;
    this.listeners = {};
    this.dataset = {};
    this.hidden = false;
    this.textContent = "";
    this.focused = 0;
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  hasAttribute(k) { return k in this.attrs; }
  append(...nodes) { for (const n of nodes) { n.parent = this; this.children.push(n); } }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  dispatch(type, ev) { for (const fn of this.listeners[type] ?? []) fn(ev); }
  focus() { this.focused++; }
  matches(sel) {
    if (sel === "a.zoom") return this.tag === "a" && (this.attrs.class ?? "").split(" ").includes("zoom");
    return this.tag === sel;
  }
  closest(sel) {
    for (let n = this; n; n = n.parent) if (n.matches(sel)) return n;
    return null;
  }
  querySelector(sel) {
    for (const c of this.children) {
      if (c.matches(sel)) return c;
      const hit = c.querySelector(sel);
      if (hit) return hit;
    }
    return null;
  }
}

class FakeDialog extends El {
  constructor() {
    super("dialog");
    this.modal = 0;
    this.closed = 0;
  }
  showModal() { this.modal++; }
  close() { this.closed++; this.dispatch("close", {}); }
}

function setup({ withDialog = true, origin = "https://site.test" } = {}) {
  const dialogs = [];
  const doc = new El("document");
  doc.body = new El("body");
  doc.createElement = (tag) => {
    const el = tag === "dialog" ? new FakeDialog() : new El(tag);
    if (tag === "dialog") dialogs.push(el);
    return el;
  };
  const assigned = [];
  const ctx = { document: doc, location: { origin, href: `${origin}/page/`, assign: (u) => assigned.push(u) }, URL };
  if (withDialog) ctx.HTMLDialogElement = class {};
  vm.runInNewContext(SRC, ctx);
  return { doc, dialogs, assigned };
}

// <figure><a class="zoom" href=...><img alt=...><span/></a><figcaption/></figure>
function zoomLink({ href = "https://site.test/img/x-2400.webp", caption = "Caption", figure = true, target } = {}) {
  const a = new El("a");
  a.setAttribute("class", "zoom");
  a.href = href;
  if (target) a.setAttribute("target", target);
  a.dataset = { width: "2400", height: "1500" };
  const img = new El("img");
  img.alt = "A cat";
  a.append(img);
  if (figure) {
    const fig = new El("figure");
    fig.append(a);
    const cap = new El("figcaption");
    cap.textContent = caption;
    if (caption !== null) fig.append(cap);
  }
  return a;
}

function click(target, extra = {}) {
  const ev = { target, button: 0, defaultPrevented: false, prevented: 0, preventDefault() { this.prevented++; this.defaultPrevented = true; }, ...extra };
  return ev;
}

test("without HTMLDialogElement the script registers no listener", () => {
  const { doc } = setup({ withDialog: false });
  assert.deepEqual(doc.listeners, {});
});

test("a plain click opens one labelled dialog filled from the link", () => {
  const { doc, dialogs } = setup();
  const link = zoomLink();
  const ev = click(link);
  doc.dispatch("click", ev);
  assert.equal(ev.prevented, 1);
  assert.equal(dialogs.length, 1);
  const d = dialogs[0];
  assert.equal(d.getAttribute("class"), "lightbox");
  assert.equal(d.getAttribute("aria-label"), "Full-size image");
  assert.equal(d.parent, doc.body);
  const [button, figure] = d.children;
  assert.equal(button.tag, "button");
  assert.equal(button.textContent, "Close");
  assert.ok(button.hasAttribute("autofocus"));
  assert.equal(button.getAttribute("type"), "button");
  const [img, cap] = figure.children;
  assert.equal(img.getAttribute("src"), "https://site.test/img/x-2400.webp");
  assert.equal(img.alt, "A cat");
  assert.equal(img.width, 2400);
  assert.equal(img.height, 1500);
  assert.equal(cap.textContent, "Caption");
  assert.equal(cap.hidden, false);
  assert.equal(d.modal, 1);
});

test("a second open reuses the same dialog", () => {
  const { doc, dialogs } = setup();
  doc.dispatch("click", click(zoomLink()));
  doc.dispatch("click", click(zoomLink({ href: "https://site.test/img/y-1600.webp" })));
  assert.equal(dialogs.length, 1);
  assert.equal(dialogs[0].modal, 2);
  assert.equal(dialogs[0].children[1].children[0].getAttribute("src"), "https://site.test/img/y-1600.webp");
});

test("a link with no figure caption hides the dialog caption and leaves it empty", () => {
  const { doc, dialogs } = setup();
  doc.dispatch("click", click(zoomLink({ caption: "Earlier" })));
  doc.dispatch("click", click(zoomLink({ figure: false })));
  const cap = dialogs[0].children[1].children[1];
  assert.equal(cap.hidden, true);
  assert.equal(cap.textContent, "");
  doc.dispatch("click", click(zoomLink({ caption: null })));
  assert.equal(cap.hidden, true);
});

test("modified, non-primary, handled and targeted clicks are not intercepted", () => {
  const { doc, dialogs } = setup();
  const cases = [
    click(zoomLink(), { ctrlKey: true }),
    click(zoomLink(), { metaKey: true }),
    click(zoomLink(), { shiftKey: true }),
    click(zoomLink(), { altKey: true }),
    click(zoomLink(), { button: 1 }),
    click(zoomLink(), { defaultPrevented: true }),
    click(zoomLink({ target: "_blank" })),
    click(new El("p")),
  ];
  for (const ev of cases) doc.dispatch("click", ev);
  assert.ok(cases.every((ev) => ev.prevented === 0));
  assert.equal(dialogs.length, 0);
});

test("Close and a click on the dialog surface close it, a click on the image does not", () => {
  const { doc, dialogs } = setup();
  doc.dispatch("click", click(zoomLink()));
  const d = dialogs[0];
  const [button, figure] = d.children;
  button.dispatch("click", click(button));
  assert.equal(d.closed, 1);
  d.dispatch("click", click(d));
  assert.equal(d.closed, 2);
  d.dispatch("click", click(figure.children[0]));
  d.dispatch("click", click(figure.children[1]));
  assert.equal(d.closed, 2);
});

test("closing focuses the opening link and clears the dialog image source", () => {
  const { doc, dialogs } = setup();
  const link = zoomLink();
  doc.dispatch("click", click(link));
  dialogs[0].close();
  assert.equal(link.focused, 1);
  assert.equal(dialogs[0].children[1].children[0].hasAttribute("src"), false);
});

test("an image error closes the dialog and follows the same-origin link", () => {
  const { doc, dialogs, assigned } = setup();
  doc.dispatch("click", click(zoomLink()));
  const img = dialogs[0].children[1].children[0];
  img.dispatch("error", {});
  assert.equal(dialogs[0].closed, 1);
  assert.deepEqual(assigned, ["https://site.test/img/x-2400.webp"]);
});

test("an image error never follows a cross-origin href", () => {
  const { doc, dialogs, assigned } = setup();
  doc.dispatch("click", click(zoomLink({ href: "https://evil.example/x.webp" })));
  dialogs[0].children[1].children[0].dispatch("error", {});
  assert.equal(dialogs[0].closed, 1);
  assert.deepEqual(assigned, []);
});

test("the script uses no HTML-string, timer, animation or module APIs and stays small", () => {
  assert.doesNotMatch(SRC, /innerHTML|outerHTML|insertAdjacentHTML|setTimeout|setInterval|requestAnimationFrame/);
  assert.doesNotMatch(SRC, /^\s*(import|export)\s/m);
  assert.ok(SRC.trimEnd().split("\n").length <= 80, "lightbox.js is over 80 lines");
});

// ---- script gating in the built pages ----

const prefix = defaultPrefix();
const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const front = (title) => `---
title: ${title}
date: "2024-01-01"
tags: [games]
cover: ../../assets/small.webp
cover_alt: Cover
---
`;

const projects = {
  "content/projects/lone.md": `${front("Lone")}\n![A lone shot](../../assets/small.webp)\n`,
  "content/projects/fullonly.md": `${front("Fullonly")}\n::: full\n![Wide](../../assets/small.webp)\n:::\n`,
  "content/projects/decoonly.md": `${front("Decoonly")}\n![Spacer](../../assets/small.webp){decorative}\n`,
  "content/projects/noimg.md": `${front("Noimg")}\nJust words.\n`,
};
const assets = { "small.webp": { width: 308, height: 200, format: "webp" } };

async function buildSite(prefixOpt) {
  const site = await makeSite({ files: projects, assets, prefix: prefixOpt });
  sites.push(site);
  const r = site.build();
  assert.equal(r.code, 0, r.output);
  return site;
}

const site = await buildSite();

test("a page with a zoom link loads exactly one deferred lightbox.js after the stylesheet", () => {
  const html = site.read("_site/lone/index.html");
  assert.equal(html.match(/<script/g).length, 1);
  const tag = new RegExp(`<script src="${prefix}lightbox\\.js" defer(="")?></script>`).exec(html);
  assert.ok(tag, "script tag missing");
  const head = html.slice(0, html.indexOf("</head>"));
  assert.ok(head.includes(tag[0]), "script is inside <head>");
  assert.ok(html.indexOf(`href="${prefix}style.css"`) < html.indexOf(tag[0]), "script follows the stylesheet");
  assert.ok(site.exists("_site/lightbox.js"));
  assert.ok(!html.includes("<dialog"), "no dialog markup in the built HTML");
});

test("pages without a zoom link have no script", () => {
  for (const p of [
    "_site/fullonly/index.html",
    "_site/decoonly/index.html",
    "_site/noimg/index.html",
    "_site/work/index.html",
    "_site/index.html",
  ]) {
    assert.ok(!site.read(p).includes("<script"), `${p} contains <script`);
  }
});

test("under PATH_PREFIX=/ the script src is /lightbox.js", async () => {
  const root = await buildSite("/");
  assert.match(root.read("_site/lone/index.html"), /<script src="\/lightbox\.js" defer(="")?><\/script>/);
});
