#!/usr/bin/env python3
"""Soft Life Series — production build engine.

Builds print interior, EPUB, combined manuscript, and cover PDFs for any book
in the series from a per-book TOML config.

Usage:
  python3 build.py <book-id>     # e.g. python3 build.py 01-soft-life-system
  python3 build.py --list        # list configured books

Book configs live in books/<book-id>.toml (see books/_template.toml).
Outputs go to dist/<book-id>/:
  <slug>.epub                  EPUB 3 ebook
  <slug>-print.pdf             6x9 print interior
  <slug>.md                    Combined manuscript
  <slug>-cover-wrap.pdf        Full print cover wrap (back + spine + front)
  <slug>-cover-front.pdf       Front cover with bleed
  print.html / print.css / cover-wrap.html   Build intermediates (kept for review)

Series-wide constants (publisher, language, trim, brand colors) are engine
defaults below; override per book in the TOML if a book ever needs it.
"""

import html as htmlmod
import re
import shutil
import sys
import tomllib
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
BOOKS_DIR = HERE / "books"
DIST = HERE / "dist"

# ---------------------------------------------------------------- series defaults

PUBLISHER = "Gabochie Books"
LANGUAGE = "en"
MD_EXTENSIONS = ["extra", "sane_lists", "smarty"]

# Series brand (print interior + cover wrap)
COVER_BG = "#2a0f4a"
COVER_GOLD = "#d9b46a"

MD_EXTENSIONS = MD_EXTENSIONS


def load_config(book_id: str) -> dict:
    path = BOOKS_DIR / f"{book_id}.toml"
    if not path.exists():
        available = sorted(p.stem for p in BOOKS_DIR.glob("*.toml") if p.stem != "_template")
        sys.exit(f"Unknown book '{book_id}'. Config not found: {path}\nAvailable: {', '.join(available)}")
    with open(path, "rb") as fh:
        raw = tomllib.load(fh)
    # Flatten: [book] fields become top-level; sections keep their names.
    cfg = dict(raw.get("book", {}))
    cfg.setdefault("publisher", PUBLISHER)
    cfg.setdefault("language", LANGUAGE)
    intro = dict(raw.get("intro", {}))
    intro.setdefault("toc_label", "Introduction")
    back = dict(raw.get("back", {}))
    back.setdefault("toc_label", "Templates, Worksheets & Resources")
    cfg["intro"] = intro
    cfg["back"] = back
    cfg["parts"] = raw.get("parts", [])
    cfg["chapters"] = raw.get("chapters", [])
    cfg["cover_back"] = raw.get("cover_back", {})
    for required in ("id", "slug", "title", "subtitle", "author", "year",
                     "uuid_seed", "manuscript_dir", "cover", "description"):
        if not cfg.get(required):
            sys.exit(f"{path}: missing required field '{required}' (see books/_template.toml)")
    return cfg


# ---------------------------------------------------------------- helpers

def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def preprocess(text: str) -> str:
    text = text.replace("- [ ] ", "- \u25a1 ")
    text = text.replace("- [x] ", "- \u25a0 ")
    text = text.replace("- [X] ", "- \u25a0 ")
    return text


def md_to_html(text: str) -> str:
    md = markdown.Markdown(extensions=MD_EXTENSIONS, output_format="html5")
    html = md.convert(preprocess(text))
    html = re.sub(r"<li>(\u25a1)", r'<li class="check">\1', html)
    html = re.sub(r"<li>(\u25a0)", r'<li class="check">\1', html)
    return html


def to_xhtml(fragment: str) -> str:
    def named_entity(match):
        name = match.group(1)
        if name in ("amp", "lt", "gt", "quot", "apos"):
            return match.group(0)
        return htmlmod.unescape(match.group(0))

    fragment = re.sub(r"&([a-zA-Z][a-zA-Z0-9]+);", named_entity, fragment)
    fragment = re.sub(r"<hr\s*/?>", "<hr/>", fragment)
    fragment = re.sub(r"<br\s*/?>", "<br/>", fragment)
    fragment = re.sub(r"<img([^>]*?)\s*/?>", r"<img\1/>", fragment)
    fragment = fragment.replace("&nbsp;", "&#160;")
    return fragment


def chapter_title(raw: str) -> str:
    first = raw.lstrip().splitlines()[0]
    return first.lstrip("# ").strip()


def display_chapter_title(title: str) -> str:
    return re.sub(r"^Chapter\s+\d+\s*:\s*", "", title).strip()


def strip_h1(fragment: str, ident: str, runhead: str, display_title: str) -> str:
    """Replace the first h1 with an anchored h1 carrying a running-head span."""
    match = re.search(r"<h1>(.*?)</h1>", fragment, flags=re.S)
    if not match:
        return fragment
    replacement = (
        f'<h1 id="{ident}"><span class="runhead">{runhead}</span>'
        f'<span class="chapter-name">{display_title}</span></h1>'
    )
    return fragment[: match.start()] + replacement + fragment[match.end():]


