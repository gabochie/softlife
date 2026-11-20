# The Soft Life System — Design System & Style Guide

**Source of truth:** `app/css/app.css` (single stylesheet, no build step)  
**Last updated:** 19 Nov 2026

This document extracts the live design tokens and component patterns from `app.css` so new pages, blog posts, and components don't drift visually. When in doubt, check `app.css` first — this doc is a summary, not a replacement.

---

## 1. Design tokens (`:root` custom properties)

| Category | Token | Value | Usage |
|----------|-------|-------|-------|
| **Palette — deep** | `--royal` | `#2b1055` | Primary dark, headings, hero gradients |
| | `--royal-2` | `#34146b` | Secondary dark |
| | `--royal-3` | `#4a1d7e` | Link color, tertiary dark |
| **Palette — pink** | `--pink` | `#f078a8` | Primary accent, CTA gradient start |
| | `--pink-deep` | `#b83e6d` | Tags, active states |
| | `--pink-soft` | `#fce9f1` | Card tints, form backgrounds |
| | `--pink-glow` | `#f9c9dc` | Kicker text on dark |
| **Palette — gold** | `--gold` | `#e8b93b` | CTA gradient end, accents |
| | `--gold-2` | `#d9a94e` | Secondary gold |
| | `--gold-soft` | `#faf0d7` | Footer ghost CTA, error chip |
| **Palette — lavender** | `--lav` | `#c7c8f5` | Audio card background |
| | `--lav-soft` | `#efeefc` | Code blocks, light tints |
| **Palette — neutral** | `--cream` | `#fbf5f0` | Page background, form inputs |
| | `--ink` | `#2e2438` | Body text |
| | `--muted` | `#6b5d78` | Secondary text, captions |
| | `--line` | `#efdfdd` | Borders, dividers |
| **Gradients** | `--grad-cta` | `linear-gradient(135deg, var(--pink) 0%, var(--gold) 100%)` | Primary CTA buttons |
| | `--grad-hero` | `linear-gradient(150deg, #2b1055 0%, #34146b 45%, #5d2189 100%)` | Hero & CTA bands |
| **Typography** | `--sans` | `'Segoe UI', system-ui, -apple-system, sans-serif` | UI, body, buttons |
| | `--serif` | `Georgia, 'Times New Roman', serif` | Headings (h1-h3), blockquotes, stats |
| **Geometry** | `--radius` | `18px` | Default border radius |
| | `--shadow` | `0 10px 30px rgba(43,16,85,.10)` | Cards, subtle lift |
| | `--shadow-lift` | `0 16px 44px rgba(43,16,85,.16)` | Auth cards, hover states |

**Add new tokens** at the top of `app/css/app.css` inside `:root`, then use `var(--token-name)` everywhere. Do not hardcode hex values in component CSS.

---

## 2. Icon system

Social/action icons are inline SVG data URIs stored as CSS custom properties in the second `:root` block (line ~178 of `app.css`):

| Token | Icon |
|-------|------|
| `--ic-instagram` | Instagram |
| `--ic-tiktok` | TikTok |
| `--ic-youtube` | YouTube |
| `--ic-facebook` | Facebook *(not used on live surfaces — Instagram/Facebook were removed from footers)* |
| `--ic-x` | X |
| `--ic-linkedin` | LinkedIn |
| `--ic-whatsapp` | WhatsApp |
| `--ic-email` | Email |
| `--ic-link` | Link |
| `--ic-native` | Native share |

Use pattern: `.share-x { --ic: var(--ic-x) }` with `.share-btn` base class. Social logos are **square brand assets only** — do not use rounded or wordmark variants.

---

## 3. Component patterns

### Layout
| Class | Purpose |
|-------|---------|
| `.wrap` | Max-width container, `1000px`, centered, `20px` side padding |
| `.center` | `text-align: center` |
| `.section` | Vertical section, `60px` top/bottom padding |
| `.pale` | White background section |

