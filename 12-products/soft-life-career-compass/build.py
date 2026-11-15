#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import math
import re
import statistics
from pathlib import Path

import markdown
from weasyprint import HTML

BASE = Path(__file__).resolve().parent
RESEARCH = BASE / "research"
MANUSCRIPT = BASE / "manuscript"
DIST = BASE / "dist"
CHARTS = DIST / "charts"

INK = "#241536"
PURPLE = "#2a0f4a"
GOLD = "#d9b46a"
ROSE = "#b85c72"
SAGE = "#6f8f7a"
PAPER = "#fbf8f2"
MUTED = "#7a6c86"
LINE = "#e3d9ca"

TRACK_ORDER = ["Data & Tech", "Corporate & Operations", "Wellness & Care", "Creative & Client"]
TRACK_COLORS = {
    "Data & Tech": PURPLE,
    "Corporate & Operations": SAGE,
    "Wellness & Care": ROSE,
    "Creative & Client": "#a8792f",
}
TELEWORK = {
    "computer": 65.4,
    "business": 55.9,
    "office": 25.1,
    "healthcare": 13.1,
    "personal": 10.7,
    "arts": 46.8,
    "sales": 23.8,
}

CLAIMS = [
    {
        "slug": "data-scientists",
        "claim": "$110k–$180k",
        "match": "Data scientists",
        "low": 110000,
        "high": 180000,
        "verdict": "Supported, but the top end is understated",
        "level": "good",
        "chart": True,
        "chart_label": "Data scientist",
    },
    {
        "slug": "information-security-analysts",
        "claim": "$90k–$160k",
        "match": "Information security analysts",
        "low": 90000,
        "high": 160000,
        "verdict": "Supported; the 10th percentile sits below the claimed floor",
        "level": "good",
        "chart": True,
        "chart_label": "Security analyst",
    },
    {
        "slug": "technical-writers",
        "claim": "$90k–$105k",
        "match": "Technical writers",
        "low": 90000,
        "high": 105000,
        "verdict": "Median supported; the range hides junior pay and a higher ceiling",
        "level": "warn",
        "chart": True,
        "chart_label": "Technical writer",
    },
    {
        "slug": "web-and-digital-interface-designers",
        "claim": "$75k–$150k",
        "match": "Web and digital interface designers",
        "low": 75000,
        "high": 150000,
        "verdict": "Plausible for mid-level; the top end is understated",
        "level": "good",
        "chart": False,
    },
    {
        "slug": "project-management-specialists",
        "claim": "$100k–$130k",
        "match": "Project management specialists",
        "low": 100000,
        "high": 130000,
        "verdict": "Median supported; $100k is not an entry wage",
        "level": "warn",
        "chart": False,
    },
    {
        "slug": "actuaries",
        "claim": "$105k–$145k",
        "match": "Actuaries",
        "low": 105000,
        "high": 145000,
        "verdict": "Supported, but ignores a multi-year exam path",
        "level": "good",
        "chart": False,
    },
    {
        "slug": "dental-hygienists",
        "claim": "$85k–$115k",
        "match": "Dental hygienists",
        "low": 85000,
        "high": 115000,
        "verdict": "Supported; licensing and in-person work are required",
        "level": "good",
        "chart": True,
        "chart_label": "Dental hygienist",
    },
    {
        "slug": "optometrists",
        "claim": "$90k–$130k",
        "match": "Optometrists",
        "low": 90000,
        "high": 130000,
        "verdict": "Understated; a doctoral degree is required",
        "level": "good",
        "chart": True,
        "chart_label": "Optometrist",
    },
    {
        "slug": "audiologists",
        "claim": "$90k–$130k",
        "match": "Audiologists",
        "low": 90000,
        "high": 130000,
        "verdict": "Broadly supported; a doctorate is now standard",
        "level": "good",
        "chart": False,
    },
    {
        "slug": "dietitians-and-nutritionists",
        "claim": "$70k–$100k",
        "match": "Dietitians and nutritionists",
        "low": 70000,
        "high": 100000,
        "verdict": "Supported; licensure varies by state",
        "level": "good",
        "chart": False,
    },
    {
        "slug": "exercise-trainers-and-group-fitness-instructors",
        "claim": "$60k–$100k",
        "match": "Exercise trainers and group fitness instructors",
        "low": 60000,
        "high": 100000,
        "verdict": "Overstated at the median; the top decile clears the claim",
        "level": "bad",
        "chart": True,
        "chart_label": "Exercise trainer",
    },
    {
        "slug": "skincare-specialists",
        "claim": "$60k–$125k",
        "match": "Skincare specialists",
        "low": 60000,
        "high": 125000,
        "verdict": "Overstated; the median is less than half the claimed floor",
        "level": "bad",
        "chart": True,
        "chart_label": "Skincare specialist",
    },
    {
        "slug": "travel-agents",
        "claim": "$60k–$150k",
        "match": "Travel agents",
        "low": 60000,
        "high": 150000,
        "verdict": "Overstated; commission outliers drive the top end",
        "level": "bad",
        "chart": True,
        "chart_label": "Travel agent",
    },
    {
        "slug": "executive-secretaries-and-executive-administrative-assistants",
        "claim": "$75k–$110k",
        "match": "Executive assistants",
        "low": 75000,
        "high": 110000,
        "verdict": "Supported at the top of the range, not at entry",
        "level": "warn",
        "chart": False,
    },
    {
        "slug": "writers-and-authors",
        "claim": "$65k–$130k",
        "match": "Writers and authors",
        "low": 65000,
        "high": 130000,
        "verdict": "Plausible for experienced specialists; highly variable",
        "level": "warn",
        "chart": False,
    },
    {
        "slug": None,
        "claim": "$90k–$100k",
        "match": "Medical records specialists",
        "median": 51140,
        "p10": 37000,
        "p90": 81150,
        "low": 90000,
        "high": 100000,
        "verdict": "Overstated; the BLS median is about half the claimed floor",
        "level": "bad",
        "chart": False,
    },
]


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def money(value: float | int | str) -> str:
    return f"${int(round(float(value))):,}"


