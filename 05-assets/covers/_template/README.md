# Cover art — series template

Each book needs one PNG here:

    05-assets/covers/<book-id>/cover-<book-id>-v1.png

Spec (from the Book 1 build):
- Aspect ratio: 2:3 (Book 1 art is 1024×1536)
- Print wrap builds the front cover at 6.125 × 9.125 in plus 0.125 in bleed
  → 6.25 × 9.25 in page; aim for ≥ 300 DPI of source art if you can regenerate
  (Book 1 art renders ~164 DPI — accepted as-is; softer on close inspection)
- Series brand: plum background #2a0f4a, gold accents #d9b46a, cream text #f5ead9
- Title art must include the title + author lockup; the spine and back cover
  are generated typeset HTML, not part of the PNG

The engine only needs the PNG path in the book's TOML ([book].cover).
