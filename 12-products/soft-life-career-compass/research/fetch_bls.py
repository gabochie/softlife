#!/usr/bin/env python3
"""Fetch the verified BLS/American Community Survey career facts used by the
Soft Life Career Compass.

Source pages reproduce BLS OEWS May 2025 and BLS Employment Projections
2025-35. The output is a CSV for review; build.py merges it with roles.csv.
"""

from __future__ import annotations

import csv
import html as html_module
import re
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROLES = HERE / "roles.csv"
OUT = HERE / "career-data.csv"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read().decode("utf-8", "ignore")


def plain(html: str) -> str:
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html_module.unescape(text)).strip()


def money(pattern: str, text: str) -> int | None:
    match = re.search(pattern, text, re.I)
    return int(match.group(1).replace(",", "")) if match else None


def parse(slug: str) -> dict:
    url = f"https://careerfacts.org/{slug}"
    html = fetch(url)
    text = plain(html)

    tick_values = []
    for label in ("lowest 10%", "25th percentile", "median", "75th percentile", "top 10%"):
        match = re.search(rf"\$([\d,]+)\s*{re.escape(label)}", text, re.I)
        tick_values.append(int(match.group(1).replace(",", "")) if match else None)

    growth_match = re.search(r"Job growth,\s*2025[–-]35\s*([+\-]?[\d.]+%)", text, re.I)
    openings_match = re.search(r"Openings per year\s*([\d,]+)", text, re.I)
    soc_match = re.search(r"\b(\d{2}-\d{4})\.00\b", text)
    employment_match = re.search(r"About ([\d,]+) people held these jobs", text, re.I)
    self_match = re.search(r"Only ([\d.]+)% were self-employed", text, re.I)
    education_match = re.search(
        r"Typical entry education\s*(.+?)\s*Pay By state", text, re.I
    )

    return {
        "median": tick_values[2],
        "p10": tick_values[0],
        "p25": tick_values[1],
        "p75": tick_values[3],
        "p90": tick_values[4],
        "growth_pct": growth_match.group(1) if growth_match else "",
        "openings": int(openings_match.group(1).replace(",", "")) if openings_match else "",
        "soc": soc_match.group(1) if soc_match else "",
        "employment_oews": int(employment_match.group(1).replace(",", "")) if employment_match else "",
        "self_employed_pct": self_match.group(1) if self_match else "",
        "education": education_match.group(1) if education_match else "",
        "source_url": url,
    }


def main() -> None:
    with ROLES.open(newline="", encoding="utf-8") as handle:
        roles = list(csv.DictReader(handle))

    fields = [
        "slug", "display_name", "bls_title", "track", "remote_group",
        "schedule_control", "energy", "entry_ease", "entry_path", "why_soft",
        "watchout", "soc", "median", "p10", "p25", "p75", "p90",
        "growth_pct", "openings", "employment_oews", "self_employed_pct",
        "education", "source_url",
    ]
    rows = []
    for role in roles:
        facts = parse(role["slug"])
        rows.append({**role, **facts})
        print(f"{role['display_name']:<42} median=${facts['median']:>7,}  growth={facts['growth_pct']:>7}  openings={facts['openings']:>7,}")
        time.sleep(0.35)

    with OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nWrote {OUT} ({len(rows)} roles)")


if __name__ == "__main__":
    main()