def add_id(fragment: str, ident: str) -> str:
    return re.sub(r"<h1>", f'<h1 id="{ident}">', fragment, count=1)


def front_matter_without_contents(raw: str) -> str:
    marker = "## Contents"
    if marker in raw:
        raw = raw.split(marker)[0].rstrip()
    raw = re.sub(r"\n---\s*$", "", raw)
    return raw


def clean_front_html(html: str) -> str:
    html = re.sub(r"<h2>Copyright</h2>", "", html)
    html = re.sub(
        r"<p><strong>Placeholders:</strong>.*?</p>",
        "",
        html,
        flags=re.S,
    )
    return html


def add_dropcap(html: str) -> str:
    return re.sub(r"(</h1>\s*<p>)([A-Za-z])", r'\1<span class="dc">\2</span>', html, count=1)


# ---------------------------------------------------------------- print interior

def build_print_html(cfg: dict) -> str:
    ms = ROOT / cfg["manuscript_dir"]
    parts = cfg["parts"]
    chapters = [c["file"] for c in cfg["chapters"]]
    intro_label = cfg["intro"]["toc_label"]
    back_label = cfg["back"]["toc_label"]
    language = cfg["language"]
    title = cfg["title"]

    front = clean_front_html(md_to_html(front_matter_without_contents(read(ms / "00-front-matter.md"))))
    intro = add_id(md_to_html(read(ms / "01-introduction.md")), "intro")
    back = add_id(md_to_html(read(ms / "99-back-matter.md")), "back")

    chapter_html = {}
    chapter_titles = {}
    for i, name in enumerate(chapters, start=1):
        raw = read(ms / "chapters" / name)
        ident = f"ch{i:02d}"
        chapter_titles[i] = chapter_title(raw)
        html = md_to_html(raw)
        html = strip_h1(html, ident, f"Chapter {i}", display_chapter_title(chapter_titles[i]))
        html = add_dropcap(html)
        chapter_html[i] = html

    toc_entries = []
    toc_entries.append(("intro", intro_label))
    for part in parts:
        toc_entries.append((part["id"], f"{part['number']} — {part['title']}"))
        for i in range(part["start"], part["end"] + 1):
            toc_entries.append((f"ch{i:02d}", f"{i}. {display_chapter_title(chapter_titles[i])}"))
    toc_entries.append(("back", back_label))

    toc_items = "\n".join(
        f'<li><a href="#{ident}">{label}</a></li>' for ident, label in toc_entries
    )

    body_parts = []
    for part in parts:
        body_parts.append(
            f'<section class="part" id="{part["id"]}">'
            f'<p class="part-number">{part["number"]}</p>'
            f'<h1 class="part-title">{part["title"]}</h1>'
            f'<p class="part-subtitle">{part["subtitle"]}</p>'
            f"</section>"
        )
        for i in range(part["start"], part["end"] + 1):
            body_parts.append(
                f'<section class="chapter">{chapter_html[i]}</section>'
            )

    parts_html = "\n".join(body_parts)

    return f"""<!DOCTYPE html>
<html lang="{language}">
<head>
<meta charset="utf-8"/>
<title>{title}</title>
<link rel="stylesheet" href="print.css"/>
</head>
<body>
<section class="front">{front}</section>
<section class="toc-page">
<h1 class="toc-title">Contents</h1>
<ul class="toc">
{toc_items}
</ul>
</section>
<section class="main">
<section class="intro-section">{intro}</section>
{parts_html}
</section>
<section class="back">{back}</section>
</body>
</html>
"""


