# 07 — Book and Buyer Deliverables

**Priority:** P0 — Selar must have the final files before a real test purchase.

## Pickup card

- **Pick ID:** `DELIVERABLES-01`
- **Status:** Waiting
- **Outstanding:** placeholders, final editorial pass, cover, EPUB/PDF checks, Selar upload and buyer test.
- **Need from you:** final author/publisher/ISBN/copyright facts, cover and file approvals, upload confirmation.
- **Secure input:** `/data/user/0/com.foxdebug.acodefree/cache/opencode/softlife-inputs/DELIVERABLES-01.md` (copy `_TEMPLATE.md`; mode 600)
- **Resume:** say `Pick up DELIVERABLES-01`; full steps in `00-execution-board.md`.

The app and audio library are live, but the buyer-facing eBook/PDF deliverables
still need a final content and file check. The manuscript placeholder list is:

```text
/public/softlife/PLACEHOLDERS.md
```

## A. Resolve manuscript placeholders

- [ ] Read `PLACEHOLDERS.md` and classify each field as customization or
  intentional template field.
- [ ] Replace every customization field consistently:
  - author name
  - publication year
  - publisher/imprint
  - ISBN, if the edition uses one
  - company name, title/role, city/country
  - website, email and social handle
  - cover designer and cover art source
- [ ] Decide whether `[ITEM]`, `[STEP]`, `[DATE]` and similar worksheet fields
  should remain as reader prompts. Keeping them is acceptable.
- [ ] Search the manuscript for leftover square brackets.
- [ ] Confirm no placeholder remains in the cover, EPUB metadata or back matter.
- [ ] Update `06-production/books/01-soft-life-system.toml` with the final
  author, year, ISBN and cover values.
- [ ] Update the marketing files with the same final details.

Build from the production folder:

```bash
cd /public/softlife/06-production
python3 build.py 01-soft-life-system
```

## B. Final editorial pass

- [ ] Final line edit and proofread.
- [ ] Check chapter numbering and cross-references.
- [ ] Check the table of contents against the final chapter files.
- [ ] Check the copyright page and permissions.
- [ ] Confirm all quotations, images and templates are licensed or original.
- [ ] Check the introduction and back matter for outdated links or offers.
- [ ] Confirm the free-chapter promise matches the app (`intro` and `ch01`).
- [ ] Confirm the complete-bundle promise covers the eBook, audio and worksheets.

## C. Cover and files

- [ ] Finalise the eBook cover at 1600 × 2400 px.
- [ ] Confirm the cover title, subtitle and author name are correct.
- [ ] Build the final outputs:
  - EPUB
  - print interior PDF
  - cover wrap PDF
  - front cover PDF
- [ ] Confirm the outputs are in `06-production/dist/01-soft-life-system/`.
- [ ] Open the EPUB in Apple Books and Calibre.
- [ ] Open the EPUB in Kindle Previewer if Kindle distribution is planned.
- [ ] Confirm the EPUB cover, TOC and chapter order.
- [ ] Open the print PDF and confirm no blank, clipped or duplicate pages.
- [ ] Confirm the cover wrap spine width is correct for the final page count.
- [ ] Confirm fonts are embedded and images are high resolution.
- [ ] Confirm file names and metadata are clean.

## D. Upload to Selar

- [ ] Upload the final EPUB.
- [ ] Upload the final PDF.
- [ ] Upload the cover image.
- [ ] Add the worksheets/templates if they are separate downloads.
- [ ] Confirm the buyer can download every file after purchase.
- [ ] Confirm the download links do not expire before the buyer uses them.
- [ ] Confirm the files open on iOS, Android and desktop.
- [ ] Confirm the Selar product page lists the exact deliverables.
- [ ] Confirm the refund policy matches the digital-download terms.

## E. Audio alignment

- [ ] Confirm the book has an introduction plus 15 chapters.
- [ ] Confirm `audio:intro` matches the introduction.
- [ ] Confirm `audio:ch01`–`audio:ch15` match the chapter titles.
- [ ] Confirm the app's chapter list order matches the book.
- [ ] Confirm the free chapters are exactly `intro` and `ch01`.
- [ ] Confirm no audio file contains a test recording or wrong chapter.
- [ ] Confirm the total listening time shown to buyers is accurate.

## F. Buyer package test

- [ ] Buy the product as a real buyer.
- [ ] Download every file from the Selar receipt.
- [ ] Create the app account with the same email.
- [ ] Confirm the app unlocks the complete tier.
- [ ] Confirm the eBook and audio match.
- [ ] Confirm a buyer who only wants the eBook still gets clear app instructions.
- [ ] Confirm a buyer who only wants audio can find the player.
- [ ] Confirm support can resend access instructions.

## Acceptance criteria

- The final EPUB and PDF contain no unintended placeholders.
- The cover and metadata match the product page and legal entity.
- Every buyer can download and open the files.
- The book, app chapters and audio chapters align.
- Selar lists exactly what the buyer receives.
- Test purchases can be delivered without manual file sending.

## Current status

- [x] Manuscript and production build pipeline exist.
- [x] EPUB, print PDF, cover wrap and front cover outputs generated.
- [x] All 16 audio chapters uploaded to KV.
- [ ] Final placeholder replacement verified.
- [ ] Final cover at 1600 × 2400 confirmed.
- [ ] Final EPUB/PDF opened on iOS, Android and desktop.
- [ ] Final files uploaded to Selar.
- [ ] Buyer package download tested.