def compact_money(value: float | int | str) -> str:
    number = float(value)
    if number >= 1000:
        return f"${number / 1000:.0f}k"
    return f"${number:,.0f}"


def clean_education(value: str) -> str:
    return re.split(r"\s*\[\d+\]", value)[0].strip()


def growth_number(value: str) -> float:
    return float(value.replace("%", "").replace("+", "").strip())


def load_rows() -> list[dict]:
    with (RESEARCH / "career-data.csv").open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    with (RESEARCH / "profile-notes.csv").open(newline="", encoding="utf-8") as handle:
        notes = {row["slug"]: row for row in csv.DictReader(handle)}

    for row in rows:
        row["median"] = int(row["median"])
        row["p10"] = int(row["p10"])
        row["p25"] = int(row["p25"])
        row["p75"] = int(row["p75"])
        row["p90"] = int(row["p90"])
        row["openings"] = int(row["openings"])
        row["growth"] = growth_number(row["growth_pct"])
        row["education"] = clean_education(row["education"])
        row["telework"] = TELEWORK[row["remote_group"]]
        row["note"] = notes[row["slug"]]
        row["income_score"] = min(100.0, row["median"] / 150000 * 100)
        row["growth_score"] = max(0.0, min(100.0, 50 + row["growth"] * 2.5))
        row["openings_score"] = min(100.0, row["openings"] / 50000 * 100)
        row["demand_score"] = 0.6 * row["growth_score"] + 0.4 * row["openings_score"]
        row["schedule_score"] = float(row["schedule_control"]) * 20
        row["energy_score"] = float(row["energy"]) * 20
        row["entry_score"] = float(row["entry_ease"]) * 20
        row["soft"] = (
            0.30 * row["income_score"]
            + 0.25 * row["schedule_score"]
            + 0.20 * row["energy_score"]
            + 0.10 * row["entry_score"]
            + 0.15 * row["demand_score"]
        )
        entry = float(row["entry_ease"])
        row["barrier"] = "High barrier" if entry <= 2 else "Moderate barrier" if entry <= 3.5 else "Lower barrier"
        row["fit"] = (
            "Strong fit"
            if row["soft"] >= 70
            else "Good fit with trade-offs"
            if row["soft"] >= 65
            else "Conditional fit"
            if row["soft"] >= 60
            else "Hard to make soft"
        )
    return sorted(rows, key=lambda item: item["soft"], reverse=True)


def svg_open(width: int, height: int) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" fill="{PAPER}"/>',
    ]


def text(
    x: float,
    y: float,
    value: object,
    size: float = 11,
    fill: str = INK,
    weight: int = 400,
    anchor: str = "start",
) -> str:
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="Open Sans, sans-serif" '
        f'font-size="{size:.1f}" font-weight="{weight}" fill="{fill}" '
        f'text-anchor="{anchor}">{esc(value)}</text>'
    )


def rect(x: float, y: float, width: float, height: float, fill: str, rx: float = 0, opacity: float = 1) -> str:
    return (
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{max(0.0, width):.1f}" height="{height:.1f}" '
        f'fill="{fill}" rx="{rx}" opacity="{opacity}"/>'
    )


def line(x1: float, y1: float, x2: float, y2: float, stroke: str = LINE, width: float = 1, dash: str = "") -> str:
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
        f'stroke="{stroke}" stroke-width="{width}"{dash_attr}/>'
    )


def write_svg(name: str, parts: list[str]) -> str:
    parts.append("</svg>")
    (CHARTS / name).write_text("".join(parts), encoding="utf-8")
    return name


def chart_track_summary(rows: list[dict]) -> str:
    width, height = 680, 370
    parts = svg_open(width, height)
    parts.append(text(18, 32, "Four tracks, two different stories", 17, INK, 700))
    parts.append(text(18, 52, "Simple unweighted averages across the roles in each track.", 9, MUTED))
    groups = []
    for track in TRACK_ORDER:
        group = [row for row in rows if row["track"] == track]
        groups.append(
            {
                "track": track,
                "count": len(group),
                "pay": statistics.mean(row["median"] for row in group),
                "score": statistics.mean(row["soft"] for row in group),
            }
        )

    panel_y = 82
    parts.append(text(18, panel_y, "Average median pay", 10, MUTED, 700))
    parts.append(text(367, panel_y, "Average Soft Life Score", 10, MUTED, 700))
    max_pay = 120000
    for index, group in enumerate(groups):
        y = panel_y + 30 + index * 58
        color = TRACK_COLORS[group["track"]]
        parts.append(text(18, y + 12, group["track"], 9, INK, 600))
        parts.append(text(18, y + 26, f"{group['count']} roles", 8, MUTED))
        parts.append(rect(18, y + 32, 278, 9, LINE, 4))
        parts.append(rect(18, y + 32, 278 * group["pay"] / max_pay, 9, color, 4))
        parts.append(text(302, y + 40, compact_money(group["pay"]), 9, INK, 700, "end"))

        parts.append(text(367, y + 12, group["track"], 9, INK, 600))
        parts.append(text(367, y + 26, f"{group['count']} roles", 8, MUTED))
        parts.append(rect(367, y + 32, 278, 9, LINE, 4))
        parts.append(rect(367, y + 32, 278 * group["score"] / 100, 9, color, 4))
        parts.append(text(651, y + 40, f"{group['score']:.1f}", 9, INK, 700, "end"))

    parts.append(text(18, 350, "Pay is a simple mean of BLS May 2025 medians. Score uses the guide's published weights.", 7.5, MUTED))
    return write_svg("track-summary.svg", parts)