PRINT_CSS_TEMPLATE = r"""
@page {
  size: 6in 9in;
  margin: 0.8in 0.65in 0.75in 0.65in;
}

/* Front matter: no running heads, no folios */
@page front:left {
  margin-left: 0.65in;
  margin-right: 0.75in;
  @top-left { content: none; }
  @top-right { content: none; }
  @bottom-center { content: none; }
}
@page front:right {
  margin-left: 0.75in;
  margin-right: 0.65in;
  @top-left { content: none; }
  @top-right { content: none; }
  @bottom-center { content: none; }
}

/* Contents: no folios */
@page toc:left {
  margin-left: 0.65in;
  margin-right: 0.75in;
  @top-left { content: none; }
  @top-right { content: none; }
  @bottom-center { content: none; }
}
@page toc:right {
  margin-left: 0.75in;
  margin-right: 0.65in;
  @top-left { content: none; }
  @top-right { content: none; }
  @bottom-center { content: none; }
}

/* Part dividers: no folios, no running heads */
@page part:left {
  margin-left: 0.65in;
  margin-right: 0.75in;
  @top-left { content: none; }
  @top-right { content: none; }
  @bottom-center { content: none; }
}
@page part:right {
  margin-left: 0.75in;
  margin-right: 0.65in;
  @top-left { content: none; }
  @top-right { content: none; }
  @bottom-center { content: none; }
}

/* Main body: running heads and folios */
@page main:left {
  margin-left: 0.6in;
  margin-right: 0.7in;
  @top-left {
    content: string(booktitle);
    font-family: "Open Sans", sans-serif;
    font-size: 7.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8a7a66;
  }
  @bottom-center {
    content: counter(page);
    font-family: "Open Sans", sans-serif;
    font-size: 8.5pt;
    color: #6b5f50;
  }
}
@page main:right {
  margin-left: 0.7in;
  margin-right: 0.6in;
  @top-right {
    content: string(parttitle);
    font-family: "Open Sans", sans-serif;
    font-size: 7.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8a7a66;
  }
  @bottom-center {
    content: counter(page);
    font-family: "Open Sans", sans-serif;
    font-size: 8.5pt;
    color: #6b5f50;
  }
}

html {
  font-family: "Open Sans", sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #1f1b17;
}

body { margin: 0; }

.book-title-mark {
  string-set: booktitle "%TITLE%";
  height: 0;
  overflow: hidden;
  font-size: 0;
}

/* ---------- Front matter ---------- */

.front { page: front; string-set: booktitle "%TITLE%"; }

.front h1 {
  font-size: 29pt;
  line-height: 1.06;
  font-weight: 800;
  letter-spacing: -0.015em;
  text-align: center;
  margin: 2.1in 0 0 0;
}

.front h3 {
  font-size: 11.5pt;
  font-weight: 400;
  font-style: italic;
  text-align: center;
  color: #6b5f50;
  margin: 0.22in 0.35in 0 0.35in;
  line-height: 1.45;
}

.front > p:first-of-type {
  text-align: center;
  font-size: 11pt;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: 0.45in;
}

.front h2 {
  font-size: 10pt;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  text-align: center;
  margin: 2.2in 0 0.22in 0;
  color: #8a7a66;
}

.front hr {
  border: none;
  height: 0;
  margin: 0;
  page-break-after: always;
}

.front p {
  font-size: 8.6pt;
  line-height: 1.42;
  text-align: left;
}

.front blockquote {
  margin: 0.15in 0.35in;
  padding-left: 0.18in;
  border-left: 1.5pt solid #c9b9a3;
  font-style: italic;
  color: #4a4036;
}

.front blockquote p {
  font-size: 9.6pt;
  line-height: 1.5;
  margin: 0 0 0.12in 0;
}

.front p strong { font-weight: 700; }

/* ---------- Table of contents ---------- */

.toc-page { page: toc; page-break-before: always; }

.toc-title {
  font-size: 22pt;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 0.35in 0;
}

.toc {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 10pt;
}

.toc li {
  margin: 0 0 7pt 0;
  padding-bottom: 3pt;
  border-bottom: 0.4pt dotted #cfc3b2;
}

.toc li a { color: #1f1b17; text-decoration: none; }

.toc li a::after {
  content: target-counter(attr(href), page);
  float: right;
  color: #6b5f50;
}

.toc li:has(a[href^="#part"]) {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 8.5pt;
  margin-top: 14pt;
  border-bottom: none;
}
.toc li:has(a[href^="#part"]) a { color: #8a7a66; }

/* ---------- Main body ---------- */

.main { page: main; }

.intro-section h1 { string-set: parttitle "Introduction"; }
.part-title { string-set: parttitle content(text); }
.back h1 { string-set: parttitle "Templates & Resources"; }

.part {
  page: part;
  page-break-before: always;
  padding-top: 2.6in;
  text-align: center;
}

.part-number {
  font-size: 10pt;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #a08c72;
  margin: 0 0 0.12in 0;
}

.part-title {
  font-size: 26pt;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 0.16in 0;
}

.part-subtitle {
  font-size: 11pt;
  font-style: italic;
  color: #6b5f50;
  margin: 0 0.5in;
  line-height: 1.45;
}

.chapter { page-break-before: always; }

.chapter h1 {
  font-size: 21pt;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 0.3in 0;
  padding-bottom: 0.14in;
  border-bottom: 0.6pt solid #d8cdbd;
}

.chapter h1 .runhead {
  display: block;
  font-size: 8.5pt;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #a08c72;
  margin-bottom: 0.1in;
}

.chapter h1 .chapter-name { display: block; }

.chapter h2 {
  font-size: 12.5pt;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin: 0.32in 0 0.1in 0;
  page-break-after: avoid;
}

.chapter h3 {
  font-size: 10.5pt;
  font-weight: 700;
  margin: 0.22in 0 0.06in 0;
  page-break-after: avoid;
}

.chapter p {
  margin: 0 0 0.11in 0;
  text-align: justify;
  hyphens: auto;
  hyphenate-character: "-";
  orphans: 2;
  widows: 2;
}

.chapter > h1 + p .dc {
  float: left;
  font-size: 40pt;
  line-height: 0.9;
  font-weight: 800;
  padding: 0.02in 0.07in 0 0;
  color: #8a6d4a;
}

.chapter ul,
.chapter ol {
  margin: 0 0 0.12in 0;
  padding-left: 0.26in;
}

.chapter li { margin-bottom: 0.05in; text-align: left; }

.chapter blockquote {
  margin: 0.16in 0.3in;
  padding-left: 0.18in;
  border-left: 2pt solid #c9b9a3;
  font-style: italic;
  color: #4a4036;
}

.chapter blockquote p { text-align: left; }

.chapter hr {
  border: none;
  text-align: center;
  margin: 0.26in 0;
  color: #b9a88f;
}

.chapter hr::after {
  content: "\2022 \2022 \2022";
  font-size: 9pt;
  letter-spacing: 0.4em;
}

.chapter table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.14in 0 0.18in 0;
  font-size: 9pt;
}

.chapter th {
  text-align: left;
  font-weight: 700;
  border-bottom: 1pt solid #8a7a66;
  padding: 0.05in 0.06in;
}

.chapter td {
  border-bottom: 0.4pt solid #ddd2c2;
  padding: 0.05in 0.06in;
  vertical-align: top;
}

.chapter li::marker { color: #a08c72; }
.chapter li.check,
.back li.check {
  list-style: none;
  margin-left: -0.2in;
}

/* ---------- Back matter ---------- */

.back { page: main; page-break-before: always; }

.back h1 {
  font-size: 21pt;
  font-weight: 800;
  margin: 0 0 0.3in 0;
  padding-bottom: 0.14in;
  border-bottom: 0.6pt solid #d8cdbd;
}

.back h2 {
  font-size: 12.5pt;
  font-weight: 700;
  margin: 0.3in 0 0.1in 0;
  page-break-after: avoid;
}

.back h3 {
  font-size: 10.5pt;
  font-weight: 700;
  margin: 0.22in 0 0.06in 0;
  page-break-after: avoid;
}

.back p { margin: 0 0 0.11in 0; text-align: justify; }
.back ul, .back ol { margin: 0 0 0.12in 0; padding-left: 0.26in; }
.back li { margin-bottom: 0.05in; }
.back table { width: 100%; border-collapse: collapse; margin: 0.14in 0; font-size: 9pt; }
.back th { text-align: left; border-bottom: 1pt solid #8a7a66; padding: 0.05in 0.06in; }
.back td { border-bottom: 0.4pt solid #ddd2c2; padding: 0.05in 0.06in; vertical-align: top; }
.back blockquote {
  margin: 0.16in 0.3in;
  padding-left: 0.18in;
  border-left: 2pt solid #c9b9a3;
  font-style: italic;
  color: #4a4036;
}
.back hr {
  border: none;
  text-align: center;
  margin: 0.26in 0;
  color: #b9a88f;
}
.back hr::after {
  content: "\2022 \2022 \2022";
  font-size: 9pt;
  letter-spacing: 0.4em;
}
"""


