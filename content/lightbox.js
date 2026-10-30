// The site's only script: opens a zoom link's large image in one shared native <dialog>.
// Without it, or without <dialog> support, the link just opens the large file (D-03, D-04).
(function () {
  if (typeof HTMLDialogElement !== "function") return;
  var dialog, img, caption, opener;

  function create() {
    dialog = document.createElement("dialog");
    dialog.setAttribute("class", "lightbox");
    dialog.setAttribute("aria-label", "Full-size image");
    var close = document.createElement("button");
    close.setAttribute("type", "button");
    close.setAttribute("class", "lightbox-close");
    close.setAttribute("autofocus", "");
    close.textContent = "Close";
    var figure = document.createElement("figure");
    img = document.createElement("img");
    caption = document.createElement("figcaption");
    figure.append(img, caption);
    dialog.append(close, figure);
    document.body.append(dialog);
    close.addEventListener("click", function () { dialog.close(); });
    // The dialog fills the viewport, so a click on its own surface is a click outside the image.
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () {
      img.removeAttribute("src");
      if (opener) opener.focus();
    });
    // The large file would not load: let the browser show it the plain-link way (same site only).
    img.addEventListener("error", function () {
      dialog.close();
      if (opener && new URL(opener.href, location.href).origin === location.origin) location.assign(opener.href);
    });
  }

  function open(link) {
    if (!dialog) create();
    var thumb = link.querySelector("img");
    var figure = link.closest("figure");
    var note = figure && figure.querySelector("figcaption");
    opener = link;
    img.alt = thumb ? thumb.alt : "";
    img.width = Number(link.dataset.width);
    img.height = Number(link.dataset.height);
    img.setAttribute("src", link.href);
    caption.textContent = note ? note.textContent : "";
    caption.hidden = !caption.textContent;
    dialog.showModal();
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest && e.target.closest("a.zoom");
    if (!link || link.hasAttribute("target")) return;
    e.preventDefault();
    open(link);
  });
})();