def short_label(value: str) -> str:
    replacements = {
        "Exercise Trainer / Group Fitness Instructor": "Exercise Trainer",
        "Web & Digital Interface Designer": "Web & UI Designer",
        "Training & Development Specialist": "Training & Development Spec.",
        "Executive Assistant": "Executive Assistant",
        "Information Security Analyst": "Information Security Analyst",
    }
    return replacements.get(value, value)[:38]


def chart_score_ranking(rows: list[dict]) -> str:
    width = 680
    row_height = 25
    top = 78
    height = top + len(rows) * row_height + 32
    parts = svg_open(width, height)
    parts.append(text(18, 31, "The Soft Life Score, ranked", 17, INK, 700))
    parts.append(text(18, 51, "Pay 30% · Schedule 25% · Energy 20% · Entry 10% · Demand 15%", 9, MUTED))

    label_x = 18
    bar_x = 248
    bar_max = 330
    for score in (0, 25, 50, 75, 100):
        x = bar_x + bar_max * score / 100
        parts.append(line(x, top - 6, x, top + len(rows) * row_height - 2, LINE, 0.6))
        parts.append(text(x, height - 10, str(score), 7.5, MUTED, 400, "middle"))

    for index, row in enumerate(rows):
        y = top + index * row_height
        color = TRACK_COLORS[row["track"]]
        parts.append(text(label_x, y + 13, short_label(row["display_name"]), 8.3, INK, 500))
        parts.append(rect(bar_x, y, bar_max, 14, LINE, 3, 0.55))
        parts.append(rect(bar_x, y, bar_max * row["soft"] / 100, 14, color, 3))
        parts.append(text(bar_x + bar_max * row["soft"] / 100 + 5, y + 10.5, f"{row['soft']:.0f}", 8, INK, 700))
        parts.append(text(660, y + 10.5, compact_money(row["median"]), 7.5, MUTED, 400, "end"))

    return write_svg("score-ranking.svg", parts)


def chart_salary_ranges(rows: list[dict]) -> str:
    ordered = sorted(rows, key=lambda item: item["median"], reverse=True)
    width = 680
    row_height = 25
    top = 82
    height = top + len(ordered) * row_height + 36
    left, right = 210, 28
    plot_w = width - left - right
    x_min, x_max = 0, 220000

    def px(value: float) -> float:
        return left + (value - x_min) / (x_max - x_min) * plot_w

    parts = svg_open(width, height)
    parts.append(text(18, 30, "The full pay range, not just the median", 17, INK, 700))
    parts.append(text(18, 49, "Thin line = 10th–90th percentile. Thick line = middle half. Dot = median.", 9, MUTED))

    for tick in (0, 50000, 100000, 150000, 200000):
        parts.append(line(px(tick), top - 6, px(tick), top + len(ordered) * row_height - 2, LINE, 0.6))
        parts.append(text(px(tick), height - 10, compact_money(tick), 7.5, MUTED, 400, "middle"))

    for index, row in enumerate(ordered):
        y = top + index * row_height
        color = TRACK_COLORS[row["track"]]
        parts.append(text(18, y + 11, short_label(row["display_name"])[:34], 8, INK, 500))
        parts.append(line(px(row["p10"]), y + 8, px(row["p90"]), y + 8, color, 1.4))
        parts.append(line(px(row["p25"]), y + 8, px(row["p75"]), y + 8, color, 5))
        parts.append(f'<circle cx="{px(row["median"]):.1f}" cy="{y + 8:.1f}" r="3.4" fill="{PAPER}" stroke="{color}" stroke-width="1.8"/>')
        label_x = px(row["median"]) + 7
        anchor = "start"
        if label_x > width - right - 26:
            label_x = px(row["median"]) - 7
            anchor = "end"
        parts.append(text(label_x, y + 11, compact_money(row["median"]), 7, INK, 700, anchor))

    return write_svg("salary-ranges.svg", parts)


