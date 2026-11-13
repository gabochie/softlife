# Book Covers

Drop cover illustrations into the matching book folder.

| Folder | Book |
| --- | --- |
| `01-soft-life-system/` | The Soft Life System |
| `02-soft-life-budgeting/` | Soft Life Budgeting |
| `03-soft-life-money/` | Soft Life Money |
| `04-soft-life-blueprint/` | The Soft Life Blueprint |
| `05-15-hour-workweek-for-women/` | The 15-Hour Workweek for Women |

## Naming Convention

Use: `cover-[book-slug]-[version].[ext]`

Examples:
- `cover-soft-life-system-v1.png`
- `cover-soft-life-system-v1-front.jpg`

## Recommended Specs

- **Front cover:** 1600 x 2560 px (portrait, 1:1.6)
- **Formats:** PNG or JPG (300 DPI for print), SVG/AI/PSD for source files
- Keep source/editable files in the same folder.

## Special Folders

- `_template/` — art spec for new books (see its README).
- `_source/` — original raw cover art (pre-rename masters). Keep for reference; the build only reads the `cover-<book-id>-v1.png` file in each book folder.
