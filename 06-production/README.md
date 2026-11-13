# Production — The Soft Life Series

This folder contains the build pipeline that turns any book in the Soft Life series into publisher-ready files. The engine is book-agnostic: each book is described by a TOML config, the manuscript lives in its own folder, and one command produces the full set of outputs.

## Requirements

- Python 3.11+ (uses `tomllib`)
- `markdown`
- `weasyprint` (includes Pango/cairo)
- `pypdf`
- `Pillow` (used for cover colour sampling during design)

Install with:

```bash
pip install markdown weasyprint pypdf Pillow
```

## Series layout

```
build.py                          generic engine — never book-specific
books/
  _template.toml                  commented template for a new book
  01-soft-life-system.toml        Book 1 config
03-manuscript/
  _template/                      manuscript skeleton (.md.template files)
  01-soft-life-system/            Book 1 manuscript
05-assets/covers/
  _template/README.md             cover art spec
  <book-id>/cover-<book-id>-v1.png
dist/
  index.html, *.png ...           review site (book-agnostic)
  <book-id>/                      that book's outputs
```

## Build

```bash
python3 06-production/build.py --list              # list configured books
python3 06-production/build.py 01-soft-life-system # build one book
```

## Adding a book to the series

1. `cp books/_template.toml books/<book-id>.toml` and fill it in (title, parts, chapter files, back-cover copy, unique `uuid_seed`).
2. `cp -r 03-manuscript/_template 03-manuscript/<book-id>` and rename the `.md.template` files to `.md`.
3. Write the manuscript. Conventions the engine relies on:
   - `00-front-matter.md` — everything before `## Contents` is the title/copyright pages; the Contents list itself is stripped (the engine generates the real TOC with page numbers).
   - `01-introduction.md` — opens with an `# h1`.
   - `chapters/*.md` — each opens with `# Chapter N: Title` (numbering must match the `[[parts]]` ranges).
   - `99-back-matter.md` — templates/worksheets/resources + About the Author; opens with an `# h1`.
4. Put cover art in `05-assets/covers/<book-id>/` (spec in `05-assets/covers/_template/README.md`) and set `[book].cover`.
5. `python3 06-production/build.py <book-id>`

No page-specific rules need hand-tuning: a prepass PDF pass detects where the introduction, each chapter, and the back matter open, and suppresses running heads on exactly those pages automatically.

## Outputs (per book, in `dist/<book-id>/`)

| File | Format | Purpose |
| --- | --- | --- |
| `<slug>.epub` | EPUB 3 | Ebook for Amazon KDP, Apple Books, Kobo, etc. |
| `<slug>-print.pdf` | PDF, 6×9 in | Print interior for KDP paperback |
| `<slug>-cover-wrap.pdf` | PDF, full wrap | Print cover (front + spine + back) |
| `<slug>-cover-front.pdf` | PDF, 6.25×9.25 in | Front cover with bleed |
| `<slug>.md` | Markdown | Combined manuscript for editing or conversion |
| `print.html` / `print.css` | HTML/CSS | Styled print source |
| `cover-wrap.html` | HTML | Cover source |

## Print Specifications

- **Trim size:** 6 × 9 in (432 × 648 pt)
- **Bleed:** 0.125 in on all sides
- **Interior:** black & white on white paper
- **Spine width:** `page_count × 0.002252 in` (KDP white paper)
- **Cover wrap size:** `12.25 + spine_width` × `9.25` in
- **Safe margin:** keep important cover text at least 0.25 in from trim edges

For the current 192-page interior, the spine is approximately **0.432 in** and the wrap is **12.687 × 9.25 in**.

## Design Notes

- **Typography:** Open Sans throughout, chosen for a clean, modern business-book feel. Body 10.5 pt / 1.55 line height; chapter titles 21 pt; part titles 26 pt.
- **Running heads:** book title on verso, part title on recto.
- **Folios:** centred at the foot; front matter, contents, and part dividers are unnumbered.
- **Drop caps:** each chapter opens with a coloured drop cap.
- **Ornaments:** section breaks use a centred bullet ornament.
- **Checklists:** rendered with open boxes (`□`) instead of bullets.
- **TOC:** generated with live page numbers via CSS `target-counter`.

## EPUB Notes

- EPUB 3.0 with both `nav.xhtml` and `toc.ncx` for maximum compatibility.
- Cover image is included with `properties="cover-image"`.
- Chapters are split into separate XHTML files for fast rendering.
- All XHTML, OPF, and NCX files are valid XML.
- The EPUB uses a UUID derived from `softlife-book-01`; replace with the final ISBN-derived UUID if desired.

## Publishing Checklist

### Before uploading

- [ ] Replace every placeholder using `PLACEHOLDERS.md`.
- [ ] Line edit and proofread the manuscript.
- [ ] Confirm the final page count and regenerate the cover wrap (spine changes with page count).
- [ ] Add the final ISBN to the copyright page and cover barcode area.
- [ ] Confirm the copyright year and publisher name.
- [ ] Review the EPUB on a phone, tablet, and desktop reader.
- [ ] Check that all internal links and the table of contents work.
- [ ] Confirm the cover image is at least 1600 px on the shortest side for KDP (current: 1024 × 1536; upscale or replace with a 1600 × 2400 master).
- [ ] Remove the `[PLACEHOLDER]` note from the interior if it was manually re-added.
- [ ] Verify no `[` or `]` characters remain in the final files.

### KDP paperback

- [ ] Upload `the-soft-life-system-print.pdf` as the interior.
- [ ] Upload `the-soft-life-system-cover-wrap.pdf` as the cover, or use a designer's wrap.
- [ ] Select 6 × 9 trim, black & white interior, white paper.
- [ ] Preview the interior and cover in KDP's previewer.
- [ ] Confirm the spine text is centred and the barcode area is clear.

### KDP ebook

- [ ] Upload `the-soft-life-system.epub`.
- [ ] Upload the cover image (ideally 1600 × 2400 px).
- [ ] Set the categories and keywords from `04-marketing/book-01-metadata.md`.
- [ ] Paste the description from `04-marketing/book-01-sales-copy.md`.
- [ ] Preview on multiple devices.

## Known Gaps

- **Cover resolution:** the current front covers are 1024 × 1536 px. KDP recommends 1600 × 2400 px (1.5:1 ratio is acceptable but 1.6:1 is ideal). Replace with higher-resolution masters before publication.
- **Fonts:** only Open Sans is installed in this environment. A serif body face could be substituted for a more traditional trade-book feel.
- **Index:** no index has been generated. For a business book this is optional.
- **Audiobook:** Book 1 **produced** via `07-audiobook/` — 3.81 finished hours,
  21 files, all ACX PASS (AI narration: female mentor voice "Ava", edge-tts,
  zero cost). Scripts 2–5: run `build_narration_script.py <book-id>` then
  `generate_audio.py <book-id>`.
