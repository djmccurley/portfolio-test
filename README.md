# Portfolio site

Write a project or page as a markdown file, push it, and GitHub Pages serves it as plain, fast HTML. There is no CMS and no upload cap.

Requires Node 22. Run `npm install` once after cloning.

## Quick reference

### Blocks

A block is a fence of `:::` lines. Layout blocks hold only images. Embed blocks hold nothing, so the closing `:::` goes on the very next line.

| Block | What it does | Example syntax |
| --- | --- | --- |
| `::: grid-2` | Images in 2 columns | `::: grid-2` then images, then `:::` |
| `::: grid-3` | Images in 3 columns | `::: grid-3` then images, then `:::` |
| `::: grid-4` | Images in 4 columns | `::: grid-4` then images, then `:::` |
| `::: full` | One image at full page width | `::: full` then an image, then `:::` |
| `::: video` (YouTube or Vimeo) | A video player. The title is required and read aloud | `::: video https://youtu.be/yLQFehW7FME "Title"` |
| `::: video` (file in assets/) | A video file (.mp4 or .webm, up to 50 MB). `poster=` sets the still image shown before play | `::: video ../../assets/page-clip.mp4 "Title" poster=../../assets/page-still.webp` |
| `::: itch` | An itch.io game embed with a "Play on itch.io" link | `::: itch <embed-url> 640x640 "Title" <itch-page-url>` |
| the `full` keyword | Makes a video or itch embed full width: `::: video full ...` and `::: itch full ...` | `::: video full https://youtu.be/yLQFehW7FME "Title"` |

`::: full` is a layout block for images. The `full` keyword goes right after `video` or `itch` and is a different thing.

The rules for every block:

- Start the fence at the beginning of a line, not inside a list or a quote.
- Close it with `:::` on its own line.
- Blocks cannot nest. Close one before you open the next.
- Layout blocks may contain only images. Put text outside the block, or use raw HTML.

<!-- Examples in md fences are built by test/readme.test.js; put broken examples in text fences. -->

Two images side by side:

```md
::: grid-2
![A crab on a wet rock at low tide](../../assets/example-crab.webp "Crab at low tide")
![A starfish in a shallow pool](../../assets/example-starfish.webp)
:::
```

Three and four columns work the same way:

```md
::: grid-3
![A sketch of a lighthouse](../../assets/example-sketch-1.webp)
![A sketch of a boat](../../assets/example-sketch-2.webp)
![A sketch of a harbour](../../assets/example-sketch-3.webp)
:::
```

```md
::: grid-4
![A blue colour swatch](../../assets/example-swatch-1.webp)
![A green colour swatch](../../assets/example-swatch-2.webp)
![A yellow colour swatch](../../assets/example-swatch-3.webp)
![A pink colour swatch](../../assets/example-swatch-4.webp)
:::
```

One image at full width:

```md
::: full
![A wide view of the whole title screen](../../assets/example-wide.webp "Title screen")
:::
```

A YouTube or Vimeo video (paste the normal address from the browser):

```md
::: video https://youtu.be/yLQFehW7FME "Gameplay demo"
:::

::: video https://vimeo.com/76979871 "Short film"
:::
```

A video file from `assets/`, with an optional still image shown before it plays:

```md
::: video ../../assets/example-clip.mp4 "Trailer" poster=../../assets/example-still.webp
:::
```

An itch.io game (copy the embed address from the game's "Embed game" page, then add the size, a title and the game's page address):

```md
::: itch https://itch.io/embed-upload/5070357?color=333333 640x640 "My game" https://yourname.itch.io/my-game
:::
```

Add `full` after `video` or `itch` to make the embed full width:

```md
::: video full https://youtu.be/yLQFehW7FME "Gameplay demo"
:::

::: itch full https://itch.io/embed-upload/5070357?color=333333 640x640 "My game" https://yourname.itch.io/my-game
:::
```

### Images, captions and PDFs

Paste an image into the markdown file in VS Code. It is saved in `assets/` and the link is inserted for you. Always replace the pasted `alt text` with a real description of what the picture shows.

- Caption: put it in the image title, the part in quotes after the path. A single image with a caption, outside a block, becomes a figure.
- `{decorative}` after an image marks it as purely visual. Its alt text can then be empty and no warning is printed.
- `{.class}` after an image adds a CSS class you can style in `content/style.css`.
- A plain link to a PDF in `assets/` becomes a link labelled with its size, like "Syllabus (PDF, 1.2 MB)". PDFs can be up to 25 MB.
- Raw HTML works as a fallback for anything the blocks cannot do. Give every raw `<img>` an `alt`.

```md
![A hand-drawn map of the island with a red path across it](../../assets/example-map.webp "The island map")

![](../../assets/example-flourish.webp){decorative}

![A poster with a bold orange headline](../../assets/example-poster.webp){.wide}

[Syllabus](../../assets/example-syllabus.pdf)
```