def chart_pay_schedule(rows: list[dict]) -> str:
    width, height = 680, 525
    left, right, top, bottom = 62, 24, 64, 58
    plot_w = width - left - right
    plot_h = height - top - bottom
    x_min, x_max = 40000, 150000
    y_min, y_max = 2.0, 5.0

    def px(value: float) -> float:
        return left + (value - x_min) / (x_max - x_min) * plot_w

    def py(value: float) -> float:
        return top + (y_max - value) / (y_max - y_min) * plot_h

    parts = svg_open(width, height)
    parts.append(text(18, 30, "Pay versus schedule control", 17, INK, 700))
    parts.append(text(18, 49, "The top-right quadrant is the dream. Most roles sit in the middle.", 9, MUTED))

    for tick in (40000, 60000, 80000, 100000, 120000, 140000):
        parts.append(line(px(tick), top, px(tick), height - bottom, LINE, 0.6))
        parts.append(text(px(tick), height - bottom + 16, f"${tick / 1000:.0f}k", 8, MUTED, 400, "middle"))
    for tick in (2, 3, 4, 5):
        parts.append(line(left, py(tick), width - right, py(tick), LINE, 0.6))
        parts.append(text(left - 8, py(tick) + 3, str(tick), 8, MUTED, 400, "end"))

    x_mid, y_mid = 80000, 4.0
    parts.append(line(px(x_mid), top, px(x_mid), height - bottom, GOLD, 1.2, "5 4"))
    parts.append(line(left, py(y_mid), width - right, py(y_mid), GOLD, 1.2, "5 4"))
    parts.append(text(px(42500), py(4.82), "Soft but not rich", 8, MUTED, 600))
    parts.append(text(px(112000), py(4.82), "The dream", 8, MUTED, 600))
    parts.append(text(px(42500), py(2.12), "Rebuild", 8, MUTED, 600))
    parts.append(text(px(107000), py(2.12), "Golden handcuffs", 8, MUTED, 600))

    ranked = sorted(rows, key=lambda item: item["soft"], reverse=True)
    ranks = {row["slug"]: index + 1 for index, row in enumerate(ranked)}
    points = []
    for row in rows:
        points.append(
            {
                "row": row,
                "x": px(row["median"]),
                "y": py(float(row["schedule_control"])),
                "rank": ranks[row["slug"]],
                "jy": py(float(row["schedule_control"])),
            }
        )

    groups: dict[float, list[dict]] = {}
    for point in points:
        groups.setdefault(float(point["row"]["schedule_control"]), []).append(point)
    occupied: list[tuple[float, float]] = []
    for group in groups.values():
        group.sort(key=lambda item: item["x"])
        for point in group:
            placed = False
            for offset in (0, -14, 14, -28, 28, -42, 42):
                candidate = point["y"] + offset
                if candidate < top + 12 or candidate > height - bottom - 12:
                    continue
                if all(abs(point["x"] - other[0]) > 16 or abs(candidate - other[1]) > 16 for other in occupied):
                    point["jy"] = candidate
                    occupied.append((point["x"], candidate))
                    placed = True
                    break
            if not placed:
                occupied.append((point["x"], point["y"]))

    for point in sorted(points, key=lambda item: item["rank"], reverse=True):
        row = point["row"]
        color = TRACK_COLORS[row["track"]]
        x = point["x"]
        y = point["y"]
        jy = point["jy"]
        if abs(jy - y) > 1:
            parts.append(line(x, y, x, jy, color, 0.7))
            parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.5" fill="{color}" opacity="0.8"/>')
        parts.append(f'<circle cx="{x:.1f}" cy="{jy:.1f}" r="10" fill="{color}" opacity="0.92"/>')
        parts.append(text(x, jy + 3.2, point["rank"], 7.2, "#ffffff", 700, "middle"))

    parts.append(text(left, height - 12, "Median annual pay, BLS May 2025 →  Points are nudged vertically only to separate overlaps.", 8, MUTED))
    parts.append(f'<text x="12" y="{top + plot_h / 2:.1f}" font-family="Open Sans, sans-serif" font-size="8" fill="{MUTED}" transform="rotate(-90 12 {top + plot_h / 2:.1f})" text-anchor="middle">Schedule control score (1–5)</text>')
    return write_svg("pay-schedule.svg", parts)


def chart_claims(rows: list[dict]) -> str:
    lookup = {row["slug"]: row for row in rows}
    selected = [claim for claim in CLAIMS if claim.get("chart")]
    width, height = 680, 96 + len(selected) * 52 + 40
    left, right = 200, 28
    top = 92
    x_min, x_max = 0, 220000
    plot_w = width - left - right

    def px(value: float) -> float:
        return left + (value - x_min) / (x_max - x_min) * plot_w

    parts = svg_open(width, height)
    parts.append(text(18, 30, "Viral salary claims vs. BLS data", 17, INK, 700))
    parts.append(text(18, 49, "Gold is the claim. Purple is the BLS 10th–90th percentile. The dot is the median.", 9, MUTED))

    for tick in (0, 50000, 100000, 150000, 200000):
        parts.append(line(px(tick), top - 6, px(tick), top + len(selected) * 52 - 4, LINE, 0.6))
        parts.append(text(px(tick), height - 12, compact_money(tick), 7.5, MUTED, 400, "middle"))

    pieces = [
        rect(18, 66, 13, 7, GOLD, 2, 0.55),
        text(35, 73, "Source claim", 7.5, MUTED),
        line(104, 69.5, 122, 69.5, PURPLE, 3),
        text(127, 73, "BLS 10th–90th", 7.5, MUTED),
        f'<circle cx="211" cy="69.5" r="4" fill="{PURPLE}"/>',
        text(220, 73, "Median", 7.5, MUTED),
    ]
    parts.extend(pieces)

    for index, claim in enumerate(selected):
        y = top + index * 52
        if claim["slug"]:
            row = lookup[claim["slug"]]
            median, p10, p90 = row["median"], row["p10"], row["p90"]
        else:
            median, p10, p90 = claim["median"], claim["p10"], claim["p90"]
        parts.append(text(18, y + 17, claim["chart_label"], 9, INK, 600))
        parts.append(text(18, y + 31, claim["claim"], 7.8, MUTED))
        parts.append(rect(px(claim["low"]), y + 4, max(2, px(claim["high"]) - px(claim["low"])), 10, GOLD, 3, 0.45))
        parts.append(line(px(p10), y + 25, px(p90), y + 25, PURPLE, 3))
        parts.append(f'<circle cx="{px(median):.1f}" cy="{y + 25:.1f}" r="4.2" fill="{PURPLE}"/>')
        parts.append(text(px(median) + 7, y + 33, compact_money(median), 7.5, INK, 700))

    return write_svg("claims.svg", parts)


def figure(filename: str, caption: str, alt: str) -> str:
    return (
        f'<figure class="chart"><img src="charts/{filename}" alt="{esc(alt)}">'
        f'<figcaption>{caption}</figcaption></figure>'
    )