def print_css(cfg: dict) -> str:
    return PRINT_CSS_TEMPLATE.replace("%TITLE%", cfg["title"])


EBOOK_CSS = r"""
html { font-size: 100%; }
body {
  font-family: "Open Sans", sans-serif;
  line-height: 1.55;
  color: #1f1b17;
  margin: 0 5%;
  padding: 0;
}
h1 {
  font-size: 1.6em;
  line-height: 1.15;
  font-weight: 800;
  margin: 1.4em 0 0.7em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #d8cdbd;
}
h1 .runhead {
  display: block;
  font-size: 0.55em;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #a08c72;
  margin-bottom: 0.35em;
}
h1 .chapter-name { display: block; }
h2 { font-size: 1.2em; font-weight: 700; margin: 1.5em 0 0.5em; }
h3 { font-size: 1em; font-weight: 700; margin: 1.2em 0 0.4em; }
p { margin: 0 0 0.8em; text-align: left; }
ul, ol { margin: 0 0 0.9em; padding-left: 1.3em; }
li { margin-bottom: 0.3em; }
blockquote {
  margin: 1em 0.4em;
  padding-left: 0.8em;
  border-left: 3px solid #c9b9a3;
  font-style: italic;
  color: #4a4036;
}
hr { border: none; text-align: center; margin: 1.4em 0; color: #b9a88f; }
hr::after { content: "\2022 \2022 \2022"; letter-spacing: 0.4em; font-size: 0.9em; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9em; }
th { text-align: left; border-bottom: 2px solid #8a7a66; padding: 0.3em; }
td { border-bottom: 1px solid #ddd2c2; padding: 0.3em; vertical-align: top; }
img { max-width: 100%; height: auto; }
.cover { margin: 0; padding: 0; text-align: center; }
.cover img { max-width: 100%; height: auto; }
.part { text-align: center; margin-top: 25%; }
.part-number { letter-spacing: 0.25em; text-transform: uppercase; color: #a08c72; font-size: 0.8em; }
.part-title { border: none; font-size: 2em; }
.part-subtitle { font-style: italic; color: #6b5f50; }
.toc-title { border: none; }
nav#toc ol { list-style: none; padding-left: 0; }
nav#toc li { margin: 0.5em 0; }
nav#toc a { color: #1f1b17; text-decoration: none; }
"""