Raw HTML:

```html
<img src="../../assets/example-map.webp" alt="A hand-drawn map of the island">
```

### Project front matter

Project files live in `content/projects/`. The front matter is the block between two `---` lines at the top.

| Field | Required | Format | Example |
| --- | --- | --- | --- |
| `title` | yes | Text | `Tidepool` |
| `date` | yes | `YYYY`, `YYYY-MM` or `YYYY-MM-DD` | `2024` |
| `tags` | yes | A list of tag slugs from `src/_data/tags.js` | `[games]` |
| `cover` | yes | A file in `assets/`, in the paste form | `../../assets/tidepool-cover.webp` |
| `cover_alt` | yes | Text describing the cover | `Tidepool title screen` |
| `summary` | no | One or two sentences, shown as the intro paragraph | `A small exploration game.` |
| `description` | no | Text for link previews. Falls back to `summary`, then to the site default | `A game about tidepools.` |
| `slug` | no | Letters, numbers and hyphens only (`^[a-z0-9-]+$`). Defaults to the file name. Cannot be a reserved name: `tags`, `404`, `assets`, `img`, `css`, `js`, `projects`, `pages`, `video`, `work`, `pdf` | `tidepool-game` |
| `role` | no | Text | `Design and code` |
| `client` | no | Text | `Self-published` |
| `tools` | no | Text or a list | `[Godot, Aseprite]` |
| `year` | no | Text | `2024` |
| `link` | no | A full URL | `https://example.com` |
| `draft` | no | `true` or `false` | `true` |
| `heading` | no | Text that replaces the large heading at the top of the page. The browser tab, link previews and project cards still use `title` | `Tidepool, a game about rock pools` |
| `hideHeading` | no | `true` or `false`. `true` hides the heading on screen but keeps it for screen readers | `true` |

```yaml
---
title: Tidepool
date: 2024
tags: [games]
cover: ../../assets/tidepool-cover.webp
cover_alt: Tidepool title screen
summary: A small exploration game about tidepools.
description: An exploration game about tidepools and the creatures that live in them.
slug: tidepool-game
role: Design and code
client: Self-published
tools: [Godot, Aseprite]
year: 2024
link: https://example.com
draft: true
---
```

### Page front matter

Standalone pages live in `content/pages/`, for example the CV or Teaching page. They never appear in the project feed.

| Field | Required | Format | Example |
| --- | --- | --- | --- |
| `title` | yes | Text | `Teaching` |
| `summary` | no | One or two sentences, shown as the intro paragraph | `Courses I have taught.` |
| `description` | no | Text for link previews. Falls back to `summary`, then to the site default | `Courses and syllabi.` |
| `slug` | no | Same rules as for projects | `teaching` |
| `draft` | no | `true` or `false` | `true` |
| `heading` | no | Text that replaces the large heading at the top of the page. The browser tab and link previews still use `title` | `Courses and workshops` |
| `hideHeading` | no | `true` or `false`. `true` hides the heading on screen but keeps it for screen readers | `true` |

```yaml
---
title: Teaching
summary: Courses I have taught.
description: Courses and syllabi.
slug: teaching
draft: true
---
```

The homepage, `content/index.md`, takes `heading` and `hideHeading` too. To hide its heading, remove the `#` in front of `hideHeading: true` in that file.

## Day-to-day workflow

1. Create `content/projects/<name>.md`. The file name is the URL unless you set `slug`. Standalone pages go in `content/pages/`.
2. Paste images in VS Code. They are saved as `assets/<page>-<file>` and the link is inserted. Write real alt text.
3. Add blocks from the quick reference above.
4. Run `npm start` and open `http://localhost:8080/portfolio-test/`. The page reloads as you save, and drafts are visible.
5. Commit. The pre-commit hook shrinks the staged images: anything over 3000px is scaled down, PNG, JPEG and HEIC become WebP, file names are slugified, and the `.md` links are rewritten to match. GIF and AVIF are never resized. Run `npm run shrink` to do the same by hand for everything in `assets/`.
6. Run `git push`. GitHub Actions runs the asset check, the tests and `npm run build`, then deploys to GitHub Pages.

`npm run build` leaves drafts out. If you inspect a local production build, delete `_site/` first so output from an earlier `npm start` is not left behind.

## Drafts

Add `draft: true` to the front matter to keep a page off the live site. A draft is left out of the page itself, its card, its tag page, the homepage featured list, the next and previous links, the sitemap, and any image or video that only it uses. `npm start` still shows it, with a "Draft" label.

- Featuring a draft in `src/_data/featured.js` prints a warning and leaves it off the homepage.
- Drafting the CV or Teaching page prints a warning and hides its link in the header nav on the live site.
- A draft's own content errors (a missing image, a bad block) only show under `npm start`, because the live build never reads the draft.
- `robots.txt` and unlinked URLs hide nothing. Only `draft: true` keeps a page off the live site.

