"""Deploy-time cache busting for Soft Life static assets.

Run AFTER copying app/ to public/ and BEFORE `wrangler deploy`.

Appends a build version query string to every local JS/CSS reference in the
generated public/ tree so returning visitors never see a stale header/nav
after a deploy. Also bumps the service worker version and stamps its
precache list so the offline shell matches.

Usage:  python stamp.py [BUILD_ID]
"""
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Optional deploy-time minifiers. Source files in app/ are never touched —
# only the generated public/ copy is minified. If the packages are not
# installed the deploy simply ships unminified assets (graceful fallback).
try:
    import rjsmin
    import rcssmin
except ImportError:
    rjsmin = rcssmin = None

PUBLIC = Path(__file__).resolve().parent / "public"
BUILD = sys.argv[1] if len(sys.argv) > 1 else datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

SKIP_PREFIXES = ("http://", "https://", "//", "data:", "mailto:", "#", "tel:")
ASSET_RE = re.compile(r'(\b(?:src|href)=")([^"]+)(")')


def stamp_url(url: str) -> str:
    if url.startswith(SKIP_PREFIXES):
        return url
    path = url.split("?", 1)[0].split("#", 1)[0]
    if not path.lower().endswith((".js", ".css")):
        return url
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}v={BUILD}"


def stamp_html() -> int:
    changed = 0
    for page in sorted(PUBLIC.rglob("*.html")):
        s = page.read_text(encoding="utf-8")

        def repl(m):
            return m.group(1) + stamp_url(m.group(2)) + m.group(3)

        out = ASSET_RE.sub(repl, s)

        # Service worker script URL: force a fresh fetch so the new version installs.
        out = re.sub(
            r"(serviceWorker\.register\(\s*['\"])(sw\.js)(['\"])",
            lambda m: m.group(1) + f"sw.js?v={BUILD}" + m.group(3),
            out,
        )
        if out != s:
            page.write_text(out, encoding="utf-8", newline="\n")
            changed += 1
    return changed


def stamp_sw() -> bool:
    sw = PUBLIC / "sw.js"
    if not sw.exists():
        return False
    s = sw.read_text(encoding="utf-8")
    out = re.sub(r"const SW_VERSION = 'softlife-v[^']*';", f"const SW_VERSION = 'softlife-v31-b{BUILD}';", s, count=1)

    # Only rewrite entries inside the SHELL array.
    m = re.search(r"(const SHELL = \[)(.*?)(\];)", out, re.S)
    if m:
        body = re.sub(
            r"(['\"])(/[^'\"]+\.(?:js|css))(['\"])",
            lambda x: x.group(1) + x.group(2) + f"?v={BUILD}" + x.group(3),
            m.group(2),
        )
        out = out[:m.start(2)] + body + out[m.end(2):]

    if out != s:
        sw.write_text(out, encoding="utf-8", newline="\n")
        return True
    return False


def minify_assets() -> tuple:
    """Minify JS/CSS in the deploy copy only. Returns (js, css, bytes_saved)."""
    if rjsmin is None or rcssmin is None:
        return (0, 0, 0)
    n_js = n_css = saved = 0
    for path in PUBLIC.rglob("*"):
        if not path.is_file() or path.suffix not in (".js", ".css"):
            continue
        original = path.read_text(encoding="utf-8")
        if path.suffix == ".js":
            minified = rjsmin.jsmin(original)
            n_js += 1
        else:
            minified = rcssmin.cssmin(original)
            n_css += 1
        if minified and len(minified) < len(original):
            saved += len(original) - len(minified)
            path.write_text(minified, encoding="utf-8", newline="\n")
    return (n_js, n_css, saved)


if __name__ == "__main__":
    if not PUBLIC.is_dir():
        raise SystemExit(f"missing {PUBLIC} — copy app/ to public/ first")
    pages = stamp_html()
    sw = stamp_sw()
    n_js, n_css, saved = minify_assets()
    print(
        f"BUILD={BUILD} | html stamped: {pages} | sw stamped: {sw} | "
        f"minified: {n_js} js + {n_css} css ({saved:,} bytes saved)"
    )