### Typography
| Class | Font | Size | Use |
|-------|------|------|-----|
| `h1, h2, h3` | `--serif` (Georgia) | `2.5rem` / `1.7rem` / `1.16rem` | Headings, royal color |
| `.kicker` | `--sans` | `.72rem` | Uppercase section label, pink-glow |
| `.lede` | `--sans` | `1.03rem` | Hero/intro summary, off-white |
| `.sub` | `--sans` | `.89rem` | Section subtitle, muted |
| `.note` | `--sans` | `.8rem` | Fine print, muted |
| `.tag` | `--sans` | `.66rem` | Uppercase category label, pink-deep |
| `.btn` | `--sans` | `.92rem` | Primary button, royal background |

### Buttons
| Variant | Class | Use |
|---------|-------|-----|
| Primary | `.btn` | Royal background, white text |
| CTA gradient | `.btn.gold` | Pink→gold gradient, main conversion CTAs |
| Large | `.btn.big` | `16px 32px` padding, `1rem` |
| Full width | `.btn.wide` | `width: 100%` |
| Outline | `.btn.ghost` | Transparent, royal border |
| Small | `.btn.sm` | `7px 12px`, `.78rem` (CRM/admin) |

### Cards
| Class | Purpose |
|-------|---------|
| `.card` | White/pink-soft gradient card, `var(--radius)`, shadow |
| `.card.link` | Clickable card, hover lift |
| `.post-card` | Blog post card, aspect-ratio image |
| `.stat` | Stat tile, big serif number |

### Footer
| Class | Purpose |
|-------|---------|
| `.site-footer` | Dark purple gradient (`--royal` → darker), `padding-bottom: 28px` |
| `.footer-cta` | CTA block with headline + two buttons |
| `.footer-grid` | 4-column grid: Brand, Explore, Support, Legal |
| `.footer-social` | Circular social icons, square brand assets only |

### Mobile (PWA)
- Breakpoint: `max-width: 860px`
- Desktop header nav hides; `.public-tabbar` shows fixed bottom bar
- `.tabs a` become column layout, icon + label stacked
- `.m-tabbar` for member app shell

---

## 4. Accessibility & performance rules (from the codebase)

- Skip link: `.skip` at top of every page
- `prefers-reduced-motion`: not explicitly set; avoid heavy animations
- Focus visible: `outline: 3px solid var(--gold-soft)` on interactive elements
- Color contrast: pink-deep on white, royal on cream — verify new color combos
- Images: `loading="lazy" decoding="async"` on offscreen images; aspect-ratio boxes to prevent CLS
- Fonts: system-ui stack (no web font requests) — zero render-blocking font load

---

## 5. How to add a new page or component

1. Check `design-tokens.md` first — reuse existing tokens, don't invent new colors
2. Use `.wrap`, `.section`, `.card`, `.btn` classes before writing custom CSS
3. If you must add custom CSS, append to `app/css/app.css` with a section comment
4. Add new CSS custom properties to the `:root` block, not inline
5. Test mobile (`@media(max-width: 860px)`) — the bottom tab bar is the primary nav there
6. Keep `data-sl-surface` attributes consistent for the shared nav renderer (`js/nav.js`)

---

## 6. What's NOT in this system (gaps to fill)

- No type scale beyond h1-h3 and body
- No spacing scale (padding/margin values are ad hoc: `24px`, `18px`, `30px`, `32px`, `40px`, `56px`, `60px`, `72px`, `80px`)
- No z-index scale (values scattered: `50`, `60`, `70`, `80`, `999`, `9999`)
- No breakpoints beyond `860px` and `520px`/`700px`/`760px` in places

**Recommendation:** When adding the next component, define a spacing scale (`--space-1` … `--space-6`) and z-index tokens (`--z-dropdown`, `--z-modal`, etc.) in `:root` and refactor incrementally.