## Site settings

| Setting | File | Key |
| --- | --- | --- |
| Your name, shown in the header | `src/_data/site.js` | `name` |
| Site address, used for link previews | `src/_data/site.js` | `url` |
| Default link-preview text, for pages with no `description` or `summary` | `src/_data/site.js` | `description` |
| Default link-preview image (a file in `assets/`) | `src/_data/site.js` | `defaultImage` |
| What the default image shows, read aloud as its alt text | `src/_data/site.js` | `defaultImageAlt` |
| Path prefix the site is served under | `eleventy.config.js` | `PATH_PREFIX` |
| Accent colour. Keep it at least 4.5:1 on white; a test checks this | `content/style.css` | `--accent` |
| Which projects appear on the homepage, and in what order | `src/_data/featured.js` | a list of project slugs |
| The tag list | `src/_data/tags.js` | `{ slug, label }` entries. Restart `npm start` after editing |

Moving to a custom domain: set `url` in `src/_data/site.js` to the new origin (no path, no trailing slash) and change the `PATH_PREFIX` default in `eleventy.config.js` to `/`. Change both together.

## When the build fails

An error names the file and line it came from. Find the fragment in the first column.

| Message contains | Cause | Fix |
| --- | --- | --- |
| `image not found in assets/` | The image path points at a file that is not in `assets/` | Check the spelling, or paste the image again |
| `cover not found in assets/` | The `cover` file is not in `assets/` | Fix the `cover` path or add the file |
| `unknown tag "x" (allowed: ...)` | A tag that is not in `src/_data/tags.js` | Use one of the listed tags, or add it to `src/_data/tags.js` |
| `unknown front matter key` | A field name the site does not know, often a typo | Use a field from the front matter tables above |
| `missing front matter field` | A required field is absent | Add it (`title`, `date`, `tags`, `cover` and `cover_alt` for projects) |
| `must be YYYY, YYYY-MM or YYYY-MM-DD` | The `date` is in another format | Write `2024`, `2024-05` or `2024-05-17` |
| `already used by` | Two pages share a slug | Give one of them a different `slug` |
| `is reserved` | The slug is a name the site uses itself | Pick another `slug` |
| `"draft" must be true or false` | `draft` has some other value | Write `draft: true` or `draft: false` |
| `"hideHeading" must be true or false` | `hideHeading` has some other value, such as `yes` | Write `hideHeading: true` or `hideHeading: false` |
| `unknown block "::: x". Valid blocks: ...` | The block name is misspelled | Use a name from the Blocks table |
| `is never closed. Add ":::" on its own line after the content.` | The closing `:::` is missing | Add `:::` on its own line |
| `blocks cannot be nested` | A block opens inside another block | Close the first block before opening the next |
| `may only contain images` | Text or a link inside a layout block | Move the text outside the block, or use raw HTML |
| `takes no content` | Something sits between an embed's opening line and its `:::` | Put `:::` on the very next line |
| `video URL not recognised` | The link is not YouTube, Vimeo or a file | Use a youtube.com, youtu.be or vimeo.com link, or a file in `assets/` |
| `itch block needs:` | The itch line is missing a part | Give it `<embed-url> <W>x<H> "Title" <itch-page-url>` |
| `PDF not found in assets/` | The PDF link points at a missing file | Check the spelling or add the PDF |
| `the limit is` | A video (50 MB, .mp4 or .webm) or PDF (25 MB) is too big | Compress it, or host the video on YouTube or Vimeo |
| `does not match any project` | `src/_data/featured.js` lists a slug no project has | Fix the spelling or remove it from the list |
| `src/_data/site.js:` | A setting is missing or wrong, such as `url` with a path or a `defaultImage` that is not in `assets/` | Follow the message; see Site settings above |
| `over 10 MB` | CI asset check: an image is too large | Reduce it by hand, then run `npm run shrink` |
| `exceeds 3000px` | CI asset check: an image is too wide or tall | Run `npm run shrink`, or reduce a GIF or AVIF by hand |
| `unconverted .png (run npm run shrink)` | CI asset check: a PNG, JPEG or HEIC bypassed the pre-commit hook | Run `npm run shrink` and commit the result |

### Warnings

Warnings are printed but never fail the build.

- `WARN <file>: image ... has empty alt text...`. Describe the image, or add `{decorative}` if it is purely visual. The same warning appears for the paste placeholder "alt text" and for alt text that looks like a file name.
- `WARN src/_data/featured.js: "x" is a draft...`. The draft is left off the homepage.
- `WARN <file>: this page is a draft, so its ... link is left out of the header nav...`. The CV or Teaching link is hidden on the live site.