def xhtml_page(cfg: dict, title: str, body: str, extra_head: str = "") -> str:
    language = cfg["language"]
    return f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="{language}" xml:lang="{language}">
<head>
<meta charset="utf-8"/>
<title>{title}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
{extra_head}
</head>
<body>
{body}
</body>
</html>
"""


def build_epub(cfg: dict) -> Path:
    out_dir = DIST / cfg["id"]
    work = out_dir / "_epub"
    if work.exists():
        shutil.rmtree(work)
    oebps = work / "OEBPS"
    meta_inf = work / "META-INF"
    images = oebps / "images"
    for d in (oebps, meta_inf, images):
        d.mkdir(parents=True, exist_ok=True)

    ms = ROOT / cfg["manuscript_dir"]
    cover = ROOT / cfg["cover"]
    parts = cfg["parts"]
    chapters = [c["file"] for c in cfg["chapters"]]
    intro_label = cfg["intro"]["toc_label"]
    back_label = cfg["back"]["toc_label"]
    title = cfg["title"]
    slug = cfg["slug"]

    work / "mimetype"
    (work / "mimetype").write_text("application/epub+zip", encoding="ascii")
    (meta_inf / "container.xml").write_text(
        """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
""",
        encoding="utf-8",
    )

    if cover.exists():
        shutil.copy2(cover, images / "cover.png")

    (oebps / "style.css").write_text(EBOOK_CSS, encoding="utf-8")

    # Cover page
    (oebps / "cover.xhtml").write_text(
        xhtml_page(
            cfg,
            "Cover",
            f'<div class="cover"><img src="images/cover.png" alt="{title}"/></div>',
        ),
        encoding="utf-8",
    )

    # Front matter (without the markdown contents list)
    front_html = to_xhtml(
        clean_front_html(md_to_html(front_matter_without_contents(read(ms / "00-front-matter.md"))))
    )
    (oebps / "front.xhtml").write_text(
        xhtml_page(cfg, "Front Matter", f'<section class="front">{front_html}</section>'),
        encoding="utf-8",
    )

    intro_html = to_xhtml(md_to_html(read(ms / "01-introduction.md")))
    (oebps / "intro.xhtml").write_text(
        xhtml_page(cfg, "Introduction", f'<section class="intro-section">{intro_html}</section>'),
        encoding="utf-8",
    )

    book_uuid = "urn:uuid:" + str(uuid.uuid5(uuid.NAMESPACE_URL, cfg["uuid_seed"]))

    manifest = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
        '<item id="css" href="style.css" media-type="text/css"/>',
        '<item id="cover-img" href="images/cover.png" media-type="image/png" properties="cover-image"/>',
        '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>',
        '<item id="front" href="front.xhtml" media-type="application/xhtml+xml"/>',
        '<item id="intro" href="intro.xhtml" media-type="application/xhtml+xml"/>',
    ]
    spine = ['<itemref idref="cover"/>', '<itemref idref="front"/>', '<itemref idref="intro"/>']

    nav_items = [f'<li><a href="intro.xhtml">{intro_label}</a></li>']
    ncx_points = [
        f'<navPoint id="nav-intro" playOrder="1"><navLabel><text>{intro_label}</text></navLabel><content src="intro.xhtml"/></navPoint>'
    ]
    order = 2

    chapter_titles = {}
    for i, name in enumerate(chapters, start=1):
        raw = read(ms / "chapters" / name)
        chapter_titles[i] = chapter_title(raw)
        ident = f"ch{i:02d}"
        html = to_xhtml(md_to_html(raw))
        html = strip_h1(html, ident, f"Chapter {i}", display_chapter_title(chapter_titles[i]))
        (oebps / f"{ident}.xhtml").write_text(
            xhtml_page(cfg, chapter_titles[i], f'<section class="chapter">{html}</section>'),
            encoding="utf-8",
        )
        manifest.append(
            f'<item id="{ident}" href="{ident}.xhtml" media-type="application/xhtml+xml"/>'
        )
        spine.append(f'<itemref idref="{ident}"/>')

    # Part dividers and nested nav
    nav_parts = []
    for part in parts:
        pid = part["id"]
        part_html = (
            f'<section class="part"><p class="part-number">{part["number"]}</p>'
            f'<h1 class="part-title">{part["title"]}</h1>'
            f'<p class="part-subtitle">{part["subtitle"]}</p></section>'
        )
        (oebps / f"{pid}.xhtml").write_text(
            xhtml_page(cfg, f'{part["number"]}: {part["title"]}', part_html), encoding="utf-8"
        )
        manifest.append(
            f'<item id="{pid}" href="{pid}.xhtml" media-type="application/xhtml+xml"/>'
        )
        # Put the part divider just before its first chapter in the spine.
        insert_at = spine.index(f'<itemref idref="ch{part["start"]:02d}"/>')
        spine.insert(insert_at, f'<itemref idref="{pid}"/>')

        child_items = "\n".join(
            f'<li><a href="ch{i:02d}.xhtml">{i}. {display_chapter_title(chapter_titles[i])}</a></li>'
            for i in range(part["start"], part["end"] + 1)
        )
        nav_parts.append(
            f'<li><a href="{pid}.xhtml">{part["number"]} — {part["title"]}</a><ol>{child_items}</ol></li>'
        )
        ncx_points.append(
            f'<navPoint id="nav-{pid}" playOrder="{order}"><navLabel><text>{part["number"]} — {part["title"]}</text></navLabel><content src="{pid}.xhtml"/>'
            + "".join(
                f'<navPoint id="nav-ch{i:02d}" playOrder="{order + 1 + (i - part["start"])}"><navLabel><text>{i}. {display_chapter_title(chapter_titles[i])}</text></navLabel><content src="ch{i:02d}.xhtml"/></navPoint>'
                for i in range(part["start"], part["end"] + 1)
            )
            + "</navPoint>"
        )
        order += 1 + (part["end"] - part["start"] + 1)

    back_html = to_xhtml(md_to_html(read(ms / "99-back-matter.md")))
    (oebps / "back.xhtml").write_text(
        xhtml_page(cfg, "Back Matter", f'<section class="back">{back_html}</section>'),
        encoding="utf-8",
    )
    manifest.append('<item id="back" href="back.xhtml" media-type="application/xhtml+xml"/>')
    spine.append('<itemref idref="back"/>')
    nav_items.append("".join(nav_parts))
    nav_items.append(f'<li><a href="back.xhtml">{back_label.replace("&", "&amp;")}</a></li>')
    ncx_points.append(
        f'<navPoint id="nav-back" playOrder="{order}"><navLabel><text>{back_label.replace("&", "&amp;")}</text></navLabel><content src="back.xhtml"/></navPoint>'
    )

    language = cfg["language"]
    nav_xhtml = f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="{language}" xml:lang="{language}">
<head><meta charset="utf-8"/><title>Contents</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<nav epub:type="toc" id="toc"><h1 class="toc-title">Contents</h1><ol>
{"".join(nav_items)}
</ol></nav>
<nav epub:type="landmarks" hidden="hidden">
<ol>
<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>
<li><a epub:type="bodymatter" href="intro.xhtml">Start Reading</a></li>
</ol>
</nav>
</body>
</html>
"""
    (oebps / "nav.xhtml").write_text(nav_xhtml, encoding="utf-8")

    ncx = f"""<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
<meta name="dtb:uid" content="{book_uuid}"/>
<meta name="dtb:depth" content="2"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>{title}</text></docTitle>
<navMap>
{"".join(ncx_points)}
</navMap>
</ncx>
"""
    (oebps / "toc.ncx").write_text(ncx, encoding="utf-8")

    modified = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    def xml_escape(s: str) -> str:
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    subjects = "\n".join(f"<dc:subject>{xml_escape(s)}</dc:subject>" for s in cfg["subjects"])
    description = xml_escape(cfg["description"])
    opf = f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="{language}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">{book_uuid}</dc:identifier>