def key_table(rows: list[dict]) -> str:
    ordered = sorted(rows, key=lambda item: item["soft"], reverse=True)
    half = math.ceil(len(ordered) / 2)
    groups = [ordered[:half], ordered[half:]]
    html_parts = [
        '<table class="key-table"><thead><tr>'
        '<th>#</th><th>Role</th><th>Pay</th><th>Score</th>'
        '<th>#</th><th>Role</th><th>Pay</th><th>Score</th>'
        '</tr></thead><tbody>'
    ]
    for index in range(half):
        html_parts.append("<tr>")
        for group_offset, group in enumerate(groups):
            if index < len(group):
                row = group[index]
                number = index + 1 + group_offset * half
                html_parts.append(
                    f'<td class="key-num">{number}</td>'
                    f'<td>{esc(row["display_name"])}</td>'
                    f'<td class="num">{compact_money(row["median"])}</td>'
                    f'<td class="num">{row["soft"]:.0f}</td>'
                )
            else:
                html_parts.append("<td></td><td></td><td></td><td></td>")
        html_parts.append("</tr>")
    html_parts.append("</tbody></table>")
    return "".join(html_parts)


def score_bar(label: str, value: float) -> str:
    return (
        f'<div class="bar-row"><span class="bar-label">{esc(label)}</span>'
        f'<span class="bar-track"><span class="bar-fill" style="width:{value:.1f}%"></span></span>'
        f'<span class="bar-value">{value:.0f}</span></div>'
    )


def build_profiles(rows: list[dict]) -> str:
    parts = []
    for track in TRACK_ORDER:
        group = sorted([row for row in rows if row["track"] == track], key=lambda item: item["soft"], reverse=True)
        for row in group:
            color = TRACK_COLORS[track]
            parts.append(f'<section class="profile" style="--track:{color}">')
            parts.append(f'<div class="profile-band"><span class="track-dot"></span>{esc(track)}</div>')
            parts.append(f'<h2 id="role-{esc(row["slug"])}">{esc(row["display_name"])}</h2>')
            parts.append(
                f'<p class="role-meta">BLS occupation: {esc(row["bls_title"])} · SOC {esc(row["soc"])}</p>'
            )
            parts.append(
                f'<p class="profile-lede">Median pay of <strong>{money(row["median"])}</strong>, '
                f'projected growth of <strong>{esc(row["growth_pct"])}</strong>, and about '
                f'<strong>{row["openings"]:,}</strong> openings a year. Soft Life Score: '
                f'<strong>{row["soft"]:.0f}/100</strong>.</p>'
            )
            stats = [
                ("Median pay", money(row["median"])),
                ("10th–90th percentile", f'{money(row["p10"])}–{money(row["p90"])}'),
                ("Projected growth", esc(row["growth_pct"])),
                ("Openings per year", f'{row["openings"]:,}'),
                ("Typical education", esc(row["education"])),
                ("Telework group rate", f'{row["telework"]:.1f}%'),
            ]
            parts.append('<table class="stat-grid">')
            for offset in (0, 3):
                parts.append('<tr>')
                for label, value in stats[offset:offset + 3]:
                    parts.append(f'<td><span class="stat-label">{label}</span><span class="stat-value">{value}</span></td>')
                parts.append('</tr>')
            parts.append('</table>')
            parts.append('<div class="two-col">')
            parts.append('<div class="signal-panel"><h3>The soft-life signals</h3>')
            parts.append(score_bar("Income", row["income_score"]))
            parts.append(score_bar("Schedule", row["schedule_score"]))
            parts.append(score_bar("Energy", row["energy_score"]))
            parts.append(score_bar("Entry ease", row["entry_score"]))
            parts.append(score_bar("Demand", row["demand_score"]))
            parts.append(f'<p class="bar-note">{esc(row["fit"])} · {esc(row["barrier"])}</p></div>')
            parts.append('<div class="copy-panel">')
            parts.append(f'<h3>The soft version</h3><p>{esc(row["why_soft"])}</p>')
            parts.append(f'<h3>The catch</h3><p>{esc(row["watchout"])}</p></div>')
            parts.append('</div>')
            parts.append(f'<div class="profile-note"><strong>Best for:</strong> {esc(row["note"]["best_for"])}</div>')
            parts.append(f'<div class="profile-note action"><strong>First move:</strong> {esc(row["note"]["first_move"])}</div>')
            parts.append(
                f'<p class="profile-foot">BLS OEWS May 2025 · SOC {esc(row["soc"])} · '
                f'Projections 2025–35 · Telework is an occupational-group proxy, not a role guarantee.</p>'
            )
            parts.append('</section>')
    return "".join(parts)


def claims_table(rows: list[dict]) -> str:
    lookup = {row["slug"]: row for row in rows}
    parts = [
        '<table class="claims-table"><thead><tr>'
        '<th>Claim in source</th><th>BLS match</th><th>Median</th><th>10th–90th</th><th>Audit</th>'
        '</tr></thead><tbody>'
    ]
    for claim in CLAIMS:
        if claim["slug"]:
            row = lookup[claim["slug"]]
            median, p10, p90 = row["median"], row["p10"], row["p90"]
        else:
            median, p10, p90 = claim["median"], claim["p10"], claim["p90"]
        parts.append(
            f'<tr class="{claim["level"]}">'
            f'<td><strong>{esc(claim["claim"])}</strong></td>'
            f'<td>{esc(claim["match"])}</td>'
            f'<td class="num">{money(median)}</td>'
            f'<td class="num">{money(p10)}–{money(p90)}</td>'
            f'<td>{esc(claim["verdict"])}</td>'
            f'</tr>'
        )
    parts.append("</tbody></table>")
    return "".join(parts)


