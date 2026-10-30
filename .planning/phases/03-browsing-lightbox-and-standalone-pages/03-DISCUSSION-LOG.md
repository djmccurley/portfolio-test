# Phase 3: Browsing, Lightbox and Standalone Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log keeps the alternatives that were considered.

**Date:** 2026-10-30
**Phase:** 03-browsing-lightbox-and-standalone-pages
**Areas discussed:** Lightbox behavior, Feed and tag listings, Homepage curation, Nav/About/CV/student page

---

## Lightbox behavior

| Question | Options | Selected |
|----------|---------|----------|
| Which images open full-size? | All content images / All except full-bleed / Grids only | All except full-bleed |
| What does the viewer show? | Image + caption / Image only / Image + caption + open-original link | Image + caption |
| How does it close? | Escape, Close button or backdrop click / Escape or Close button only | Escape, Close button or backdrop click |
| Full-size version size | Largest existing width (2400px) / You decide | Largest existing width (2400px) |

**Notes:** The owner moved on without discussing GIFs, a per-image opt-out or gallery prev/next. GIFs and the opt-out were left to Claude.

---

## Feed and tag listings

| Question | Options | Selected |
|----------|---------|----------|
| Where does the full feed live? | /work/ / Homepage below featured / /projects/ | /work/ |
| Card look | Cover grid with image, title, year / Cover grid + tags / Text list | Cover grid with image, title, year |
| Tags on project pages? | Yes, in the meta block / No | Yes, in the meta block |
| How visitors reach tag pages | Filter links above the feed / Tags in header nav / Only via project pages | Filter links above the feed |
| Empty tags | Hide / Show "No projects yet" | Hide |
| Tag labels | Display labels in the tag list / Show slugs as-is | Display labels |

---

## Homepage curation

| Question | Options | Selected |
|----------|---------|----------|
| How to pick and order featured projects | Data file listing slugs / `featured: N` front matter | Data file listing slugs |
| What else is on the homepage | Intro + featured + All work link / Featured + link / Featured only | Intro + featured + All work link |
| Featured card style | Same card and grid / Bigger, fewer per row | Same card and grid |

---

## Nav, About/CV, student page

| Question | Options | Selected |
|----------|---------|----------|
| Header nav | Name + Work, About, Teaching / Name + Work, About / Name + Work, About, CV, Teaching | Other: "Name + Work, CV and Teaching only. No about page for now" |
| CV | Markdown in About + PDF / Separate CV page / PDF only | Separate CV markdown page |
| PDFs | In assets/ with plain markdown links / Separate files/ folder | In assets/ with plain markdown links |
| Student page layout | Plain markdown / Structured front matter | Plain markdown |
| URLs | /cv/ and /teaching/ / /cv/ and /student-work/ | /cv/ and /teaching/ |

---

## Claude's Discretion

- Where the owner's name is stored and how the header shows it
- The PDF size cap and the asset guard and hook changes for PDFs
- How GIFs behave in the lightbox
- Where the lightbox script lives, and `showModal()` vs invoker commands
- Dialog sizing and styling
- Card grid columns, breakpoints, `sizes` and typography
- Page titles for the home, /work/ and tag pages

## Deferred Ideas

- About page (skipped for v1)
- Prev/next inside the lightbox gallery