<dc:title id="title">{title}</dc:title>
<dc:title id="subtitle">{cfg["subtitle"]}</dc:title>
<meta refines="#title" property="title-type">main</meta>
<meta refines="#subtitle" property="title-type">subtitle</meta>
<dc:creator>{cfg["author"]}</dc:creator>
<dc:language>{language}</dc:language>
<dc:publisher>{cfg["publisher"]}</dc:publisher>
<dc:date>{cfg["year"]}</dc:date>
<dc:description>{description}</dc:description>
{subjects}
<meta property="dcterms:modified">{modified}</meta>
<meta name="cover" content="cover-img"/>
</metadata>
<manifest>
{chr(10).join(manifest)}
</manifest>
<spine toc="ncx">
{chr(10).join(spine)}
</spine>
</package>
"""
    (oebps / "content.opf").write_text(opf, encoding="utf-8")

    out = out_dir / f"{slug}.epub"
    if out.exists():
        out.unlink()
    with zipfile.ZipFile(out, "w") as z:
        z.write(work / "mimetype", "mimetype", compress_type=zipfile.ZIP_STORED)
        for path in sorted(work.rglob("*")):
            if path.is_file() and path.name != "mimetype":
                z.write(path, path.relative_to(work).as_posix(), compress_type=zipfile.ZIP_DEFLATED)
    shutil.rmtree(work)
    return out


def build_combined_markdown(cfg: dict) -> Path:
    ms = ROOT / cfg["manuscript_dir"]
    chapters = [c["file"] for c in cfg["chapters"]]
    chunks = []
    chunks.append(read(ms / "00-front-matter.md").split("## Contents")[0].rstrip())
    chunks.append(read(ms / "01-introduction.md").rstrip())
    for part in cfg["parts"]:
        chunks.append(f"# {part['number']} — {part['title']}\n\n*{part['subtitle']}*")
        for i in range(part["start"], part["end"] + 1):
            chunks.append(read(ms / "chapters" / chapters[i - 1]).rstrip())
    chunks.append(read(ms / "99-back-matter.md").rstrip())
    out = DIST / cfg["id"] / f"{cfg['slug']}.md"
    out.write_text("\n\n---\n\n".join(chunks) + "\n", encoding="utf-8")
    return out


def _section_opening_pages(pdf_path: Path, cfg: dict) -> list[int]:
    """Find PDF page numbers where the intro, chapters, and back matter open
    (so running heads can be suppressed there)."""
    from pypdf import PdfReader

    def norm(s: str) -> str:
        return re.sub(r"[\s\x00]+", "", s)

    prefixes = {
        norm(cfg["intro"]["toc_label"]),
        norm(cfg["back"]["toc_label"]),
    }
    reader = PdfReader(str(pdf_path))
    pages = []
    for idx, page in enumerate(reader.pages, start=1):
        text = norm(page.extract_text() or "")
        if re.match(r"^[A-Z]CHAPTER\d{1,2}", text) or any(text.startswith(p) for p in prefixes):
            pages.append(idx)
    return pages


def build_print_pdf(cfg: dict, html: str) -> Path:
    from weasyprint import HTML, CSS

    out_dir = DIST / cfg["id"]
    html_path = out_dir / "print.html"
    html_path.write_text(html, encoding="utf-8")
    out = out_dir / f"{cfg['slug']}-print.pdf"
    prepass = out_dir / "_prepass.pdf"
    HTML(string=html, base_url=str(out_dir)).write_pdf(
        str(prepass), stylesheets=[CSS(string=print_css(cfg))]
    )
    opening_pages = _section_opening_pages(prepass, cfg)
    extra = "\n".join(
        f"@page main:nth({p}) {{ @top-left {{ content: none; }} @top-right {{ content: none; }} }}"
        for p in opening_pages
    )
    css = print_css(cfg) + "\n" + extra
    (out_dir / "print.css").write_text(css, encoding="utf-8")
    HTML(string=html, base_url=str(out_dir)).write_pdf(
        str(out), stylesheets=[CSS(string=css)]
    )
    prepass.unlink(missing_ok=True)
    return out


COVER_CSS_TEMPLATE = r"""
@page { size: {total_w:.3f}in {total_h:.3f}in; margin: 0; }
html, body { margin: 0; padding: 0; }
.wrap { position: relative; width: {total_w:.3f}in; height: {total_h:.3f}in; background: #2a0f4a; }
.back {
  position: absolute; left: 0; top: 0;
  width: {back_w:.3f}in; height: {total_h:.3f}in;
  background: #2a0f4a; color: #f5ead9;
  box-sizing: border-box;
  padding: 0.85in 0.7in 0.75in 0.85in;
}
.series {
  font-family: "Open Sans", sans-serif;
  font-size: 8.5pt; letter-spacing: 0.24em; text-transform: uppercase;
  color: #d9b46a; margin: 0 0 0.3in 0;
}
.back h2 {
  font-family: "Open Sans", sans-serif;
  font-size: 22pt; line-height: 1.15; font-weight: 800;
  letter-spacing: -0.01em; color: #ffffff;
  margin: 0 0 0.18in 0;
}
.back .lede {
  font-family: "Open Sans", sans-serif;
  font-size: 11pt; line-height: 1.5; font-style: italic;
  color: #e7d7bd; margin: 0 0 0.22in 0;
}
.back p {
  font-family: "Open Sans", sans-serif;
  font-size: 9.4pt; line-height: 1.55; color: #f0e4d2;
  margin: 0 0 0.14in 0;
}
.back ul { margin: 0.08in 0 0.2in 0; padding-left: 0.2in; }
.back li {
  font-family: "Open Sans", sans-serif;
  font-size: 9.4pt; line-height: 1.45; color: #f0e4d2;
  margin: 0 0 0.06in 0;
}
.back li::marker { color: #d9b46a; }
.back .punch {
  font-size: 11pt; font-weight: 700; color: #d9b46a;
  margin-top: 0.24in;
}
.back .author {
  position: absolute; left: 0.85in; bottom: 0.62in;
  max-width: 2.05in;
  font-family: "Open Sans", sans-serif;
  font-size: 9.5pt; line-height: 1.5;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: #ffffff; margin: 0;
}
.back .publisher {
  display: block;
  font-size: 7.5pt; letter-spacing: 0.2em;
  color: #d9b46a; margin-top: 0.05in;
}
.barcode {
  position: absolute; right: 0.7in; bottom: 0.55in;
  width: 2in; height: 1.2in; background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-family: "Open Sans", sans-serif; font-size: 7pt; color: #333333;
  text-align: center;
}
.spine {
  position: absolute; left: {spine_x:.3f}in; top: 0;
  width: {spine_w:.3f}in; height: {total_h:.3f}in;
  background: #2a0f4a;
}
.spine-inner {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(90deg);
  white-space: nowrap;
  font-family: "Open Sans", sans-serif;
  font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase;
  color: #d9b46a;
}
.spine-inner .sep { color: #8a6d4a; padding: 0 0.18in; }
.front {
  position: absolute; left: {front_x:.3f}in; top: 0;
  width: {front_w:.3f}in; height: {total_h:.3f}in;
  overflow: hidden;
}
.front img { width: 100%; height: 100%; object-fit: cover; display: block; }
"""


def build_cover_wrap(cfg: dict) -> Path:
    from pypdf import PdfReader
    from weasyprint import HTML, CSS

    out_dir = DIST / cfg["id"]
    pdf_path = out_dir / f"{cfg['slug']}-print.pdf"
    pages = len(PdfReader(str(pdf_path)).pages)
    spine_w = pages * 0.002252
    total_w = 12.25 + spine_w
    total_h = 9.25
    back_w = 6.125
    spine_x = back_w
    front_x = spine_x + spine_w
    front_w = 6.125

    vals = dict(total_w=total_w, total_h=total_h, back_w=back_w,
                spine_x=spine_x, spine_w=spine_w, front_x=front_x, front_w=front_w)
    css = re.sub(r"\{(\w+):\.3f\}", lambda m: f"{vals[m.group(1)]:.3f}", COVER_CSS_TEMPLATE)

    cb = cfg["cover_back"]
    bullets = "\n".join(f"      <li>{b}</li>" for b in cb["bullets"])
    cover = ROOT / cfg["cover"]
    title = cfg["title"]
    author = cfg["author"]
    publisher = cfg["publisher"]

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"/><style>{css}</style></head>
<body>
<div class="wrap">
  <div class="back">
    <p class="series">{cb["series_line"]}</p>
    <h2>{cb["headline"]}</h2>
    <p class="lede">{cb["lede"]}</p>
    <p>{cb["blurb"]}</p>
    <p><strong>Inside:</strong></p>
    <ul>
{bullets}
    </ul>
    <p class="punch">{cb["punch"]}</p>
    <p class="author">{author}<span class="publisher">{publisher}</span><span class="publisher">studio.gabochie.com</span></p>
    <div class="barcode">{cb["isbn_line"]}</div>
  </div>
  <div class="spine">
    <div class="spine-inner">{title}<span class="sep">·</span>{author}</div>
  </div>
  <div class="front">
    <img src="{cover.as_posix()}" alt="{title} cover"/>
  </div>
</div>
</body></html>
"""

    html_path = out_dir / "cover-wrap.html"
    html_path.write_text(html, encoding="utf-8")
    out = out_dir / f"{cfg['slug']}-cover-wrap.pdf"
    HTML(string=html, base_url=str(ROOT)).write_pdf(str(out))
    return out


def build_front_cover(cfg: dict) -> Path:
    from weasyprint import HTML

    cover = ROOT / cfg["cover"]
    title = cfg["title"]
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"/><style>
@page {{ size: 6.25in 9.25in; margin: 0; }}
html, body {{ margin: 0; padding: 0; }}
img {{ width: 6.25in; height: 9.25in; object-fit: cover; display: block; }}
</style></head><body>
<img src="{cover.as_posix()}" alt="{title} cover"/>
</body></html>
"""
    out = DIST / cfg["id"] / f"{cfg['slug']}-cover-front.pdf"
    HTML(string=html, base_url=str(ROOT)).write_pdf(str(out))
    return out


def build_book(book_id: str) -> None:
    cfg = load_config(book_id)
    out_dir = DIST / cfg["id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    html = build_print_html(cfg)
    print(f"Building {cfg['title']}...")
    print("  combined manuscript...", build_combined_markdown(cfg))
    print("  EPUB...", build_epub(cfg))
    print("  print PDF...", build_print_pdf(cfg, html))
    print("  cover wrap...", build_cover_wrap(cfg))
    print("  front cover...", build_front_cover(cfg))
    print(f"Done. → dist/{cfg['id']}/")


def list_books() -> None:
    configs = sorted(p for p in BOOKS_DIR.glob("*.toml") if p.stem != "_template")
    if not configs:
        print("No book configs found in", BOOKS_DIR)
        return
    for path in configs:
        cfg = load_config(path.stem)
        print(f"{path.stem:28s} {cfg['title']}  —  {cfg.get('author', '')}")


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    arg = sys.argv[1]
    if arg in ("-l", "--list"):
        list_books()
        return
    build_book(arg)


if __name__ == "__main__":
    main()