CSS = """
@page {
  size: A4;
  margin: 19mm 17mm 18mm 17mm;
  @bottom-left {
    content: "The Soft Life Career Compass";
    font-family: "Open Sans", sans-serif;
    font-size: 7.2pt;
    color: #8b7d95;
  }
  @bottom-right {
    content: counter(page);
    font-family: "Open Sans", sans-serif;
    font-size: 8pt;
    color: #8b7d95;
  }
}
@page cover { margin: 0; @bottom-left { content: none; } @bottom-right { content: none; } }
@page title { margin: 0; @bottom-left { content: none; } @bottom-right { content: none; } }
@page toc { @bottom-right { content: none; } }

html { font-family: "Open Sans", sans-serif; color: #241536; }
body { margin: 0; font-size: 10.3pt; line-height: 1.55; }
p { margin: 0 0 8pt; }
strong { font-weight: 700; }
em { font-style: italic; }
a { color: #2a0f4a; text-decoration: none; }
h1, h2, h3 { color: #2a0f4a; page-break-after: avoid; }
h1 { font-size: 25pt; line-height: 1.1; margin: 0 0 16pt; page-break-before: always; }
h1::after { content: ""; display: block; width: 42pt; height: 2.5pt; background: #d9b46a; margin-top: 12pt; }
h2 { font-size: 15pt; line-height: 1.2; margin: 0 0 6pt; }
h3 { font-size: 10.5pt; letter-spacing: 0.02em; text-transform: uppercase; margin: 13pt 0 5pt; }
ul, ol { margin: 0 0 9pt 16pt; padding: 0; }
li { margin-bottom: 4pt; }
blockquote {
  margin: 14pt 0;
  padding: 11pt 14pt;
  background: #f4ede2;
  border-left: 3pt solid #d9b46a;
  font-size: 9.7pt;
}
blockquote p { margin: 0; }
table { border-collapse: collapse; width: 100%; }
.num { text-align: right; white-space: nowrap; }
pre { background: #f4ede2; padding: 10pt 12pt; margin: 10pt 0; border-left: 3pt solid #d9b46a; white-space: pre-wrap; font-size: 8.2pt; line-height: 1.5; }
pre code { font-family: "Open Sans", sans-serif; }
.chapter table:not(.claims-table):not(.key-table):not(.stat-grid) { border-collapse: collapse; page-break-inside: avoid; }
.chapter table:not(.claims-table):not(.key-table):not(.stat-grid) th,
.chapter table:not(.claims-table):not(.key-table):not(.stat-grid) td { border: 0.4pt solid #e3d9ca; padding: 4pt 5pt; vertical-align: top; }
.chapter table:not(.claims-table):not(.key-table):not(.stat-grid) th { background: #f4ede2; text-align: left; font-size: 8.5pt; }
.chapter table tr { page-break-inside: avoid; }

.cover-image { page: cover; width: 210mm; height: 297mm; overflow: hidden; }
.cover-image img { width: 210mm; height: 297mm; object-fit: cover; }
.cover {
  page: cover;
  height: 297mm;
  background: #2a0f4a;
  color: #fbf8f2;
  position: relative;
  overflow: hidden;
}
.cover .rule { position: absolute; left: 20mm; right: 20mm; top: 20mm; height: 0.7pt; background: #d9b46a; opacity: 0.7; }
.cover .brand { position: absolute; left: 20mm; top: 27mm; font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: #d9b46a; }
.cover .main { position: absolute; left: 20mm; right: 20mm; top: 98mm; }
.cover .kicker { font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #d9b46a; margin-bottom: 12mm; }
.cover h1 { font-size: 47pt; line-height: 1.02; color: #fbf8f2; margin: 0; page-break-before: avoid; bookmark-level: none; }
.cover h1::after { display: none; }
.cover .subtitle { font-size: 14pt; line-height: 1.4; color: #e9dfef; margin-top: 12mm; max-width: 130mm; }
.cover .bottom { position: absolute; left: 20mm; right: 20mm; bottom: 20mm; border-top: 0.7pt solid rgba(217,180,106,0.55); padding-top: 6mm; font-size: 7.7pt; letter-spacing: 0.04em; color: #d8cbe0; }
.cover .bottom span { margin-right: 8mm; }
.cover .mark { position: absolute; right: 20mm; top: 95mm; width: 36mm; height: 36mm; opacity: 0.9; }

.title-page { page: title; height: 297mm; background: #fbf8f2; position: relative; }
.title-page .inner { position: absolute; left: 24mm; right: 24mm; top: 38mm; }
.title-page .eyebrow { font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #b85c72; }
.title-page h1 { font-size: 34pt; line-height: 1.06; color: #2a0f4a; margin: 8mm 0 6mm; page-break-before: avoid; bookmark-level: none; }
.title-page h1::after { display: none; }
.title-page .subtitle { font-size: 14pt; line-height: 1.35; color: #4d3b5f; max-width: 125mm; }
.title-page .edition { margin-top: 16mm; font-size: 9pt; color: #7a6c86; }
.title-page .data-note { margin-top: 3mm; font-size: 8pt; color: #7a6c86; }
.title-page .legal { position: absolute; left: 24mm; right: 24mm; bottom: 24mm; border-top: 0.7pt solid #e3d9ca; padding-top: 6mm; font-size: 7.6pt; line-height: 1.45; color: #7a6c86; }

.toc-page { page: toc; page-break-before: always; }
.toc-page h1 { page-break-before: avoid; font-size: 23pt; }
.toc { margin-top: 10pt; }
.toc a { display: block; color: #241536; font-size: 10.5pt; padding: 5.2pt 0; border-bottom: 0.4pt solid #e8dfd2; }
.toc a::after { content: target-counter(attr(href), page); float: right; color: #2a0f4a; font-weight: 700; }
.toc-note { margin-top: 16pt; font-size: 8.5pt; color: #7a6c86; }

.chapter { page-break-before: always; }
.page-break { page-break-before: always; }
.chapter h1 { page-break-before: avoid; }
.chapter h2 { margin-top: 15pt; }
.chapter h3 { margin-top: 13pt; }
.chart { margin: 14pt 0 16pt; page-break-inside: avoid; }
.chart img { width: 100%; height: auto; display: block; border: 0.5pt solid #e8dfd2; }
.chart figcaption { font-size: 7.8pt; line-height: 1.4; color: #7a6c86; margin-top: 4pt; }
.key-table { font-size: 7.3pt; line-height: 1.35; margin: -8pt 0 15pt; }
.key-table th { text-align: left; color: #7a6c86; font-size: 6.5pt; letter-spacing: 0.06em; text-transform: uppercase; padding: 0 3pt 2pt 0; border-bottom: 0.5pt solid #d9b46a; }
.key-table td { padding: 1.2pt 3pt 1.2pt 0; border-bottom: 0.3pt solid #eee6db; }
.key-table .key-num { color: #b85c72; font-weight: 700; width: 10pt; }
.key-table td:nth-child(2), .key-table th:nth-child(2) { width: 30%; }
.key-table td:nth-child(4), .key-table th:nth-child(4) { width: 8%; }
.key-table td:nth-child(4) { border-right: 0.6pt solid #e3d9ca; padding-right: 8pt; }
.key-table th:nth-child(4) { border-right: 0.6pt solid #e3d9ca; padding-right: 8pt; }
.key-table td:nth-child(5), .key-table th:nth-child(5) { padding-left: 8pt; }

.profile { page-break-before: always; }
.profile h2 { border-bottom: 0.8pt solid var(--track); padding-bottom: 5pt; margin-bottom: 6pt; }
.profile-band { font-size: 7.4pt; letter-spacing: 0.13em; text-transform: uppercase; color: var(--track); font-weight: 700; margin-bottom: 8pt; }
.track-dot { display: inline-block; width: 6pt; height: 6pt; background: var(--track); border-radius: 50%; margin-right: 5pt; }
.role-meta { font-size: 8.2pt; color: #7a6c86; margin-bottom: 10pt; }
.profile-lede { font-size: 11.2pt; line-height: 1.5; color: #3b294f; }
.stat-grid { margin: 10pt 0 8pt; table-layout: fixed; }
.stat-grid td { background: #f4ede2; padding: 6pt 7pt; vertical-align: top; border: 3pt solid #fbf8f2; }
.stat-label { display: block; font-size: 6.8pt; letter-spacing: 0.08em; text-transform: uppercase; color: #7a6c86; margin-bottom: 2pt; }
.stat-value { display: block; font-size: 9.4pt; font-weight: 700; color: #2a0f4a; line-height: 1.25; }
.two-col { display: table; width: 100%; table-layout: fixed; margin-top: 8pt; }
.two-col > div { display: table-cell; vertical-align: top; }
.signal-panel { width: 45%; padding-right: 12pt; }
.copy-panel { width: 55%; padding-left: 12pt; border-left: 0.5pt solid #e3d9ca; }
.copy-panel p { font-size: 9.6pt; }
.bar-row { display: table; width: 100%; margin-bottom: 4.5pt; font-size: 7.6pt; }
.bar-label { display: table-cell; width: 45pt; color: #5f4f70; }
.bar-track { display: table-cell; background: #e8dfd2; height: 6pt; border-radius: 3pt; overflow: hidden; }
.bar-fill { display: block; height: 6pt; background: var(--track); border-radius: 3pt; }
.bar-value { display: table-cell; width: 20pt; text-align: right; font-weight: 700; color: #2a0f4a; }
.bar-note { font-size: 7.4pt; color: #7a6c86; margin-top: 4pt; }
.profile-note { background: #f4ede2; padding: 7pt 9pt; margin-top: 7pt; font-size: 8.6pt; line-height: 1.45; }
.profile-note.action { background: #eef3ed; }
.profile-foot { font-size: 6.7pt; line-height: 1.4; color: #8b7d95; margin-top: 7pt; border-top: 0.4pt solid #e3d9ca; padding-top: 4pt; }

.claims-table { font-size: 7.5pt; line-height: 1.35; margin: 12pt 0 16pt; }
.claims-table th { background: #2a0f4a; color: #fbf8f2; text-align: left; padding: 5pt 4pt; font-size: 7pt; letter-spacing: 0.03em; }
.claims-table td { padding: 5pt 4pt; border-bottom: 0.4pt solid #e3d9ca; vertical-align: top; }
.claims-table tr.good td:last-child { color: #466b51; }
.claims-table tr.warn td:last-child { color: #8a6220; }
.claims-table tr.bad td:last-child { color: #9a3e52; }

.worksheet { background: #f4ede2; padding: 9pt 11pt; margin: 10pt 0; }
.worksheet h3 { margin-top: 0; }
.blank { display: inline-block; border-bottom: 0.6pt solid #8b7d95; min-width: 190pt; height: 12pt; }
"""


def render_markdown(value: str) -> str:
    return markdown.markdown(
        value,
        extensions=["toc", "tables", "sane_lists", "fenced_code"],
        extension_configs={"toc": {"permalink": False}},
    )


def main() -> None:
    DIST.mkdir(parents=True, exist_ok=True)
    CHARTS.mkdir(parents=True, exist_ok=True)
    rows = load_rows()

    track_chart = chart_track_summary(rows)
    ranking_chart = chart_score_ranking(rows)
    scatter_chart = chart_pay_schedule(rows)
    ranges_chart = chart_salary_ranges(rows)
    claims_chart = chart_claims(rows)

    replacements = {
        "{{CHART_TRACK_SUMMARY}}": figure(
            track_chart,
            "Average median pay and average Soft Life Score by track. Averages are simple means across the roles in this guide, not market averages.",
            "Bar chart comparing average pay and average Soft Life Score across four career tracks.",
        ),
        "{{CHART_SCORE_RANKING}}": figure(
            ranking_chart,
            "The 24 roles ranked by the Soft Life Score. Colour indicates track; the dollar figure on the right is the BLS median.",
            "Horizontal bar chart ranking 24 careers by Soft Life Score.",
        ),
        "{{CHART_PAY_SCHEDULE}}": figure(
            scatter_chart,
            "Median pay against editorial schedule control. Numbers match the key below. The quadrants are a reading aid, not a rule.",
            "Scatter plot of median pay versus schedule control, with numbered role markers.",
        ) + key_table(rows),
        "{{CHART_SALARY_RANGES}}": figure(
            ranges_chart,
            "Median pay and the 10th–90th percentile range for all 24 roles, sorted by median. A wide line means the occupation has a wide spread; it does not mean any individual can move from one end to the other.",
            "Range chart showing median pay and 10th–90th percentile pay for all 24 careers.",
        ),
        "{{PROFILES}}": build_profiles(rows),
        "{{CHART_CLAIMS}}": figure(
            claims_chart,
            "Source-research salary ranges against BLS 10th–90th percentile ranges. The source range is not always for the exact BLS occupation; see the audit table.",
            "Range chart comparing viral salary claims with BLS percentiles.",
        ),
        "{{CLAIMS_TABLE}}": claims_table(rows),
    }

    chapter_files = sorted(MANUSCRIPT.glob("*.md"))
    chapter_html = []
    toc_entries = []
    for path in chapter_files:
        rendered = render_markdown(path.read_text(encoding="utf-8"))
        for placeholder, replacement in replacements.items():
            rendered = rendered.replace(placeholder, replacement)
        chapter_html.append(f'<section class="chapter">{rendered}</section>')
        for match in re.finditer(r'<h1 id="([^"]+)">(.*?)</h1>', rendered):
            toc_entries.append((match.group(1), re.sub(r"<[^>]+>", "", match.group(2))))

    toc = "".join(f'<a href="#{esc(anchor)}">{esc(title)}</a>' for anchor, title in toc_entries)

    cover_asset = next(
        (path for path in (BASE / "assets" / "cover.png", BASE / "assets" / "cover.jpg", BASE / "assets" / "cover.jpeg") if path.exists()),
        None,
    )
    if cover_asset:
        cover = (
            '<section class="cover-image">'
            f'<img src="../assets/{esc(cover_asset.name)}" alt="The Soft Life Career Compass cover">'
            "</section>"
        )
    else:
        cover = """
    <section class="cover">
      <div class="rule"></div>
      <div class="brand">Soft Life by Gabochie</div>
      <svg class="mark" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#d9b46a" stroke-width="1"/>
        <circle cx="60" cy="60" r="38" fill="none" stroke="#d9b46a" stroke-width="0.6" opacity="0.7"/>
        <path d="M60 16 L69 51 L104 60 L69 69 L60 104 L51 69 L16 60 L51 51 Z" fill="#d9b46a" opacity="0.16"/>
        <path d="M60 31 L67 53 L89 60 L67 67 L60 89 L53 67 L31 60 L53 53 Z" fill="#d9b46a" opacity="0.55"/>
      </svg>
      <div class="main">
        <div class="kicker">A data-backed career design kit</div>
        <h1>The Soft Life<br>Career Compass</h1>
        <p class="subtitle">Choose calmer, better-paid work without gambling your whole life on a salary list.</p>
      </div>
      <div class="bottom"><span>24 verified careers</span><span>5 decision signals</span><span>90-day plan</span></div>
    </section>
    """

    title_page = """
    <section class="title-page">
      <div class="inner">
        <div class="eyebrow">Soft Life by Gabochie</div>
        <h1>The Soft Life<br>Career Compass</h1>
        <p class="subtitle">A data-backed guide to choosing calmer, better-paid work.</p>
        <p class="edition">Edition 1 · 2026</p>
        <p class="data-note">Data current to BLS OEWS May 2025 and BLS Employment Projections 2025–35.</p>
      </div>
      <div class="legal">
        <strong>Copyright © 2026 Soft Life by Gabochie.</strong> All rights reserved. This guide is for
        general information and career planning. It is not financial, legal, immigration, tax, or
        professional advice. Pay figures are national medians, not promises of a specific salary.
        Projections can be wrong. The Soft Life Score is an editorial composite, not a government
        statistic. No part of this guide may be reproduced or resold without permission.
        <br><br>Support: admin@gabochie.com · soft.gabochie.com
      </div>
    </section>
    """

    toc_page = f"""
    <section class="toc-page">
      <h1>Contents</h1>
      <div class="toc">{toc}</div>
      <p class="toc-note">Page numbers are linked in the PDF. The profile key on the pay–schedule chart
      follows the ranking shown in Chapter 3.</p>
    </section>
    """

    document = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Soft Life Career Compass</title>
<meta name="author" content="Soft Life by Gabochie">
<meta name="description" content="A data-backed career design kit with 24 verified careers, five decision signals, and a 90-day transition plan.">
<style>{CSS}</style>
</head>
<body>
{cover}
{title_page}
{toc_page}
{''.join(chapter_html)}
</body>
</html>
"""

    html_path = DIST / "manuscript.html"
    html_path.write_text(document, encoding="utf-8")
    pdf_path = DIST / "the-soft-life-career-compass.pdf"
    HTML(string=document, base_url=str(DIST)).write_pdf(pdf_path)
    print(f"Wrote {pdf_path}")
    print(f"Wrote {html_path}")
    print(f"Wrote {len(list(CHARTS.glob('*.svg')))} charts")


if __name__ == "__main__":
    main()
