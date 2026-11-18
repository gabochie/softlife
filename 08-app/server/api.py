#!/usr/bin/env python3
"""Soft Life app — local dev API + static server.

Serves the PWA from ../app at / and a JSON API under /api/* backed by SQLite.
Production target: the same routes move to Supabase (auth, Postgres, edge
functions) — the frontend only talks to the adapter in js/api.js.

Run:   python3 server/api.py [port]     (default 8100, from 08-app/)
Seed:  demo account demo@softlife.app / demo1234 + the 16-step launch checklist
"""
import base64
import hashlib
import hmac
import html as _html_mod
import json
import os
import re
import secrets
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
DB = APP / "server" / "softlife.db"
STATIC = APP / "app"
AUDIO_DIR = APP / "server" / "audio"
SEED_EMAIL = "demo@softlife.app"
SEED_PASSWORD = "demo1234"
# Free members hear the full free trial: intro + Chapter 1.
FREE_AUDIO = {"intro", "ch01"}
AUDIO_SLUGS = ["intro"] + [f"ch{i:02d}" for i in range(1, 16)]

CONSENT_VERSION = "2026-11-14"
SESSION_DAYS = 30
AUDIO_TOKEN_MINUTES = 120
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin1234")
ADMIN_SESSION_HOURS = max(1, min(72, int(os.environ.get("ADMIN_SESSION_HOURS") or 12)))
CRM_STAGES = ["lead", "engaged", "checkout_abandoned", "customer", "client", "lost"]
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", os.environ.get("PURCHASE_WEBHOOK_SECRET", "dev-webhook-secret"))
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER = os.environ.get("BREVO_SENDER", "admin@gabochie.com")
SITE_URL = os.environ.get("SITE_URL", "http://localhost:8100")
STAFF_ROLES = ["superadmin", "sales", "support", "content"]
# Which staff roles may use each admin capability. The superadmin password login
# maps to the "superadmin" role; staff logins carry their own role.
ADMIN_CAPS = {
    "overview": {"superadmin", "sales", "support", "content"},
    "users": {"superadmin", "sales", "support"},
    "set_tier": {"superadmin", "sales", "support"},
    "set_role": {"superadmin"},
    "crm": {"superadmin", "sales", "support"},
    "crm_stage": {"superadmin", "sales"},
    "crm_note": {"superadmin", "sales", "support"},
    "analytics": {"superadmin", "sales", "support", "content"},
    "referrals": {"superadmin", "sales"},
    "purchases": {"superadmin", "sales"},
    "onboarding": {"superadmin", "sales", "support"},
    "audio": {"superadmin", "sales", "support", "content"},
    "team": {"superadmin"},
    "webhooks": {"superadmin", "sales"},
    "security": {"superadmin"},
    "email": {"superadmin", "sales"},
}
ONBOARDING_CHOICES = {
    "business_stage": {"idea", "early", "growing", "established", "other"},
    "main_goal": {"simplify", "offer", "systems", "delegate", "time", "freedom", "other"},
    "biggest_challenge": {"time", "overwhelm", "pricing", "clients", "systems", "focus", "other"},
    "revenue_range": {"pre_revenue", "under_1k", "1k_3k", "3k_10k", "10k_plus", "prefer_not"},
    "team_size": {"solo", "contractors", "small_team", "team"},
}
ACQUISITION_KEYS = ["source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer"]
EVENT_NAMES = {
    "signup", "signin", "onboarding_saved", "onboarding_completed", "onboarding_skipped",
    "whatsapp_consent_granted", "whatsapp_consent_withdrawn",
    "task_added", "task_completed", "audio_play", "audio_complete", "page_view", "checkout_click",
    "password_reset_requested", "password_reset_completed", "password_changed",
}

LAUNCH_TASKS = [
    (1, "Complete the Hustle Hangover Checklist", "Chapter 1 — face where your time actually goes."),
    (1, "Complete the Four Audits", "Chapter 3 — Time, Money, Energy, Joy."),
    (1, "Calculate your Soft Life Scorecard", "Chapter 3 — score all eight dimensions."),
    (1, "Write your one-sentence business", "Chapter 4 — I help [audience] achieve [outcome] through [mechanism]."),
    (1, "Choose one audience, one offer, one outcome", "Chapter 4 — focus beats variety."),
    (2, "Redesign your offer using the Premium Offer Formula", "Chapter 5 — package your genius into premium."),
    (2, "Set your premium price", "Chapter 5 — price the transformation, not the hours."),
    (2, "Map your delivery process", "Chapter 6 — Intake, Onboard, Execute, Handoff, Follow-up."),
    (2, "Create three templates", "Chapter 6 — welcome email, proposal, follow-up."),
    (3, "Build your first automation", "Chapter 7 — scheduling and welcome email."),
    (3, "Document one task and delegate it", "Chapter 7 — the first transfer."),
    (3, "Design your Soft Life Week", "Chapter 8 — the sample 15-hour week, adapted to you."),
    (4, "Set your no-work zones", "Chapter 8 — protect rest like revenue."),
    (4, "Write your Boundary Policy", "Chapter 11 — scripts for scope, availability, requests."),
    (5, "Define your enough", "Chapter 12 — income, clients, hours, rest."),
    (8, "Schedule your monthly Soft Life Review", "Chapter 15 — the maintenance ritual."),
]


# Interactive Soft Life Scorecard — mirrors the PDF lead magnet exactly.
SCORECARD_DIMENSIONS = [
    {"key": "time", "label": "Time", "ten": "You work ≤ 20 hrs/week by design, not by accident.", "action": "Audit your week: eliminate one recurring task, template one, delegate one."},
    {"key": "money", "label": "Money", "ten": "Revenue is predictable; you know your number every month.", "action": "Set your monthly income number and review it every Monday — predictable revenue starts with a number."},
    {"key": "energy", "label": "Energy", "ten": "You finish the day with something left. No 3pm crash.", "action": "Protect one no-work block and one slow morning before you touch your inbox."},
    {"key": "joy", "label": "Joy", "ten": "You'd do your best work even if no one paid you.", "action": "Pick the work you'd do unpaid and make it the centre of your offer."},
    {"key": "relationships", "label": "Relationships", "ten": "Family and friends get your best hours, not your leftovers.", "action": "Block two protected hours this week for family and friends — best hours, not leftovers."},
    {"key": "health", "label": "Health", "ten": "Sleep, movement and food are not negotiable.", "action": "Make sleep, movement and food non-negotiable for seven days."},
    {"key": "focus", "label": "Focus", "ten": "One offer, one audience, one channel. No shiny objects.", "action": "Pick one offer, one audience, one channel. Nothing else gets a yes this month."},
    {"key": "freedom", "label": "Freedom", "ten": "You can take a week off without the business breaking.", "action": "Document the three tasks only you can do, then hand one to someone else for a week."},
]


def scorecard_result(answers: list[int]) -> dict:
    rows = [{**d, "score": answers[i], "order": i} for i, d in enumerate(SCORECARD_DIMENSIONS)]
    total = sum(answers)
    ordered = sorted(rows, key=lambda r: (r["score"], r["order"]))
    bottom, top = ordered[:2], list(reversed(ordered[-2:]))
    if total >= 70:
        band = {"label": "Soft life, protected", "text": "You're already living the soft life. Use this system to protect it — most people lose it the moment they scale."}
    elif total >= 50:
        band = {"label": "The danger zone", "text": "You're in the danger zone. Two or three dimensions are carrying everything and the rest are quietly collapsing. Fix the bottom two first."}
    elif total >= 30:
        band = {"label": "A job, not a business", "text": "You've built a job, not a business. Revenue is real and so is the exhaustion. The architecture needs rebuilding — that's what this system is for."}
    else:
        band = {"label": "The hustle hangover", "text": "You're in the hustle hangover. Stop adding. Start subtracting. Today."}
    return {
        "total": total,
        "band": band,
        "headline": "Your lowest two are %s and %s. They are not separate problems — they are one architecture problem wearing two costumes." % (bottom[0]["label"], bottom[1]["label"]),
        "bottom": [d["key"] for d in bottom],
        "top": [d["key"] for d in top],
        "actions": [bottom[0]["action"], bottom[1]["action"],
                    "Re-score in 30 days. Fix the architecture, don't push harder on the symptoms."],
        "rows": [{"key": d["key"], "label": d["label"], "ten": d["ten"], "score": d["score"]} for d in rows],
        "focusNote": (
            "Nothing else matters until you pick one offer." if bottom[0]["key"] == "focus"
            else "You don't need a planner — you need to eliminate, automate, template and delegate."
            if bottom[0]["key"] == "time"
            else "The fix is upstream — in your offer, your delivery and your week."
        ),
    }


def lead_email_html(link: str, result: dict, name: str, unsub_token: str, origin: str) -> str:
    labels = [d["label"] for d in SCORECARD_DIMENSIONS if d["key"] in result["bottom"]]
    return _email_shell(
        "Your Soft Life Scorecard is ready",
        "<p>%s, you scored your life and business. Here is your personal report.</p>" % _escape_html(name)
        + "<p><b>%d/80 — %s.</b> %s</p>" % (result["total"], _escape_html(result["band"]["label"]), _escape_html(result["band"]["text"]))
        + "<p>Your two lowest dimensions are <b>%s</b>.</p>" % _escape_html(" and ".join(labels))
        + '<p><a href="%s" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;'
          'border-radius:10px;text-decoration:none;font-weight:600;">Open my printable report →</a></p>' % link
        + '<p style="font-size:13px;">Or paste this link into your browser:<br><code>%s</code></p>' % link
        + '<p style="font-size:13px;color:#6d5f7a;">The page has a Print / Save as PDF button. This is your private copy — keep the link.</p>'
        + _unsub_footer(unsub_token, origin),
    )


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def clean_text(value, max_len: int) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:max_len]


def clean_choice(value, allowed: set[str]) -> str:
    value = str(value or "").strip()
    return value if value in allowed else ""


def clean_acquisition(value, fallback_source: str = "direct") -> dict:
    source = value if isinstance(value, dict) else {}
    out = {key: clean_text(source.get(key), 300 if key == "referrer" else 120) for key in ACQUISITION_KEYS}
    if not out["source"]:
        out["source"] = fallback_source
    return out


def normalize_phone(value) -> str:
    digits = re.sub(r"\D", "", str(value or ""))
    return "+" + digits if 7 <= len(digits) <= 15 else ""


def truthy(value) -> bool:
    return value is True or value in (1, "1", "true", "on")


def log_event(conn: sqlite3.Connection, user_id: int, event: str, path: str, meta: dict | None = None) -> None:
    if not user_id or event not in EVENT_NAMES:
        return
    payload = json.dumps(meta or {})
    if len(payload) > 2000:
        payload = json.dumps({"truncated": True})
    conn.execute(
        "INSERT INTO events (user_id, event, path, meta) VALUES (?,?,?,?)",
        (user_id, event, clean_text(path, 200), payload),
    )


def load_onboarding(conn: sqlite3.Connection, user_id: int):
    return conn.execute("SELECT * FROM onboarding WHERE user_id = ?", (user_id,)).fetchone()


def save_onboarding_row(conn: sqlite3.Connection, user_id: int, data: dict, acquisition: dict | None = None):
    existing = load_onboarding(conn, user_id)
    row = {
        "business_name": "", "business_stage": "", "country": "", "timezone": "",
        "main_goal": "", "biggest_challenge": "", "revenue_range": "", "team_size": "",
        "whatsapp_number": "", "whatsapp_consent": 0, "whatsapp_consent_at": None,
        "marketing_consent": 0, "marketing_consent_at": None, "consent_version": "",
        "source": "", "utm_source": "", "utm_medium": "", "utm_campaign": "",
        "utm_content": "", "utm_term": "", "referrer": "", "completed_at": None,
    }
    if existing:
        row.update(dict(existing))
    now = now_iso()
    for key, max_len in {"business_name": 120, "country": 80, "timezone": 64}.items():
        if key in data:
            row[key] = clean_text(data.get(key), max_len)
    for key, allowed in ONBOARDING_CHOICES.items():
        if key in data:
            row[key] = clean_choice(data.get(key), allowed)
    if "whatsapp_consent" in data:
        nxt = 1 if truthy(data.get("whatsapp_consent")) else 0
        if nxt != int(row.get("whatsapp_consent") or 0):
            row["whatsapp_consent_at"] = now
        row["whatsapp_consent"] = nxt
        if not nxt:
            row["whatsapp_number"] = ""
    if "whatsapp_number" in data:
        row["whatsapp_number"] = normalize_phone(data.get("whatsapp_number"))
    if "marketing_consent" in data:
        nxt = 1 if truthy(data.get("marketing_consent")) else 0
        if nxt != int(row.get("marketing_consent") or 0):
            row["marketing_consent_at"] = now
        row["marketing_consent"] = nxt
    if "whatsapp_consent" in data or "marketing_consent" in data:
        row["consent_version"] = CONSENT_VERSION
    if acquisition:
        for key in ACQUISITION_KEYS:
            if not row.get(key) and acquisition.get(key):
                row[key] = acquisition[key]
    if not row.get("source"):
        row["source"] = "direct"
    if row.get("business_stage") and row.get("main_goal") and row.get("biggest_challenge") and not row.get("completed_at"):
        row["completed_at"] = now

    cols = [
        "user_id", "business_name", "business_stage", "country", "timezone", "main_goal",
        "biggest_challenge", "revenue_range", "team_size", "whatsapp_number",
        "whatsapp_consent", "whatsapp_consent_at", "marketing_consent", "marketing_consent_at",
        "consent_version", "source", "utm_source", "utm_medium", "utm_campaign", "utm_content",
        "utm_term", "referrer", "completed_at", "updated_at",
    ]
    values = [user_id] + [row.get(col) for col in cols[1:-1]] + [now]
    placeholders = ",".join("?" for _ in cols)
    updates = ",".join(f"{col}=excluded.{col}" for col in cols[1:])
    conn.execute(
        f"INSERT INTO onboarding ({','.join(cols)}) VALUES ({placeholders}) "
        f"ON CONFLICT(user_id) DO UPDATE SET {updates}",
        values,
    )
    conn.commit()
    return load_onboarding(conn, user_id)


def _migrate_admin_tables(conn: sqlite3.Connection) -> None:
    """Bring older local dev DBs onto the super-admin + purchases schema."""
    user_cols = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
    if "role" not in user_cols:
        conn.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'")
    conn.commit()


def _log_webhook(conn: sqlite3.Connection, status: str, data: dict, order_id: str | None,
                 email: str | None, error: str = "") -> None:
    conn.execute(
        "INSERT INTO webhook_logs (status, order_id, email, payload, error) VALUES (?,?,?,?,?)",
        (status, order_id, email, json.dumps(data)[:4000], error),
    )


def _log_security(conn: sqlite3.Connection, kind: str, email: str = "", ip: str = "", detail: str = "") -> None:
    conn.execute(
        "INSERT INTO security_log (kind, email, ip, detail) VALUES (?,?,?,?)",
        (kind, email[:120], ip[:64], detail[:500]),
    )


def _email_shell(title: str, body_html: str) -> str:
    return (
        '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2a0f4a;">'
        f'<h2 style="color:#5d2189;margin:0 0 12px;">{title}</h2>'
        f'<div style="font-size:15px;line-height:1.6;">{body_html}</div>'
        '<p style="font-size:12px;color:#6d5f7a;margin-top:28px;">The Soft Life System · Gabochie Books<br>'
        "Questions? Just reply to this email.</p>"
        "</div>"
    )


def _claim_email_html(link: str) -> str:
    return _email_shell(
        "Your access is ready 🎉",
        "<p>Your payment went through — welcome to The Soft Life System.</p>"
        "<p>One last step: choose a password and open your system. Your purchase is already "
        "attached to this email, so everything unlocks the moment you land inside.</p>"
        f'<p><a href="{link}" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;'
        'border-radius:10px;text-decoration:none;font-weight:600;">Set my password &amp; start →</a></p>'
        f"<p style=\"font-size:13px;\">Or paste this link into your browser:<br><code>{link}</code></p>"
        "<p style=\"font-size:13px;color:#6d5f7a;\">This link works once and stays valid for 30 days.</p>",
    )


def _purchase_confirmation_html() -> str:
    return _email_shell(
        "Purchase confirmed ✅",
        "<p>Your purchase of the complete system is confirmed and your account has been upgraded.</p>"
        "<p>Sign in and start with the introduction, then work the 90-day plan at your pace.</p>",
    )


def _reset_email_html(link: str) -> str:
    return _email_shell(
        "Password reset 🔑",
        "<p>Someone (hopefully you) asked to reset the password for this email.</p>"
        "<p>Click below to choose a new password. The link works once and expires in 60 minutes.</p>"
        f'<p><a href="{link}" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;'
        'border-radius:10px;text-decoration:none;font-weight:600;">Choose a new password →</a></p>'
        f"<p style=\"font-size:13px;\">Or paste this link into your browser:<br><code>{link}</code></p>"
        "<p style=\"font-size:13px;color:#6d5f7a;\">Not you? Ignore this email — your password stays unchanged.</p>",
    )


def _send_email(conn: sqlite3.Connection, to_email: str, subject: str, html: str, kind: str,
                text: str = "") -> bool:
    """Send via the Brevo API when BREVO_API_KEY is set; always log the attempt.
    Never raises: email failures must not break the webhook."""
    status, error = ("queued_local" if not BREVO_API_KEY else "failed", "")
    if BREVO_API_KEY:
        try:
            payload = {
                "sender": {"email": BREVO_SENDER, "name": "The Soft Life System"},
                "to": [{"email": to_email}],
                "replyTo": {"email": BREVO_SENDER},
                "subject": subject,
                "htmlContent": html,
            }
            if text:
                payload["textContent"] = text
            req = urllib.request.Request(
                "https://api.brevo.com/v3/smtp/email",
                data=json.dumps(payload).encode(),
                headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json", "Accept": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10):
                status = "sent"
        except Exception as exc:  # noqa: BLE001 - email failures must not break the webhook
            status, error = "failed", str(exc)[:300]
    try:
        conn.execute(
            "INSERT INTO email_log (to_email, subject, kind, status, error) VALUES (?,?,?,?,?)",
            (to_email[:120], subject[:200], kind, status, error),
        )
    except sqlite3.Error:
        pass
    return status == "sent"


def _escape_html(value: str) -> str:
    return _html_mod.escape(str(value), quote=False)


def _unsub_footer(token: str, origin: str) -> str:
    return ('<p style="font-size:12px;color:#6d5f7a;">You receive this because you have a Soft Life account. '
            f'<a href="{origin}/api/unsubscribe?token={token}" style="color:#6d5f7a;">Unsubscribe</a></p>')


def _email_shell(title: str, body_html: str) -> str:
    return ('<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2a0f4a;">'
            f'<h2 style="color:#5d2189;margin:0 0 12px;">{_escape_html(title)}</h2>'
            f'<div style="font-size:15px;line-height:1.6;">{body_html}</div>'
            '<p style="font-size:12px;color:#6d5f7a;margin-top:28px;">The Soft Life System · Gabochie Books</p></div>')


def _welcome_email(env_site_url: str, user: sqlite3.Row, day: int) -> dict:
    origin = env_site_url or "http://127.0.0.1:8100"
    first = (user["name"] or "friend").split(" ")[0]
    if day == 1:
        return {
            "subject": f"{first}, your first chapter is waiting",
            "html": _email_shell("Day 1 — start the 90 days",
                '<p>You created your Soft Life account yesterday — and the first chapter is the most important one.</p>'
                + '<p><b>Start with the Hustle Hangover Checklist</b> in your dashboard. It takes 10 minutes and it will show you exactly where your time actually goes.</p>'
                + f'<p>Log in any time: <a href="{origin}/#/dashboard">{origin}/#/dashboard</a></p>'
                + '<p style="font-style:italic;">The soft life isn\'t a luxury. It\'s a design — and you\'ve started.</p>')
            + _unsub_footer(user["unsub_token"], origin),
            "text": "Day 1 - start the 90 days. Your first task: the Hustle Hangover Checklist (10 minutes). Log in: " + origin + "/#/dashboard",
        }
    return {
        "subject": "Two days in — the Four Audits",
        "html": _email_shell("Day 3 — see your real picture",
            '<p>By now the hustle hangover should look familiar. The next step is the <b>Four Audits</b>: Time, Money, Energy, Joy.</p>'
            + '<p>Score all eight dimensions of your life with the Soft Life Scorecard in your dashboard. Most people find two or three dimensions are carrying everything — that\'s the architecture problem this system fixes.</p>'
            + f'<p><a href="{origin}/#/tasks">Open your tasks</a></p>')
        + _unsub_footer(user["unsub_token"], origin),
        "text": "Day 3 - complete the Four Audits (Time, Money, Energy, Joy) and score your Soft Life Scorecard.",
    }


def _upsell_email(env_site_url: str, env_selar_url: str, user: sqlite3.Row) -> dict:
    origin = env_site_url or "http://127.0.0.1:8100"
    checkout = env_selar_url or os.environ.get("CHECKOUT_URL") or ""
    first = (user["name"] or "friend").split(" ")[0]
    return {
        "subject": f"{first}, chapters 2-15 are waiting",
        "html": _email_shell("You've seen the free chapters. Here's the rest.",
            '<p>The intro and Chapter 1 show you the problem. <b>Chapters 2–15 build the actual system:</b> the SOFT Method, the One-Offer Principle, the Delivery Machine, the 15-Hour Week Blueprint and the full 90-Day Launch Plan.</p>'
            + '<p>Everything is in the app — the complete eBook, all 15 chapters as audio, and every worksheet. One purchase, no subscription.</p>'
            + (f'<p><a href="{checkout}">Get the Complete bundle</a></p>' if checkout else '')
            + '<p style="font-size:12px;color:#6d5f7a;">Founding price stays open while the first cohort is in.</p>')
        + _unsub_footer(user["unsub_token"], origin),
        "text": "Chapters 2-15 are waiting: the SOFT Method, the One-Offer Principle, the 15-Hour Week Blueprint and the 90-Day Launch Plan. One purchase, no subscription." + (f" Get it: {checkout}" if checkout else ""),
    }


def _winback_email(env_site_url: str, user: sqlite3.Row) -> dict:
    origin = env_site_url or "http://127.0.0.1:8100"
    first = (user["name"] or "friend").split(" ")[0]
    return {
        "subject": f"{first}, your system has been waiting",
        "html": _email_shell("It's been a couple of weeks",
            '<p>Your dashboard keeps everything where you left it — your tasks, your scorecard, your audio.</p>'
            + '<p>Pick the one task you can finish in 10 minutes today. Momentum beats motivation.</p>'
            + f'<p><a href="{origin}/#/dashboard">Back to your dashboard</a></p>')
        + _unsub_footer(user["unsub_token"], origin),
        "text": "It's been a couple of weeks. Your dashboard keeps everything where you left it. Pick one 10-minute task today: " + origin + "/#/dashboard",
    }


def _send_sequence(conn: sqlite3.Connection, origin: str, kind: str, limit: int, query: str, build) -> dict:
    rows = conn.execute(query + " LIMIT ?", (limit,)).fetchall()
    sent = 0
    for user in rows:
        if not user["email"]:
            continue
        token = user["unsub_token"]
        if not token:
            token = secrets.token_hex(16)
            conn.execute("UPDATE users SET unsub_token = ? WHERE id = ?", (token, user["id"]))
        built = build(user)
        if _send_email(conn, user["email"], built["subject"], built["html"], kind, built["text"]):
            sent += 1
    return {"candidates": len(rows), "sent": sent}


def _run_email_sequences(conn: sqlite3.Connection, origin: str = "") -> dict:
    site = SITE_URL or origin
    selar = os.environ.get("SELAR_CHECKOUT_URL", "") or os.environ.get("CHECKOUT_URL", "")
    out = {}
    out["welcome_d1"] = _send_sequence(conn, site, "welcome_d1", 50,
        ("SELECT id, email, name, unsub_token FROM users"
         " WHERE tier = 'free' AND marketing_consent = 1"
         " AND created_at >= datetime('now', '-2 days') AND created_at <= datetime('now', '-1 day')"
         " AND NOT EXISTS (SELECT 1 FROM email_log l WHERE l.to_email = users.email AND l.kind = 'welcome_d1')"),
        lambda u: _welcome_email(site, u, 1))
    out["welcome_d3"] = _send_sequence(conn, site, "welcome_d3", 50,
        ("SELECT id, email, name, unsub_token FROM users"
         " WHERE tier = 'free' AND marketing_consent = 1"
         " AND created_at >= datetime('now', '-4 days') AND created_at <= datetime('now', '-3 days')"
         " AND NOT EXISTS (SELECT 1 FROM email_log l WHERE l.to_email = users.email AND l.kind = 'welcome_d3')"),
        lambda u: _welcome_email(site, u, 3))
    out["upsell"] = _send_sequence(conn, site, "upsell", 50,
        ("SELECT id, email, name, unsub_token FROM users"
         " WHERE tier = 'free' AND marketing_consent = 1"
         " AND created_at <= datetime('now', '-5 days')"
         " AND NOT EXISTS (SELECT 1 FROM purchases p WHERE lower(p.email) = lower(users.email))"
         " AND NOT EXISTS (SELECT 1 FROM email_log l WHERE l.to_email = users.email AND l.kind = 'upsell')"),
        lambda u: _upsell_email(site, selar, u))
    out["winback"] = _send_sequence(conn, site, "winback", 50,
        ("SELECT id, email, name, unsub_token FROM users"
         " WHERE marketing_consent = 1 AND created_at <= datetime('now', '-14 days')"
         " AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.user_id = users.id AND s.created_at >= datetime('now', '-14 days'))"
         " AND NOT EXISTS (SELECT 1 FROM email_log l WHERE l.to_email = users.email AND l.kind = 'winback' AND l.created_at >= datetime('now', '-30 days'))"),
        lambda u: _winback_email(site, u))
    return out


def _log_track(conn: sqlite3.Connection, event: str, path: str, meta: dict) -> None:
    """Anonymous public analytics (no member account required)."""
    payload = json.dumps(meta)[:2000]
    conn.execute(
        "INSERT INTO events (user_id, event, path, meta) VALUES (NULL, ?, ?, ?)",
        (event, clean_text(path, 200), payload),
    )


_TRACK_WINDOW = 60          # seconds per rate-limit window
_TRACK_MAX = 60             # max track requests per window per client
_track_hits: dict[str, int] = {}


def _track_allow(ip: str) -> bool:
    window = int(time.time() // _TRACK_WINDOW)
    key = f"{window}:{ip}"
    hits = _track_hits.get(key, 0) + 1
    _track_hits[key] = hits
    if len(_track_hits) > 500:  # keep the in-memory map bounded
        for old in [k for k in _track_hits if not k.startswith(f"{window}:")]:
            _track_hits.pop(old, None)
    return hits <= _TRACK_MAX


try:  # blog post metadata for content analytics (slug -> title)
    sys.path.insert(0, str(APP / "tools"))
    from build_blog import POSTS as BLOG_POSTS  # noqa: E402
except Exception:
    BLOG_POSTS = []


def _mainstack_normalize(data: dict) -> dict:
    """Extract a purchase from a Mainstack webhook payload.

    Mainstack publishes no payload spec, so read the usual field names across
    the top level and a data/payload wrapper."""
    def at(path: str):
        v = data
        for key in path.split("."):
            if not isinstance(v, dict) or key not in v:
                return None
            v = v[key]
        return v

    def first(*vals):
        for v in vals:
            s = "" if v is None else str(v)
            if s.strip():
                return s.strip()
        return ""

    wrapper = data.get("data") if isinstance(data.get("data"), dict) else (
        data.get("payload") if isinstance(data.get("payload"), dict) else {})
    email = first(data.get("email"), data.get("customer_email"), data.get("buyer_email"),
                  (data.get("customer") or {}).get("email") if isinstance(data.get("customer"), dict) else "",
                  wrapper.get("email"), wrapper.get("customer_email")).lower()
    order_id = first(at("reference"), at("transaction_id"), at("order_id"), at("tx_ref"),
                     wrapper.get("reference"), wrapper.get("order_id"), at("id")) or None
    subunits = at("amount_subunits") or at("amount_in_kobo") or wrapper.get("amount_subunits")
    try:
        amount = float(subunits) / 100 if subunits else float(first(at("amount"), at("total"), wrapper.get("amount")) or 0)
    except (TypeError, ValueError):
        amount = 0.0
    currency = first(at("currency"), wrapper.get("currency")).upper() or None
    items = data.get("items") if isinstance(data.get("items"), list) else []
    product = first(at("product.name"), at("product_name"), wrapper.get("product_name"),
                    at("item_name"), items[0].get("name") if items and isinstance(items[0], dict) else "")
    return {"email": email, "order_id": order_id, "amount": amount, "currency": currency, "product": product}


def _process_purchase(conn: sqlite3.Connection, data: dict, base_url: str = "") -> tuple[str, dict]:
    """Validate + record a purchase payload and upgrade the buyer's tier.

    Returns (status, response) where status is applied | duplicate | invalid.
    Raises on database errors so the caller can log a failed delivery.
    Mirrors deploy/cloudflare worker.js purchaseWebhook semantics.
    """
    customer = data.get("customer") if isinstance(data.get("customer"), dict) else {}
    order = data.get("order") if isinstance(data.get("order"), dict) else {}
    email = str(
        data.get("email") or data.get("customer_email") or data.get("buyer_email")
        or customer.get("email") or ""
    ).strip().lower()
    order_id = str(
        data.get("order_id") or data.get("orderId") or data.get("reference")
        or data.get("id") or order.get("id") or ""
    ).strip() or None
    if not email or "@" not in email:
        _log_webhook(conn, "invalid", data, None, email)
        return "invalid", {"error": "valid email required"}
    if order_id and conn.execute("SELECT 1 FROM purchases WHERE order_id = ?", (order_id,)).fetchone():
        _log_webhook(conn, "duplicate", data, order_id, email)
        return "duplicate", {"ok": True, "duplicate": True}
    tier = "free" if str(data.get("tier") or "complete").lower() == "free" else "complete"
    amount = data.get("amount") if isinstance(data.get("amount"), (int, float)) else None
    currency = str(data.get("currency") or "").upper()[:8]
    provider = str(data.get("provider") or "selar")[:40]
    # Attribution: if the buyer was referred, the affiliate gets credit.
    buyer = conn.execute(
        "SELECT id, referred_by FROM users WHERE lower(email) = ?", (email,)
    ).fetchone()
    ref_code = str(
        (buyer["referred_by"] if buyer and buyer["referred_by"] else "") or data.get("ref") or ""
    ).strip().upper()[:24] or None
    cur = conn.execute(
        "INSERT INTO purchases (order_id, email, tier, amount, currency, provider, ref_code) VALUES (?,?,?,?,?,?,?)",
        (order_id, email, tier, amount, currency, provider, ref_code),
    )
    purchase_id = cur.lastrowid
    if ref_code and isinstance(amount, (int, float)) and amount > 0:
        affiliate = conn.execute("SELECT id FROM users WHERE ref_code = ?", (ref_code,)).fetchone()
        if affiliate:
            conn.execute(
                "INSERT INTO affiliate_earnings (ref_code, purchase_id, email, amount, currency, rate) VALUES (?,?,?,?,?,0.30)",
                (ref_code, purchase_id, email, round(float(amount) * 0.30, 2), currency),
            )
            conn.execute(
                "UPDATE referrals SET status = 'purchased' WHERE ref_code = ? AND lower(email) = ? AND status != 'purchased'",
                (ref_code, email),
            )
    upgraded = False
    claim_token = None
    if buyer:
        conn.execute("UPDATE users SET tier = ? WHERE id = ?", (tier, buyer["id"]))
        # They now have an account: any pending access claim for this email is satisfied.
        conn.execute("UPDATE purchase_claims SET completed_at = datetime('now') WHERE lower(email) = ? AND completed_at IS NULL", (email,))
        upgraded = True
        # Transactional confirmation: account exists, purchase is attached.
        _send_email(conn, email, "Your Soft Life System purchase is confirmed ✅",
                    _purchase_confirmation_html(), "purchase_confirmation")
    else:
        # Stranger-buy flow: no account yet. Mint a one-time claim link so the buyer
        # can set their password and land on a paid-tier account.
        claim_token = secrets.token_hex(16)
        conn.execute(
            "INSERT INTO purchase_claims (email, token, order_id, tier) VALUES (?,?,?,?)",
            (email, claim_token, order_id, tier),
        )
        base = base_url or SITE_URL
        _send_email(conn, email, "Your Soft Life System access is ready 🎉",
                    _claim_email_html(f"{base}/#/claim?token={claim_token}"), "claim")
    _log_webhook(conn, "applied", data, order_id, email)
    response = {"ok": True, "upgraded": upgraded}
    if claim_token:
        response["claim"] = True
    return "applied", response


def init_db() -> None:
    first = not DB.exists()
    conn = db()
    conn.executescript((APP / "server" / "schema.sql").read_text())
    _migrate_session_tables(conn)
    _migrate_admin_tables(conn)
    _migrate_purchase_columns(conn)
    if first:
        _seed(conn)
    conn.close()


def _migrate_purchase_columns(conn: sqlite3.Connection) -> None:
    """Older local DBs predate affiliate attribution on purchases."""
    cols = {row[1] for row in conn.execute("PRAGMA table_info(purchases)")}
    if "ref_code" not in cols:
        conn.execute("ALTER TABLE purchases ADD COLUMN ref_code TEXT")
    if "raw" not in cols:
        conn.execute("ALTER TABLE purchases ADD COLUMN raw TEXT")


def _migrate_session_tables(conn: sqlite3.Connection) -> None:
    """Bring older local dev DBs onto hashed/expiring token tables."""
    session_cols = {row[1] for row in conn.execute("PRAGMA table_info(sessions)")}
    if "token_hash" not in session_cols:
        conn.execute("DROP TABLE IF EXISTS sessions")
        conn.execute(
            "CREATE TABLE sessions ("
            "token_hash TEXT PRIMARY KEY, "
            "user_id INTEGER NOT NULL REFERENCES users(id), "
            "created_at TEXT NOT NULL DEFAULT (datetime('now')), "
            "expires_at TEXT NOT NULL)"
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at)")
    audio_cols = {row[1] for row in conn.execute("PRAGMA table_info(audio_tokens)")}
    if not audio_cols:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS audio_tokens ("
            "token_hash TEXT PRIMARY KEY, "
            "user_id INTEGER NOT NULL REFERENCES users(id), "
            "created_at TEXT NOT NULL DEFAULT (datetime('now')), "
            "expires_at TEXT NOT NULL)"
        )
    conn.commit()


def _hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _seed(conn: sqlite3.Connection) -> None:
    salt = secrets.token_hex(8)
    cur = conn.execute(
        "INSERT INTO users (email, name, password_hash, salt, tier, ref_code) VALUES (?,?,?,?,?,?)",
        (SEED_EMAIL, "Demo Member", _hash(SEED_PASSWORD, salt), salt, "free", "DEMO01"),
    )
    uid = cur.lastrowid
    for week, title, detail in LAUNCH_TASKS:
        conn.execute(
            "INSERT INTO tasks (user_id, title, detail, week, kind) VALUES (?,?,?,?, 'launch')",
            (uid, title, detail, week),
        )
    conn.commit()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(STATIC), **kw)

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.command, fmt % args))

    def _json(self, data: dict, status: int = 200) -> None:
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _html(self, html: str, status: int = 200) -> None:
        body = html.encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            return {}

    def _client_ip(self) -> str:
        forwarded = self.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return self.client_address[0] if self.client_address else ""

    def _origin(self) -> str:
        host = self.headers.get("Host") or "localhost:8100"
        proto = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"
        return f"{proto}://{host}"

    def _user_by_token(self, token: str | None) -> sqlite3.Row | None:
        if not token:
            return None
        conn = db()
        row = conn.execute(
            "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id "
            "WHERE s.token_hash = ? AND s.expires_at > datetime('now')",
            (_token_hash(token),),
        ).fetchone()
        conn.close()
        return row

    def _user(self) -> sqlite3.Row | None:
        auth = self.headers.get("Authorization", "")
        return self._user_by_token(auth[7:] if auth.startswith("Bearer ") else None)

    def _admin_auth(self):
        """Resolve the Bearer token to (role, staff_row|None). None = no valid session."""
        auth = self.headers.get("Authorization", "")
        token = auth[7:] if auth.startswith("Bearer ") else ""
        if not token:
            return None
        token_hash = _token_hash(token)
        conn = db()
        legacy = conn.execute(
            "SELECT 1 FROM admin_sessions WHERE token_hash = ? AND expires_at > datetime('now')",
            (token_hash,),
        ).fetchone()
        conn.close()
        if legacy:
            self._admin_actor = "superadmin"
            return ("superadmin", None)
        conn = db()
        staff = conn.execute(
            "SELECT s.id, s.email, s.name, s.role FROM staff_users s "
            "JOIN staff_sessions ss ON ss.staff_id = s.id "
            "WHERE ss.token_hash = ? AND ss.expires_at > datetime('now') AND s.active = 1",
            (token_hash,),
        ).fetchone()
        conn.close()
        if staff:
            self._admin_actor = staff["email"]
            return (staff["role"], dict(staff))
        return None

    def _allowed(self, role: str, route: str) -> bool:
        cap = self._cap_for_route(route)
        return bool(cap) and role in ADMIN_CAPS.get(cap, set())

    def _audio_user(self) -> sqlite3.Row | None:
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        token = (qs.get("token") or [""])[0]
        if not token:
            return None
        conn = db()
        row = conn.execute(
            "SELECT u.* FROM audio_tokens t JOIN users u ON u.id = t.user_id "
            "WHERE t.token_hash = ? AND t.expires_at > datetime('now')",
            (_token_hash(token),),
        ).fetchone()
        conn.close()
        return row

    # ---------- API ----------

    def do_GET(self):
        if not self.path.startswith("/api/"):
            return super().do_GET()
        route = self.path.split("?")[0]
        if route == "/api/health":
            return self._json({"ok": True, "service": "softlife", "time": datetime.now(timezone.utc).isoformat()})
        if route == "/api/lead/result":
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            token = (qs.get("t") or [""])[0][:64]
            if not re.fullmatch(r"[a-f0-9]{32}", token):
                return self._json({"error": "not found"}, 404)
            conn = db()
            row = conn.execute(
                "SELECT magnet, name, answers, result, created_at FROM lead_submissions WHERE token = ?", (token,)
            ).fetchone()
            conn.close()
            if not row:
                return self._json({"error": "not found"}, 404)
            return self._json({
                "magnet": row["magnet"], "name": row["name"],
                "answers": json.loads(row["answers"]), "result": json.loads(row["result"]),
                "created_at": row["created_at"],
            })
        if route == "/api/email-cron":
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            provided = qs.get("key", [""])[0]
            if not WEBHOOK_SECRET or not secrets.compare_digest(provided, WEBHOOK_SECRET):
                return self._json({"error": "unauthorized"}, 401)
            conn = db()
            summary = _run_email_sequences(conn, self._origin())
            conn.commit()
            conn.close()
            return self._json({"ok": True, "summary": summary})
        if route == "/api/unsubscribe":
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            token = clean_text(qs.get("token", [""])[0], 64)
            title, msg = ("Invalid link",
                          "This unsubscribe link is missing its token. If you want to stop marketing emails, reply to any email and we'll opt you out.")
            code = 400
            if token:
                conn = db()
                row = conn.execute("SELECT id FROM users WHERE unsub_token = ?", (token,)).fetchone()
                conn.close()
                if row:
                    conn = db()
                    conn.execute("UPDATE users SET marketing_consent = 0 WHERE id = ?", (row["id"],))
                    conn.commit()
                    conn.close()
                    title, msg, code = ("You're unsubscribed",
                                        "You won't receive any more marketing emails from The Soft Life System. "
                                        "Your account and any purchased access are untouched - you'll still get essential emails like password resets and purchase confirmations.",
                                        200)
                else:
                    conn = db()
                    lead = conn.execute("SELECT id FROM lead_submissions WHERE unsub_token = ?", (token,)).fetchone()
                    if lead:
                        conn.execute("UPDATE lead_submissions SET consent = 0 WHERE id = ?", (lead["id"],))
                        conn.commit()
                        conn.close()
                        title, msg, code = ("You're unsubscribed",
                                            "You won't receive any more marketing emails from The Soft Life System. Your downloaded result is untouched.",
                                            200)
                    else:
                        conn.close()
                        title, msg, code = ("Invalid link",
                                            "We couldn't match this unsubscribe link to an account. If you keep receiving emails, reply to any of them and we'll opt you out.",
                                            200)
                        code = 400
            html = ('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                    '<title>' + title + '</title><style>body{font-family:Georgia,serif;background:#faf7f2;color:#2a0f4a;display:grid;place-items:center;min-height:100vh}'
                    'div{text-align:center;max-width:420px;padding:24px}h1{color:#5d2189;font-size:1.5rem}p{color:#6d5f7a;line-height:1.6}</style></head>'
                    '<body><div><h1>' + title + '</h1><p>' + msg + '</p></div></body></html>')
            return self._html(html, code)
        if route == "/api/config":
            host = self.headers.get("Host") or "127.0.0.1:8100"
            return self._json({
                "siteUrl": f"http://{host}",
                "checkoutUrl": os.environ.get("CHECKOUT_URL", ""),
                "selarUrl": os.environ.get("SELAR_CHECKOUT_URL", os.environ.get("CHECKOUT_URL", "")),
                "payhipUrl": os.environ.get("PAYHIP_CHECKOUT_URL", ""),
                "mainstackUrl": os.environ.get("MAINSTACK_CHECKOUT_URL", ""),
                "paystackUrl": os.environ.get("PAYSTACK_CHECKOUT_URL", ""),
                "country": os.environ.get("CF_COUNTRY", ""),
                "supportEmail": os.environ.get("SUPPORT_EMAIL", "admin@gabochie.com"),
                "freeAudio": sorted(FREE_AUDIO),
                "allAudio": AUDIO_SLUGS,
                "tiers": ["free", "complete"],
            })
        if route.startswith("/api/audio/"):
            return self._serve_audio(route[len("/api/audio/"):].removesuffix(".mp3"))
        user = self._user()
        if route == "/api/me":
            if not user:
                return self._json({"error": "unauthorized"}, 401)
            return self._json(self._me(user))
        if route == "/api/onboarding":
            if not user:
                return self._json({"error": "unauthorized"}, 401)
            conn = db()
            row = load_onboarding(conn, user["id"])
            conn.close()
            return self._json({"onboarding": dict(row) if row else None})
        if route == "/api/tasks":
            if not user:
                return self._json({"error": "unauthorized"}, 401)
            conn = db()
            rows = conn.execute(
                "SELECT id, title, detail, week, kind, done FROM tasks WHERE user_id = ? ORDER BY week, id",
                (user["id"],),
            ).fetchall()
            conn.close()
            return self._json({"tasks": [dict(r) for r in rows]})
        if route == "/api/affiliate":
            if not user:
                return self._json({"error": "unauthorized"}, 401)
            conn = db()
            code = user["ref_code"]
            clicks = conn.execute(
                "SELECT COUNT(*) c FROM referrals WHERE ref_code = ? AND status = 'clicked'", (code,)
            ).fetchone()["c"]
            signups = conn.execute(
                "SELECT COUNT(*) c FROM referrals WHERE ref_code = ? AND status IN ('signed_up','purchased')",
                (code,),
            ).fetchone()["c"]
            purchases = conn.execute(
                "SELECT COUNT(*) c FROM purchases WHERE ref_code = ?", (code,)
            ).fetchone()["c"]
            pending = conn.execute(
                "SELECT COALESCE(SUM(amount), 0) s FROM affiliate_earnings WHERE ref_code = ? AND status = 'pending'",
                (code,),
            ).fetchone()["s"]
            paid = conn.execute(
                "SELECT COALESCE(SUM(amount), 0) s FROM affiliate_earnings WHERE ref_code = ? AND status = 'paid'",
                (code,),
            ).fetchone()["s"]
            conn.close()
            return self._json({
                "ref_code": code,
                "clicks": clicks,
                "signups": signups,
                "purchases": purchases,
                "conversion_rate": round((purchases / clicks) * 1000) / 10 if clicks else 0,
                "pending_earnings": round(pending, 2),
                "paid_earnings": round(paid, 2),
                "lifetime_earnings": round(pending + paid, 2),
                "commission_rate": "30%",
                "payout_note": "Payouts run monthly via Selar mobile money (MVP: manual review).",
            })
        if route.startswith("/api/admin/"):
            auth = self._admin_auth()
            if not auth:
                return self._json({"error": "unauthorized"}, 401)
            if not self._allowed(auth[0], route):
                return self._json({"error": "not allowed for your role"}, 403)
            return self._admin_get(route)
        return self._json({"error": "not found"}, 404)

    def _admin_audio_uploaded(self) -> list[str]:
        if not AUDIO_DIR.exists():
            return []
        return sorted(p.stem for p in AUDIO_DIR.glob("*.mp3"))

    def _cap_for_route(self, route: str) -> str | None:
        if route.startswith("/api/admin/analytics/"):
            return "analytics"
        if route.startswith("/api/admin/webhooks"):
            return "webhooks"
        if route == "/api/admin/claims":
            return "webhooks"
        if route == "/api/admin/security":
            return "security"
        if route == "/api/admin/crm/stage":
            return "crm_stage"
        if route == "/api/admin/crm/notes":
            return "crm_note"
        if route.startswith("/api/admin/crm"):
            return "crm"
        if route.startswith("/api/admin/team"):
            return "team"
        if route.startswith("/api/admin/users/"):
            if route.endswith("/tier"):
                return "set_tier"
            if route.endswith("/role"):
                return "set_role"
            return "users"
        if route == "/api/admin/overview":
            return "overview"
        if route == "/api/admin/users":
            return "users"
        if route == "/api/admin/referrals":
            return "referrals"
        if route.startswith("/api/admin/email"):
            return "email"
        if route == "/api/admin/purchases":
            return "purchases"
        if route == "/api/admin/onboarding":
            return "onboarding"
        if route == "/api/admin/audio":
            return "audio"
        return None

    def _audit(self, conn: sqlite3.Connection, action: str, target: str, meta: dict | None = None) -> None:
        conn.execute(
            "INSERT INTO audit_logs (actor, action, target, meta) VALUES (?, ?, ?, ?)",
            (getattr(self, "_admin_actor", "superadmin"), action, target, json.dumps(meta or {})),
        )

    def _admin_get(self, route: str):
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)

        def param(name: str, default: str) -> str:
            return (qs.get(name) or [default])[0]

        conn = db()

        def count(sql: str, args: tuple = ()) -> int:
            return conn.execute(sql, args).fetchone()["c"]

        if route == "/api/admin/overview":
            uploaded = self._admin_audio_uploaded()
            out = {
                "users": count("SELECT COUNT(*) c FROM users"),
                "signups7d": count("SELECT COUNT(*) c FROM users WHERE created_at >= datetime('now', '-7 days')"),
                "signups30d": count("SELECT COUNT(*) c FROM users WHERE created_at >= datetime('now', '-30 days')"),
                "tasks": count("SELECT COUNT(*) c FROM tasks"),
                "tasksDone": count("SELECT COUNT(*) c FROM tasks WHERE done = 1"),
                "referrals": count("SELECT COUNT(*) c FROM referrals"),
                "purchases": count("SELECT COUNT(*) c FROM purchases"),
                "revenue": conn.execute("SELECT COALESCE(SUM(amount), 0) s FROM purchases").fetchone()["s"],
                "onboardingCompleted": count("SELECT COUNT(*) c FROM onboarding WHERE completed_at IS NOT NULL"),
                "whatsappOptIn": count("SELECT COUNT(*) c FROM onboarding WHERE whatsapp_consent = 1"),
                "events7d": count("SELECT COUNT(*) c FROM events WHERE created_at >= datetime('now', '-7 days')"),
                "audio": {"uploaded": uploaded, "count": len(uploaded), "expected": AUDIO_SLUGS},
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            }
            conn.close()
            return self._json(out)

        if route == "/api/admin/email":
            seg_all = conn.execute("SELECT COUNT(*) c FROM users WHERE marketing_consent = 1").fetchone()["c"]
            seg_free = conn.execute("SELECT COUNT(*) c FROM users WHERE tier = 'free' AND marketing_consent = 1").fetchone()["c"]
            seg_paid = conn.execute("SELECT COUNT(*) c FROM users WHERE tier != 'free' AND marketing_consent = 1").fetchone()["c"]
            seg_inactive = conn.execute(
                "SELECT COUNT(*) c FROM users WHERE marketing_consent = 1 AND NOT EXISTS"
                " (SELECT 1 FROM sessions s WHERE s.user_id = users.id AND s.created_at >= datetime('now', '-14 days'))"
            ).fetchone()["c"]
            campaigns = [dict(r) for r in conn.execute(
                "SELECT id, subject, segment, recipients, sent, failed, created_at FROM email_campaigns ORDER BY id DESC LIMIT 20"
            ).fetchall()]
            log = [dict(r) for r in conn.execute(
                "SELECT to_email, subject, kind, status, error, created_at FROM email_log ORDER BY id DESC LIMIT 30"
            ).fetchall()]
            conn.close()
            return self._json({"segments": {"all": seg_all, "free": seg_free, "paid": seg_paid, "inactive": seg_inactive},
                               "campaigns": campaigns, "log": log})

        if route == "/api/admin/users":
            q = param("q", "").strip()
            try:
                limit = min(100, max(1, int(param("limit", "50"))))
            except ValueError:
                limit = 50
            try:
                offset = max(0, int(param("offset", "0")))
            except ValueError:
                offset = 0
            like = f"%{q}%"
            rows = conn.execute(
                "SELECT u.id, u.email, u.name, u.tier, u.role, u.ref_code, u.created_at, "
                "(SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id) AS tasks, "
                "(SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id AND t.done = 1) AS done "
                "FROM users u WHERE (? = '' OR u.email LIKE ? OR u.name LIKE ?) "
                "ORDER BY u.id DESC LIMIT ? OFFSET ?",
                (q, like, like, limit, offset),
            ).fetchall()
            conn.close()
            return self._json({"users": [dict(r) for r in rows], "q": q, "limit": limit, "offset": offset})

        if route == "/api/admin/referrals":
            rows = conn.execute(
                "SELECT id, ref_code, email, status, created_at FROM referrals ORDER BY id DESC LIMIT 100"
            ).fetchall()
            stats = conn.execute(
                "SELECT r.ref_code, u.name AS affiliate_name, u.email AS affiliate_email,"
                " SUM(CASE WHEN r.status = 'clicked' THEN 1 ELSE 0 END) AS clicks,"
                " SUM(CASE WHEN r.status IN ('signed_up','purchased') THEN 1 ELSE 0 END) AS signups,"
                " (SELECT COUNT(*) FROM purchases p WHERE p.ref_code = r.ref_code) AS purchases,"
                " (SELECT COALESCE(SUM(e.amount), 0) FROM affiliate_earnings e WHERE e.ref_code = r.ref_code) AS earnings"
                " FROM referrals r LEFT JOIN users u ON u.ref_code = r.ref_code"
                " GROUP BY r.ref_code ORDER BY earnings DESC, clicks DESC LIMIT 50"
            ).fetchall()
            conn.close()
            return self._json({"referrals": [dict(r) for r in rows], "stats": [dict(s) for s in stats]})

        if route == "/api/admin/purchases":
            rows = conn.execute(
                "SELECT id, order_id, email, tier, amount, currency, provider, ref_code, created_at "
                "FROM purchases ORDER BY id DESC LIMIT 100"
            ).fetchall()
            conn.close()
            return self._json({"purchases": [dict(r) for r in rows]})

        if route == "/api/admin/onboarding":
            rows = conn.execute(
                "SELECT o.*, u.email, u.name, u.tier FROM onboarding o JOIN users u ON u.id = o.user_id "
                "ORDER BY o.updated_at DESC LIMIT 200"
            ).fetchall()
            conn.close()
            return self._json({"onboarding": [dict(r) for r in rows]})

        if route == "/api/admin/audio":
            uploaded = self._admin_audio_uploaded()
            conn.close()
            return self._json({
                "uploaded": uploaded,
                "missing": [slug for slug in AUDIO_SLUGS if slug not in uploaded],
                "expected": AUDIO_SLUGS,
            })

        # ---------- product analytics ----------
        def daily_active(days: int) -> list[dict]:
            rows = conn.execute(
                "SELECT date(created_at) d, COUNT(DISTINCT user_id) c FROM events "
                "WHERE user_id IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY d",
                (f"-{days - 1} days",),
            ).fetchall()
            by_day = {r["d"]: r["c"] for r in rows}
            today = datetime.now(timezone.utc)
            return [
                {"day": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "active": by_day.get((today - timedelta(days=i)).strftime("%Y-%m-%d"), 0)}
                for i in range(days - 1, -1, -1)
            ]

        def daily_events(days: int) -> list[dict]:
            rows = conn.execute(
                "SELECT date(created_at) d, COUNT(*) c FROM events "
                "WHERE created_at >= datetime('now', ?) GROUP BY d",
                (f"-{days - 1} days",),
            ).fetchall()
            by_day = {r["d"]: r["c"] for r in rows}
            today = datetime.now(timezone.utc)
            return [
                {"day": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "events": by_day.get((today - timedelta(days=i)).strftime("%Y-%m-%d"), 0)}
                for i in range(days - 1, -1, -1)
            ]

        if route == "/api/admin/analytics/overview":
            users_total = count("SELECT COUNT(*) c FROM users")
            dau = count("SELECT COUNT(DISTINCT user_id) c FROM events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-1 day')")
            wau = count("SELECT COUNT(DISTINCT user_id) c FROM events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-7 days')")
            mau = count("SELECT COUNT(DISTINCT user_id) c FROM events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-30 days')")
            activated = count(
                "SELECT COUNT(*) c FROM (SELECT user_id FROM events WHERE event = 'task_completed' "
                "GROUP BY user_id HAVING COUNT(*) >= 3)"
            )
            velocity = conn.execute(
                "SELECT AVG(julianday(e.first_done) - julianday(u.created_at)) v FROM users u "
                "JOIN (SELECT user_id, MIN(created_at) first_done FROM events "
                "      WHERE event = 'task_completed' GROUP BY user_id) e ON e.user_id = u.id"
            ).fetchone()["v"]
            series = daily_active(30)
            conn.close()
            return self._json({
                "users": users_total,
                "dau": dau,
                "wau": wau,
                "mau": mau,
                "activationRate": round(100 * activated / users_total) if users_total else 0,
                "activatedUsers": activated,
                "daysToFirstTask": round(velocity, 1) if velocity is not None else None,
                "dailyActive": series,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            })

        if route == "/api/admin/analytics/audio":
            plays = {
                r["slug"]: {"plays": r["plays"], "listeners": r["listeners"]}
                for r in conn.execute(
                    "SELECT json_extract(meta, '$.slug') slug, COUNT(*) plays, "
                    "COUNT(DISTINCT user_id) listeners FROM events "
                    "WHERE event = 'audio_play' AND json_extract(meta, '$.slug') IS NOT NULL "
                    "GROUP BY slug",
                ).fetchall()
            }
            completions = {
                r["slug"]: r["completions"]
                for r in conn.execute(
                    "SELECT json_extract(meta, '$.slug') slug, COUNT(*) completions FROM events "
                    "WHERE event = 'audio_complete' AND json_extract(meta, '$.slug') IS NOT NULL "
                    "GROUP BY slug",
                ).fetchall()
            }
            chapters = []
            for slug in AUDIO_SLUGS:
                p = plays.get(slug, {"plays": 0, "listeners": 0})
                chapters.append({
                    "slug": slug,
                    "plays": p["plays"],
                    "listeners": p["listeners"],
                    "completions": completions.get(slug, 0),
                })
            conn.close()
            return self._json({"chapters": chapters, "expected": AUDIO_SLUGS})

        if route == "/api/admin/analytics/tasks":
            weeks = [dict(r) for r in conn.execute(
                "SELECT COALESCE(week, 0) week, COUNT(*) total, COALESCE(SUM(done), 0) done "
                "FROM tasks GROUP BY week ORDER BY week",
            ).fetchall()]
            top_tasks = [dict(r) for r in conn.execute(
                "SELECT title, week, COUNT(*) total, COALESCE(SUM(done), 0) done "
                "FROM tasks GROUP BY title ORDER BY done DESC, total DESC LIMIT 16",
            ).fetchall()]
            completed_events = count("SELECT COUNT(*) c FROM events WHERE event = 'task_completed'")
            added_events = count("SELECT COUNT(*) c FROM events WHERE event = 'task_added'")
            conn.close()
            return self._json({
                "weeks": weeks,
                "topTasks": top_tasks,
                "completedEvents": completed_events,
                "addedEvents": added_events,
            })

        if route == "/api/admin/analytics/onboarding":
            fields = ["business_name", "business_stage", "country", "timezone", "main_goal",
                      "biggest_challenge", "revenue_range", "team_size", "whatsapp_number"]
            started = count("SELECT COUNT(*) c FROM onboarding")
            steps = []
            for field in fields:
                filled = count(f"SELECT COUNT(*) c FROM onboarding WHERE {field} != ''")
                steps.append({
                    "field": field,
                    "filled": filled,
                    "rate": round(100 * filled / started) if started else 0,
                })
            completed = count("SELECT COUNT(*) c FROM onboarding WHERE completed_at IS NOT NULL")
            opt_in = count("SELECT COUNT(*) c FROM onboarding WHERE whatsapp_consent = 1")
            conn.close()
            return self._json({
                "started": started,
                "completed": completed,
                "whatsappOptIn": opt_in,
                "steps": steps,
            })

        if route == "/api/admin/analytics/engagement":
            pages = [dict(r) for r in conn.execute(
                "SELECT path, COUNT(*) views, COUNT(DISTINCT user_id) users FROM events "
                "WHERE event = 'page_view' GROUP BY path ORDER BY views DESC LIMIT 12",
            ).fetchall()]
            by_event = [dict(r) for r in conn.execute(
                "SELECT event, COUNT(*) c FROM events GROUP BY event ORDER BY c DESC",
            ).fetchall()]
            events_series = daily_events(14)
            conn.close()
            return self._json({
                "pages": pages,
                "byEvent": by_event,
                "dailyEvents": events_series,
            })

        if route == "/api/admin/analytics/content":
            def daily_views(days: int) -> list[dict]:
                rows = conn.execute(
                    "SELECT date(created_at) d, COUNT(*) c FROM events "
                    "WHERE event = 'page_view' AND created_at >= datetime('now', ?) GROUP BY d",
                    (f"-{days - 1} days",),
                ).fetchall()
                by_day = {r["d"]: r["c"] for r in rows}
                today = datetime.now(timezone.utc)
                return [
                    {"day": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "views": by_day.get((today - timedelta(days=i)).strftime("%Y-%m-%d"), 0)}
                    for i in range(days - 1, -1, -1)
                ]
            posts = [dict(r) for r in conn.execute(
                "SELECT path, COUNT(*) views, COUNT(DISTINCT user_id) members, "
                "SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) anonymous "
                "FROM events WHERE event = 'page_view' AND path LIKE '/blog/%' "
                "GROUP BY path ORDER BY views DESC LIMIT 20",
            ).fetchall()]
            titles = {"/blog/" + p["slug"] + "/": p["title"] for p in BLOG_POSTS}
            for row in posts:
                row["title"] = titles.get(row["path"], row["path"])
            sources = [dict(r) for r in conn.execute(
                "SELECT COALESCE(NULLIF(json_extract(meta, '$.utm_source'), ''), '(none)') utm, COUNT(*) c "
                "FROM events WHERE event = 'page_view' GROUP BY 1 ORDER BY c DESC LIMIT 8",
            ).fetchall()]
            referrers = [dict(r) for r in conn.execute(
                "SELECT COALESCE(NULLIF(json_extract(meta, '$.referrer'), ''), '(direct)') referrer, COUNT(*) c "
                "FROM events WHERE event = 'page_view' GROUP BY 1 ORDER BY c DESC LIMIT 10",
            ).fetchall()]
            views = daily_views(14)
            conn.close()
            return self._json({
                "posts": posts,
                "expectedPosts": ["/blog/" + p["slug"] + "/" for p in BLOG_POSTS],
                "sources": sources,
                "referrers": referrers,
                "dailyViews": views,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            })

        if route == "/api/admin/security":
            def sec_counts(where: str) -> dict:
                return {
                    r["kind"]: r["c"] for r in conn.execute(
                        f"SELECT kind, COUNT(*) c FROM security_log WHERE created_at >= datetime('now', {where}) GROUP BY kind",
                    ).fetchall()
                }
            last24 = sec_counts("'-1 days'")
            last7 = sec_counts("'-7 days'")
            live = {
                "member": count("SELECT COUNT(*) c FROM sessions WHERE expires_at > datetime('now')"),
                "admin": count("SELECT COUNT(*) c FROM admin_sessions WHERE expires_at > datetime('now')"),
                "staff": count("SELECT COUNT(*) c FROM staff_sessions WHERE expires_at > datetime('now')"),
            }
            recent = [dict(r) for r in conn.execute(
                "SELECT id, kind, email, ip, detail, created_at FROM security_log ORDER BY id DESC LIMIT 50",
            ).fetchall()]
            audit = [dict(r) for r in conn.execute(
                "SELECT id, actor, action, target, created_at FROM audit_logs ORDER BY id DESC LIMIT 25",
            ).fetchall()]
            conn.close()
            return self._json({
                "last24": last24,
                "last7": last7,
                "liveSessions": live,
                "recent": recent,
                "audit": audit,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            })

        if route == "/api/admin/team":
            rows = conn.execute(
                "SELECT s.id, s.email, s.name, s.role, s.active, s.created_at, "
                "(SELECT COUNT(*) FROM staff_sessions ss WHERE ss.staff_id = s.id "
                " AND ss.expires_at > datetime('now')) AS sessions "
                "FROM staff_users s ORDER BY s.id",
            ).fetchall()
            conn.close()
            return self._json({"staff": [dict(r) for r in rows], "roles": STAFF_ROLES})

        if route == "/api/admin/crm":
            try:
                uid = int(param("user_id", "0"))
            except ValueError:
                uid = 0
            member = conn.execute(
                "SELECT id, email, name, tier, role, ref_code, referred_by, created_at FROM users WHERE id = ?",
                (uid,),
            ).fetchone()
            if not member:
                conn.close()
                return self._json({"error": "not found"}, 404)
            onb = conn.execute("SELECT * FROM onboarding WHERE user_id = ?", (uid,)).fetchone()
            purchases = [dict(r) for r in conn.execute(
                "SELECT id, order_id, tier, amount, currency, provider, created_at FROM purchases "
                "WHERE lower(email) = lower(?) ORDER BY id DESC",
                (member["email"],),
            ).fetchall()]
            ltv = sum((p["amount"] or 0) for p in purchases if isinstance(p["amount"], (int, float)))
            timeline = [dict(r) for r in conn.execute(
                "SELECT event, path, meta, created_at FROM events WHERE user_id = ? "
                "ORDER BY id DESC LIMIT 25",
                (uid,),
            ).fetchall()]
            signals = {
                "tasksDone": count("SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND done = 1", (uid,)),
                "tasksTotal": count("SELECT COUNT(*) c FROM tasks WHERE user_id = ?", (uid,)),
                "audioStarted": count("SELECT COUNT(*) c FROM events WHERE user_id = ? AND event = 'audio_play'", (uid,)),
                "audioCompleted": count("SELECT COUNT(*) c FROM events WHERE user_id = ? AND event = 'audio_complete'", (uid,)),
                "checkoutClicks": count("SELECT COUNT(*) c FROM events WHERE user_id = ? AND event = 'checkout_click'", (uid,)),
            }
            stage_row = conn.execute("SELECT stage, updated_at FROM crm_pipeline WHERE user_id = ?", (uid,)).fetchone()
            notes = [dict(r) for r in conn.execute(
                "SELECT id, note, author, created_at FROM crm_notes WHERE user_id = ? ORDER BY id DESC LIMIT 50",
                (uid,),
            ).fetchall()]
            conn.close()
            return self._json({
                "member": dict(member),
                "onboarding": dict(onb) if onb else None,
                "purchases": purchases,
                "ltv": round(ltv, 2),
                "timeline": timeline,
                "signals": signals,
                "stage": stage_row["stage"] if stage_row else "lead",
                "stageUpdatedAt": stage_row["updated_at"] if stage_row else None,
                "notes": notes,
            })

        if route == "/api/admin/webhooks":
            stats = {s: 0 for s in ("applied", "duplicate", "rejected", "invalid", "failed")}
            for row in conn.execute("SELECT status, COUNT(*) c FROM webhook_logs GROUP BY status"):
                if row["status"] in stats:
                    stats[row["status"]] = row["c"]
            last = conn.execute("SELECT created_at FROM webhook_logs ORDER BY id DESC LIMIT 1").fetchone()
            deliveries = [dict(r) for r in conn.execute(
                "SELECT id, status, order_id, email, error, created_at, "
                "length(payload) AS payload_size FROM webhook_logs ORDER BY id DESC LIMIT 50",
            ).fetchall()]
            conn.close()
            total = sum(stats.values())
            return self._json({
                "stats": stats,
                "total": total,
                "lastDelivery": last["created_at"] if last else None,
                "configured": bool(WEBHOOK_SECRET),
                "deliveries": deliveries,
            })

        if route == "/api/admin/claims":
            pending = [dict(r) for r in conn.execute(
                "SELECT id, email, order_id, tier, created_at, token, "
                "(SELECT status FROM email_log WHERE to_email = purchase_claims.email AND kind = 'claim' "
                " ORDER BY id DESC LIMIT 1) AS email_status "
                "FROM purchase_claims "
                "WHERE completed_at IS NULL AND created_at >= datetime('now', '-30 days') ORDER BY id DESC LIMIT 50",
            ).fetchall()]
            completed = conn.execute(
                "SELECT COUNT(*) c FROM purchase_claims WHERE completed_at IS NOT NULL",
            ).fetchone()["c"]
            emails = [dict(r) for r in conn.execute(
                "SELECT to_email, subject, kind, status, error, created_at FROM email_log ORDER BY id DESC LIMIT 20",
            ).fetchall()]
            conn.close()
            for row in pending:
                row["claimUrl"] = f"{self._origin()}/#/claim?token={row.pop('token')}"
            return self._json({"pending": pending, "completed": completed, "emails": emails})

        conn.close()
        return self._json({"error": "not found"}, 404)

    def do_POST(self):
        if not self.path.startswith("/api/"):
            return self._json({"error": "not found"}, 404)
        route = self.path.split("?")[0]
        data = self._body()

        if route == "/api/lead/scorecard":
            # Honeypot: bots fill the hidden field; silently accept so they move on.
            if clean_text(data.get("website"), 60):
                return self._json({"ok": True, "token": "", "url": ""})
            email = clean_text(data.get("email"), 120).lower()
            if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", email):
                return self._json({"error": "Enter a valid email address."}, 400)
            if data.get("consent") not in (True, 1, "1"):
                return self._json({"error": "Please tick the consent box so we can email your report."}, 400)
            name = clean_text(data.get("name"), 80) or email.split("@")[0]
            raw = data.get("answers")
            if not isinstance(raw, list) or len(raw) != 8:
                return self._json({"error": "Score all 8 dimensions."}, 400)
            answers = []
            for value in raw:
                try:
                    n = int(value)
                except (TypeError, ValueError):
                    n = 0
                if str(value) != str(n) or not 1 <= n <= 10:
                    return self._json({"error": "Each score must be a whole number from 1 to 10."}, 400)
                answers.append(n)
            conn = db()
            try:
                recent = conn.execute(
                    "SELECT COUNT(*) AS c FROM lead_submissions WHERE email = ? AND created_at >= datetime('now','-60 seconds')",
                    (email,),
                ).fetchone()["c"]
                if recent:
                    conn.close()
                    return self._json({"error": "That report was just created. Check your inbox."}, 429)
                ip = self._client_ip()
                if ip and conn.execute(
                    "SELECT COUNT(*) AS c FROM lead_submissions WHERE ip = ? AND created_at >= datetime('now','-60 seconds')", (ip,)
                ).fetchone()["c"] >= 3:
                    conn.close()
                    return self._json({"error": "Too many requests. Try again in a minute."}, 429)
                result = scorecard_result(answers)
                token = secrets.token_hex(16)
                unsub_token = secrets.token_hex(16)
                conn.execute(
                    "INSERT INTO lead_submissions (token, magnet, email, name, answers, result, consent, consent_version, unsub_token, ip) "
                    "VALUES (?,?,?,?,?,?,1,?,?,?)",
                    (token, "scorecard", email, name, json.dumps(answers), json.dumps(result), CONSENT_VERSION,
                     unsub_token, ip[:64]),
                )
                conn.commit()
            except sqlite3.Error:
                conn.close()
                return self._json({"error": "We couldn't save your result. Please try again."}, 500)
            conn.close()
            origin = os.environ.get("SITE_URL", self._origin())
            link = origin.rstrip("/") + "/tools/scorecard-result.html?t=" + token
            labels = [d["label"] for d in SCORECARD_DIMENSIONS if d["key"] in result["bottom"]]
            text = "%s, you scored %d/80 — %s. Your two lowest dimensions: %s. Open your printable report: %s" % (
                name, result["total"], result["band"]["label"], " and ".join(labels), link)
            conn = db()
            _send_email(conn, email, "Your Soft Life Scorecard is ready",
                        lead_email_html(link, result, name, unsub_token, origin), "lead_scorecard", text)
            conn.commit()
            conn.close()
            return self._json({"ok": True, "token": token, "url": link})

        if route == "/api/webhooks/purchase":
            if not WEBHOOK_SECRET:
                return self._json({"error": "purchase webhook not configured"}, 503)
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            provided = (self.headers.get("Authorization", "")[7:] or self.headers.get("X-Webhook-Secret", "")).strip()
            if not provided:
                provided = (qs.get("secret", [""])[0] or qs.get("key", [""])[0]).strip()
            if not secrets.compare_digest(provided.encode(), WEBHOOK_SECRET.encode()):
                conn = db()
                _log_webhook(conn, "rejected", data, None, str(data.get("email") or ""))
                _log_security(conn, "webhook_rejected", email=str(data.get("email") or ""), ip=self._client_ip(),
                              detail=f"order_id={data.get('order_id') or ''}")
                conn.commit()
                conn.close()
                return self._json({"error": "unauthorized"}, 401)
            conn = db()
            try:
                status, response = _process_purchase(conn, data, self._origin())
                conn.commit()
                return self._json(response, 200 if status != "invalid" else 400)
            except Exception as exc:
                conn.rollback()
                _log_webhook(conn, "failed", data, None, str(data.get("email") or ""), error=str(exc)[:500])
                conn.commit()
                return self._json({"error": "webhook processing failed"}, 500)
            finally:
                conn.close()

        if route == "/api/webhooks/mainstack":
            raw = None  # body was already parsed as JSON by self._body()
            ms_secret = os.environ.get("MAINSTACK_WEBHOOK_SECRET", "")
            provided = (self.headers.get("Authorization", "")[7:] or self.headers.get("X-Webhook-Secret", "")).strip()
            ok = False
            if ms_secret:
                if secrets.compare_digest((self.headers.get("verif-hash") or "").encode(), ms_secret.encode()):
                    ok = True
                else:
                    for header, algo in (("x-mainstack-signature", "sha512"), ("x-mainstack-signature-512", "sha512"),
                                         ("x-mainstack-signature-256", "sha256")):
                        given = self.headers.get(header, "").lower()
                        if not given:
                            continue
                        expected = hmac.new(ms_secret.encode(), json.dumps(data, separators=(",", ":")).encode(), algo).hexdigest()
                        if secrets.compare_digest(given.encode(), expected.encode()):
                            ok = True
                            break
            else:
                ok = bool(WEBHOOK_SECRET and provided and secrets.compare_digest(provided.encode(), WEBHOOK_SECRET.encode()))
            if not ok:
                conn = db()
                _log_webhook(conn, "rejected", data, None, str(data.get("email") or ""))
                _log_security(conn, "webhook_rejected", email=str(data.get("email") or ""), ip=self._client_ip(),
                              detail="source=mainstack")
                conn.commit()
                conn.close()
                return self._json({"error": "unauthorized"}, 401)
            norm = _mainstack_normalize(data)
            event = str(data.get("event") or data.get("type") or "")
            if event and "refund" in event.lower():
                conn = db()
                _log_webhook(conn, "ignored", data, norm["order_id"], norm["email"], error="refund event - not a sale")
                conn.commit()
                conn.close()
                return self._json({"ok": True, "received": True, "ignored": True})
            if norm["product"] and not re.search(r"soft\s*life", norm["product"], re.I):
                conn = db()
                _log_webhook(conn, "ignored", data, norm["order_id"], norm["email"], error=f"other product: {norm['product'][:80]}")
                conn.commit()
                conn.close()
                return self._json({"ok": True, "received": True, "ignored": True})
            conn = db()
            try:
                payload = {k: v for k, v in norm.items() if k != "product" and v is not None}
                payload["provider"] = "mainstack"
                status, response = _process_purchase(conn, payload, self._origin())
                conn.commit()
                return self._json(response, 200 if status != "invalid" else 400)
            except Exception as exc:
                conn.rollback()
                _log_webhook(conn, "failed", data, norm["order_id"], norm["email"], error=str(exc)[:500])
                conn.commit()
                return self._json({"error": "webhook processing failed"}, 500)
            finally:
                conn.close()

        if route == "/api/webhooks/paystack":
            ps_secret = os.environ.get("PAYSTACK_SECRET_KEY", "")
            given = (self.headers.get("x-paystack-signature") or "").lower()
            if not ps_secret or not given:
                conn = db()
                _log_webhook(conn, "rejected", data, None, str(((data.get("data") or {}).get("customer") or {}).get("email") or ""))
                _log_security(conn, "webhook_rejected", email="", ip=self._client_ip(), detail="source=paystack")
                conn.commit()
                conn.close()
                return self._json({"error": "unauthorized"}, 401)
            expected = hmac.new(ps_secret.encode(), json.dumps(data, separators=(",", ":")).encode(), "sha512").hexdigest()
            if not secrets.compare_digest(given.encode(), expected.encode()):
                conn = db()
                _log_webhook(conn, "rejected", data, None, str(((data.get("data") or {}).get("customer") or {}).get("email") or ""))
                _log_security(conn, "webhook_rejected", email="", ip=self._client_ip(), detail="source=paystack")
                conn.commit()
                conn.close()
                return self._json({"error": "unauthorized"}, 401)
            d = data.get("data") or {}
            email = str((d.get("customer") or {}).get("email") or d.get("email") or "").lower()
            order_id = str(d.get("reference") or "")[:120] or None
            event = str(data.get("event") or "")
            ignore_reason = None
            if event and "refund" in event.lower():
                ignore_reason = "refund event - not a sale"
            elif event and event.lower() != "charge.success":
                ignore_reason = f"unhandled event: {event[:60]}"
            else:
                meta = d.get("metadata") or {}
                product = str(meta.get("product_name") or meta.get("product") or d.get("product_name") or "")
                if product and not re.search(r"soft\s*life", product, re.I):
                    ignore_reason = f"other product: {product[:80]}"
            if ignore_reason:
                conn = db()
                _log_webhook(conn, "ignored", data, order_id, email, error=ignore_reason)
                conn.commit()
                conn.close()
                return self._json({"ok": True, "received": True, "ignored": True})
            try:
                amount = float(d.get("amount")) / 100 if d.get("amount") else 0.0
            except (TypeError, ValueError):
                amount = 0.0
            payload = {
                "email": email, "order_id": order_id, "amount": amount,
                "currency": str(d.get("currency") or "").upper() or None,
                "provider": "paystack",
            }
            conn = db()
            try:
                status, response = _process_purchase(conn, payload, self._origin())
                conn.commit()
                return self._json(response, 200 if status != "invalid" else 400)
            except Exception as exc:
                conn.rollback()
                _log_webhook(conn, "failed", data, order_id, email, error=str(exc)[:500])
                conn.commit()
                return self._json({"error": "webhook processing failed"}, 500)
            finally:
                conn.close()

        if route == "/api/track":
            event = clean_text(data.get("event"), 60)
            if event not in ("page_view", "checkout_click") or event not in EVENT_NAMES:
                return self._json({"error": "unknown event"}, 400)
            path = clean_text(data.get("path"), 200)
            if not path.startswith("/") or path.startswith("//"):
                return self._json({"error": "bad path"}, 400)
            ip = self._client_ip()
            if not _track_allow(ip):
                conn = db()
                _log_security(conn, "track_rate_limited", ip=ip)
                conn.commit()
                conn.close()
                return self._json({"error": "slow down"}, 429)
            meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
            clean_meta = {"referrer": clean_text(meta.get("referrer"), 300)}
            for key in ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"):
                if meta.get(key):
                    clean_meta[key] = clean_text(meta.get(key), 100)
            conn = db()
            _log_track(conn, event, path, clean_meta)
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        # Public: anonymous referral clicks must count before any account exists.
        # One row per ref code per day so click stats stay honest.
        if route == "/api/ref-visit":
            ref = clean_text(data.get("ref"), 24).upper()
            if not ref:
                return self._json({"error": "ref required"}, 400)
            ip = self._client_ip()
            if not _track_allow(ip):
                conn = db()
                _log_security(conn, "track_rate_limited", ip=ip)
                conn.commit()
                conn.close()
                return self._json({"error": "slow down"}, 429)
            conn = db()
            seen = conn.execute(
                "SELECT 1 FROM referrals WHERE ref_code = ? AND status = 'clicked' "
                "AND created_at >= datetime('now', '-1 day') LIMIT 1",
                (ref,),
            ).fetchone()
            if not seen:
                conn.execute(
                    "INSERT INTO referrals (ref_code, email, status) VALUES (?, NULL, 'clicked')",
                    (ref,),
                )
                conn.commit()
            conn.close()
            return self._json({"ok": True})

        if route == "/api/signup":
            email = (data.get("email") or "").strip().lower()
            password = data.get("password") or ""
            name = (data.get("name") or "").strip()
            ref = (data.get("ref") or "").strip().upper()
            if not email or "@" not in email or len(password) < 8:
                return self._json({"error": "Valid email and 8+ character password required."}, 400)
            conn = db()
            if conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
                conn.close()
                return self._json({"error": "That email is already registered. Sign in instead."}, 409)
            salt = secrets.token_hex(8)
            ref_code = "SL" + secrets.token_hex(3).upper()
            # A buyer may create their account after paying (stranger-buy flow):
            # if a purchase already exists for this email, start them on that tier.
            paid = conn.execute(
                "SELECT tier FROM purchases WHERE lower(email) = ? AND tier != 'free' ORDER BY id DESC LIMIT 1",
                (email,),
            ).fetchone()
            tier = paid["tier"] if paid else "free"
            consent = 0 if data.get("marketing_consent") == 0 else 1
            unsub_token = secrets.token_hex(16)
            cur = conn.execute(
                "INSERT INTO users (email, name, password_hash, salt, tier, ref_code, referred_by, marketing_consent, unsub_token) VALUES (?,?,?,?,?,?,?,?,?)",
                (email, name or email.split("@")[0].title(), _hash(password, salt), salt, tier, ref_code, ref or None, consent, unsub_token),
            )
            uid = cur.lastrowid
            if paid:
                conn.execute(
                    "UPDATE purchase_claims SET completed_at = datetime('now') WHERE lower(email) = ? AND completed_at IS NULL",
                    (email,),
                )
            acquisition = clean_acquisition(data.get("acquisition"), "referral" if ref else "direct")
            save_onboarding_row(conn, uid, {}, acquisition)
            log_event(conn, uid, "signup", "/signup", {"ref": ref or None, "source": acquisition["source"]})
            if ref:
                conn.execute("INSERT INTO referrals (ref_code, email, status) VALUES (?,?, 'signed_up')", (ref, email))
            for week, title, detail in LAUNCH_TASKS:
                conn.execute(
                    "INSERT INTO tasks (user_id, title, detail, week, kind) VALUES (?,?,?,?, 'launch')",
                    (uid, title, detail, week),
                )
            conn.commit()
            row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            conn.close()
            return self._json(self._authed(row), 201)

        if route == "/api/signin":
            email = (data.get("email") or "").strip().lower()
            password = data.get("password") or ""
            conn = db()
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if not row or _hash(password, row["salt"]) != row["password_hash"]:
                if not row:
                    bought = conn.execute(
                        "SELECT 1 FROM purchases WHERE lower(email) = ? LIMIT 1", (email,)
                    ).fetchone()
                    claimed = conn.execute(
                        "SELECT 1 FROM purchase_claims WHERE lower(email) = ? AND completed_at IS NULL LIMIT 1", (email,)
                    ).fetchone()
                    if bought or claimed:
                        _log_security(conn, "member_login_failed", email=email, ip=self._client_ip(),
                                      detail="purchased but no account yet")
                        conn.commit()
                        conn.close()
                        return self._json({
                            "error": "We found your purchase, but this email has no login yet. Use the access link from your receipt, or create your account on the sign-up page — your purchase unlocks automatically.",
                        }, 401)
                _log_security(conn, "member_login_failed", email=email, ip=self._client_ip())
                conn.commit()
                conn.close()
                return self._json({"error": "Wrong email or password."}, 401)
            log_event(conn, row["id"], "signin", "/signin", {})
            conn.commit()
            conn.close()
            return self._json(self._authed(row))

        if route == "/api/forgot-password":
            email = (data.get("email") or "").strip().lower()
            if not email or "@" not in email:
                return self._json({"error": "A valid email is required."}, 400)
            # Anti-enumeration: the response is identical whether or not the account exists.
            conn = db()
            user = conn.execute("SELECT id FROM users WHERE lower(email) = ?", (email,)).fetchone()
            if user:
                token = secrets.token_hex(32)
                conn.execute("DELETE FROM password_resets WHERE expires_at <= datetime('now')")
                conn.execute(
                    "INSERT INTO password_resets (token_hash, user_id, expires_at) "
                    "VALUES (?,?,datetime('now','+60 minutes'))",
                    (_token_hash(token), user["id"]),
                )
                link = SITE_URL + "/#/reset?token=" + token
                # _send_email never raises; email failures must not break this endpoint.
                _send_email(conn, email, "Reset your Soft Life System password",
                            _reset_email_html(link), "password_reset")
                log_event(conn, user["id"], "password_reset_requested", "/forgot", {})
            else:
                time.sleep(0.3)
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        if route == "/api/reset-password":
            token = str(data.get("token") or "").strip()
            password = str(data.get("password") or "")
            if len(password) < 8:
                return self._json({"error": "Password needs at least 8 characters."}, 400)
            if not token:
                return self._json({"error": "This reset link is invalid or expired."}, 400)
            conn = db()
            row = conn.execute(
                "SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > datetime('now')",
                (_token_hash(token),),
            ).fetchone()
            if not row:
                conn.close()
                return self._json({"error": "This reset link is invalid or expired."}, 400)
            salt = secrets.token_hex(16)
            conn.execute(
                "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
                (_hash(password, salt), salt, row["user_id"]),
            )
            conn.execute("DELETE FROM password_resets WHERE user_id = ?", (row["user_id"],))
            log_event(conn, row["user_id"], "password_reset_completed", "/reset", {})
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        if route == "/api/claim/preview":
            token = str(data.get("token") or "")
            conn = db()
            if token:
                claim = conn.execute(
                    "SELECT email, tier FROM purchase_claims WHERE token = ? AND completed_at IS NULL "
                    "AND created_at >= datetime('now', '-30 days')", (token,),
                ).fetchone()
                conn.close()
                if not claim:
                    return self._json({"error": "This access link is invalid, already used, or expired."}, 404)
                return self._json({"email": claim["email"], "tier": claim["tier"]})
            # Manual verify: email + order ID from the payment receipt.
            email = str(data.get("email") or "").strip().lower()
            order_id = str(data.get("order_id") or "").strip()
            conn.close()
            if "@" not in email or not order_id:
                return self._json({"error": "Enter the email you paid with and your order ID from the receipt."}, 400)
            conn = db()
            claimed = conn.execute(
                "SELECT id FROM purchase_claims WHERE lower(email) = ? AND order_id = ? AND completed_at IS NOT NULL LIMIT 1",
                (email, order_id),
            ).fetchone()
            if claimed:
                conn.close()
                return self._json({"error": "This purchase is already unlocked. Please sign in instead."}, 400)
            purchase = conn.execute(
                "SELECT tier FROM purchases WHERE lower(email) = ? AND order_id = ? LIMIT 1",
                (email, order_id),
            ).fetchone()
            if not purchase:
                _log_security(conn, "claim_manual_miss", email=email, ip=self._client_ip(), detail=f"order_id={order_id}")
                conn.commit()
                conn.close()
                return self._json({"error": "We haven't received your payment confirmation yet. Give it a few minutes and try again — if it still fails, email admin@gabochie.com with your receipt."}, 404)
            existing = conn.execute(
                "SELECT token FROM purchase_claims WHERE lower(email) = ? AND order_id = ? AND completed_at IS NULL "
                "AND created_at >= datetime('now', '-30 days') LIMIT 1",
                (email, order_id),
            ).fetchone()
            if existing:
                claim_token = existing["token"]
            else:
                claim_token = secrets.token_hex(16)
                conn.execute(
                    "INSERT INTO purchase_claims (email, token, order_id, tier) VALUES (?,?,?,?)",
                    (email, claim_token, order_id, purchase["tier"]),
                )
            _log_security(conn, "claim_manual_verified", email=email, ip=self._client_ip(), detail=f"order_id={order_id}")
            conn.commit()
            conn.close()
            return self._json({"email": email, "tier": purchase["tier"], "token": claim_token})

        if route == "/api/claim/complete":
            token = str(data.get("token") or "")
            name = clean_text(data.get("name"), 80)
            password = str(data.get("password") or "")
            if len(password) < 8:
                return self._json({"error": "Password needs at least 8 characters."}, 400)
            conn = db()
            claim = conn.execute(
                "SELECT * FROM purchase_claims WHERE token = ? AND completed_at IS NULL "
                "AND created_at >= datetime('now', '-30 days')", (token,),
            ).fetchone()
            if not claim:
                conn.close()
                return self._json({"error": "This access link is invalid, already used, or expired."}, 404)
            email = claim["email"]
            existing = conn.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()
            if existing:
                conn.execute("UPDATE users SET tier = ? WHERE id = ?", (claim["tier"], existing["id"]))
                conn.execute("UPDATE purchase_claims SET completed_at = datetime('now') WHERE id = ?", (claim["id"],))
                conn.commit()
                conn.close()
                return self._json({"ok": True, "upgraded_existing": True})
            salt = secrets.token_hex(8)
            cur = conn.execute(
                "INSERT INTO users (email, name, password_hash, salt, tier, ref_code) VALUES (?,?,?,?,?,?)",
                (email, name or email.split("@")[0].title(), _hash(password, salt), salt, claim["tier"], "SL" + secrets.token_hex(3).upper()),
            )
            uid = cur.lastrowid
            save_onboarding_row(conn, uid, {}, clean_acquisition(None, "purchase"))
            log_event(conn, uid, "signup", "/claim", {"source": "purchase"})
            for week, title, detail in LAUNCH_TASKS:
                conn.execute(
                    "INSERT INTO tasks (user_id, title, detail, week, kind) VALUES (?,?,?,?, 'launch')",
                    (uid, title, detail, week),
                )
            conn.execute("UPDATE purchase_claims SET completed_at = datetime('now') WHERE id = ?", (claim["id"],))
            conn.commit()
            row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            conn.close()
            return self._json(self._authed(row), 201)

        if route == "/api/signout":
            conn = db()
            token = self.headers.get("Authorization", "")[7:]
            if token:
                conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        if route == "/api/admin/login":
            if not ADMIN_PASSWORD:
                return self._json({"error": "Admin login is not configured."}, 503)
            password = str(data.get("password") or "")
            if not secrets.compare_digest(password, ADMIN_PASSWORD):
                time.sleep(0.4)
                conn = db()
                _log_security(conn, "admin_login_failed", ip=self._client_ip())
                conn.commit()
                conn.close()
                return self._json({"error": "Wrong admin password."}, 401)
            token = secrets.token_hex(32)
            conn = db()
            conn.execute("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')")
            conn.execute(
                "INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, datetime('now', ?))",
                (_token_hash(token), f"+{ADMIN_SESSION_HOURS} hours"),
            )
            conn.commit()
            conn.close()
            return self._json({
                "token": token,
                "role": "superadmin",
                "expires_at": datetime.fromtimestamp(
                    datetime.now(timezone.utc).timestamp() + ADMIN_SESSION_HOURS * 3600,
                    timezone.utc,
                ).isoformat(),
            })

        if route == "/api/staff/login":
            email = clean_text(data.get("email"), 120).lower()
            password = str(data.get("password") or "")
            conn = db()
            row = conn.execute(
                "SELECT * FROM staff_users WHERE lower(email) = ? AND active = 1", (email,)
            ).fetchone()
            if not row or _hash(password, row["salt"]) != row["password_hash"]:
                conn.close()
                time.sleep(0.4)
                conn = db()
                _log_security(conn, "staff_login_failed", email=email, ip=self._client_ip())
                conn.commit()
                conn.close()
                return self._json({"error": "Wrong email or password."}, 401)
            token = secrets.token_hex(32)
            conn.execute("DELETE FROM staff_sessions WHERE expires_at <= datetime('now')")
            conn.execute(
                "INSERT INTO staff_sessions (token_hash, staff_id, expires_at) "
                "VALUES (?, ?, datetime('now', ?))",
                (_token_hash(token), row["id"], f"+{ADMIN_SESSION_HOURS} hours"),
            )
            conn.commit()
            conn.close()
            return self._json({
                "token": token,
                "role": row["role"],
                "name": row["name"],
                "expires_at": datetime.fromtimestamp(
                    datetime.now(timezone.utc).timestamp() + ADMIN_SESSION_HOURS * 3600,
                    timezone.utc,
                ).isoformat(),
            })

        if route == "/api/admin/logout":
            token = self.headers.get("Authorization", "")[7:]
            conn = db()
            if token:
                th = _token_hash(token)
                conn.execute("DELETE FROM admin_sessions WHERE token_hash = ?", (th,))
                conn.execute("DELETE FROM staff_sessions WHERE token_hash = ?", (th,))
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        if route.startswith("/api/admin/"):
            auth = self._admin_auth()
            if not auth:
                return self._json({"error": "unauthorized"}, 401)
            if not self._allowed(auth[0], route):
                return self._json({"error": "not allowed for your role"}, 403)
            tier_match = re.match(r"^/api/admin/users/(\d+)/tier$", route)
            role_match = re.match(r"^/api/admin/users/(\d+)/role$", route)
            if not tier_match and not role_match:
                crm_stage = re.match(r"^/api/admin/crm/stage$", route)
                crm_note = re.match(r"^/api/admin/crm/notes$", route)
                team_add = re.match(r"^/api/admin/team$", route)
                team_active = re.match(r"^/api/admin/team/(\d+)/active$", route)
                team_role = re.match(r"^/api/admin/team/(\d+)/role$", route)
                webhook_replay = re.match(r"^/api/admin/webhooks/replay$", route)
                email_campaign = re.match(r"^/api/admin/email/campaigns$", route)
                email_sequences = re.match(r"^/api/admin/email/sequences$", route)
                if not any([crm_stage, crm_note, team_add, team_active, team_role, webhook_replay,
                            email_campaign, email_sequences]):
                    return self._json({"error": "not found"}, 404)
                conn = db()
                if email_campaign:
                    subject = clean_text(data.get("subject") or "", 120)
                    segment = data.get("segment") or ""
                    body_text = str(data.get("body") or "").strip()
                    if not subject or segment not in ("all", "free", "paid", "inactive") or len(body_text) < 20:
                        conn.close()
                        return self._json({"error": "subject, valid segment and a message of at least 20 characters are required"}, 400)
                    esc = (body_text[:8000].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
                    body_html = "".join("<p>" + p.replace("\n", "<br>") + "</p>" for p in re.split(r"\n{2,}", esc))
                    where = {
                        "all": "marketing_consent = 1",
                        "free": "tier = 'free' AND marketing_consent = 1",
                        "paid": "tier != 'free' AND marketing_consent = 1",
                        "inactive": ("marketing_consent = 1 AND NOT EXISTS (SELECT 1 FROM sessions s"
                                     " WHERE s.user_id = users.id AND s.created_at >= datetime('now', '-14 days'))"),
                    }[segment]
                    people = conn.execute(
                        f"SELECT id, email, unsub_token FROM users WHERE {where}"
                    ).fetchall()
                    people = [p for p in people if p["email"]]
                    if not people:
                        conn.close()
                        return self._json({"error": "no recipients in that segment"}, 400)
                    origin = self._origin()
                    cur = conn.execute(
                        "INSERT INTO email_campaigns (subject, segment, body_html, body_text, recipients, created_by)"
                        " VALUES (?,?,?,?,?,?)",
                        (subject, segment, body_html, body_text[:8000], len(people), auth[1]),
                    )
                    campaign_id = cur.lastrowid
                    sent = failed = 0
                    for p in people:
                        token = p["unsub_token"]
                        if not token:
                            token = secrets.token_hex(16)
                            conn.execute("UPDATE users SET unsub_token = ? WHERE id = ?", (token, p["id"]))
                        html = ('<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2a0f4a;">'
                                f'<h2 style="color:#5d2189;margin:0 0 12px;">{_escape_html(subject)}</h2>'
                                f'<div style="font-size:15px;line-height:1.6;">{body_html}</div>'
                                '<p style="font-size:12px;color:#6d5f7a;margin-top:28px;">You receive this because you have a Soft Life account. '
                                f'<a href="{origin}/api/unsubscribe?token={token}" style="color:#6d5f7a;">Unsubscribe</a></p>'
                                '<p style="font-size:12px;color:#6d5f7a;">The Soft Life System · Gabochie Books</p></div>')
                        if _send_email(conn, p["email"], subject, html, f"campaign:{campaign_id}", body_text[:8000]):
                            sent += 1
                        else:
                            failed += 1
                    conn.execute("UPDATE email_campaigns SET sent = ?, failed = ? WHERE id = ?", (sent, failed, campaign_id))
                    conn.commit()
                    conn.close()
                    return self._json({"ok": True, "campaign_id": campaign_id, "recipients": len(people), "sent": sent, "failed": failed})
                if email_sequences:
                    summary = _run_email_sequences(conn, self._origin())
                    conn.commit()
                    conn.close()
                    return self._json({"ok": True, "summary": summary})
                if webhook_replay:
                    try:
                        wid = int(data.get("id") or 0)
                    except (TypeError, ValueError):
                        wid = 0
                    row = conn.execute("SELECT id, payload FROM webhook_logs WHERE id = ?", (wid,)).fetchone()
                    if not row:
                        conn.close()
                        return self._json({"error": "not found"}, 404)
                    try:
                        payload = json.loads(row["payload"] or "{}")
                    except json.JSONDecodeError:
                        payload = {}
                    try:
                        status, response = _process_purchase(conn, payload, self._origin())
                        conn.commit()
                        self._audit(conn, "webhook_replayed", f"webhook:{wid}", {"result": status})
                        conn.commit()
                        conn.close()
                        return self._json({"ok": True, "status": status, **response})
                    except Exception as exc:
                        conn.rollback()
                        _log_webhook(conn, "failed", payload, None, None, error=f"replay: {str(exc)[:400]}")
                        conn.commit()
                        conn.close()
                        return self._json({"error": "replay failed"}, 500)
                if team_add:
                    email = clean_text(data.get("email"), 120).lower()
                    name = clean_text(data.get("name"), 80)
                    role = str(data.get("role") or "")
                    password = str(data.get("password") or "")
                    if not email or "@" not in email:
                        conn.close()
                        return self._json({"error": "A valid email is required."}, 400)
                    if role not in STAFF_ROLES or role == "superadmin":
                        conn.close()
                        return self._json({"error": "Pick a staff role: sales, support or content."}, 400)
                    if len(password) < 8:
                        conn.close()
                        return self._json({"error": "Password needs at least 8 characters."}, 400)
                    if conn.execute("SELECT 1 FROM staff_users WHERE lower(email) = ?", (email,)).fetchone():
                        conn.close()
                        return self._json({"error": "That email already has a staff account."}, 409)
                    salt = secrets.token_hex(16)
                    cur = conn.execute(
                        "INSERT INTO staff_users (email, name, password_hash, salt, role) VALUES (?,?,?,?,?)",
                        (email, name, _hash(password, salt), salt, role),
                    )
                    self._audit(conn, "staff_added", f"staff:{cur.lastrowid}", {"email": email, "role": role})
                    conn.commit()
                    row = conn.execute(
                        "SELECT id, email, name, role, active, created_at FROM staff_users WHERE id = ?",
                        (cur.lastrowid,),
                    ).fetchone()
                    conn.close()
                    return self._json({"staff": dict(row)})
                if team_active or team_role:
                    sid = int((team_active or team_role).group(1))
                    exists = conn.execute("SELECT id FROM staff_users WHERE id = ?", (sid,)).fetchone()
                    if not exists:
                        conn.close()
                        return self._json({"error": "not found"}, 404)
                    if team_active:
                        active = 1 if data.get("active") in (True, 1, "1", "true") else 0
                        conn.execute("UPDATE staff_users SET active = ? WHERE id = ?", (active, sid))
                        if not active:
                            conn.execute(
                                "DELETE FROM staff_sessions WHERE staff_id = ? AND expires_at > datetime('now')",
                                (sid,),
                            )
                        self._audit(conn, "staff_active" if active else "staff_deactivated", f"staff:{sid}", {})
                    else:
                        role = str(data.get("role") or "")
                        if role not in STAFF_ROLES or role == "superadmin":
                            conn.close()
                            return self._json({"error": "Pick a staff role: sales, support or content."}, 400)
                        conn.execute("UPDATE staff_users SET role = ? WHERE id = ?", (role, sid))
                        self._audit(conn, "staff_role", f"staff:{sid}", {"role": role})
                    row = conn.execute(
                        "SELECT id, email, name, role, active, created_at FROM staff_users WHERE id = ?",
                        (sid,),
                    ).fetchone()
                    conn.commit()
                    conn.close()
                    return self._json({"staff": dict(row)})
                conn = db()
                try:
                    uid = int(data.get("user_id") or 0)
                except (TypeError, ValueError):
                    uid = 0
                exists = conn.execute("SELECT 1 FROM users WHERE id = ?", (uid,)).fetchone()
                if not exists:
                    conn.close()
                    return self._json({"error": "not found"}, 404)
                if crm_stage:
                    stage = str(data.get("stage") or "")
                    if stage not in CRM_STAGES:
                        conn.close()
                        return self._json({"error": "invalid stage"}, 400)
                    conn.execute(
                        "INSERT INTO crm_pipeline (user_id, stage, updated_by, updated_at) "
                        "VALUES (?, ?, 'superadmin', datetime('now')) "
                        "ON CONFLICT(user_id) DO UPDATE SET stage = excluded.stage, "
                        "updated_by = excluded.updated_by, updated_at = excluded.updated_at",
                        (uid, stage),
                    )
                    self._audit(conn, "crm_stage", f"user:{uid}", {"stage": stage})
                else:
                    note = clean_text(data.get("note"), 1000)
                    if not note:
                        conn.close()
                        return self._json({"error": "Note is empty."}, 400)
                    conn.execute(
                        "INSERT INTO crm_notes (user_id, note, author) VALUES (?, ?, 'superadmin')",
                        (uid, note),
                    )
                    self._audit(conn, "crm_note", f"user:{uid}", {"chars": len(note)})
                conn.commit()
                conn.close()
                return self._json({"ok": True})
            conn = db()
            if tier_match:
                tier = str(data.get("tier") or "")
                if tier not in ("free", "complete"):
                    conn.close()
                    return self._json({"error": "invalid tier"}, 400)
                conn.execute("UPDATE users SET tier = ? WHERE id = ?", (tier, int(tier_match.group(1))))
            else:
                role = str(data.get("role") or "")
                if role not in ("member", "admin", "superadmin"):
                    conn.close()
                    return self._json({"error": "invalid role"}, 400)
                conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, int(role_match.group(1))))
            self._audit(conn, "tier" if tier_match else "role", f"user:{int((tier_match or role_match).group(1))}",
                        {"value": tier if tier_match else role})
            row = conn.execute(
                "SELECT id, email, name, tier, role FROM users WHERE id = ?",
                (int((tier_match or role_match).group(1)),),
            ).fetchone()
            conn.commit()
            conn.close()
            if not row:
                return self._json({"error": "not found"}, 404)
            return self._json({"user": dict(row)})

        user = self._user()
        if not user:
            return self._json({"error": "unauthorized"}, 401)

        if route == "/api/change-password":
            current = str(data.get("current_password") or "")
            new = str(data.get("new_password") or "")
            if len(new) < 8:
                return self._json({"error": "New password needs at least 8 characters."}, 400)
            if _hash(current, user["salt"]) != user["password_hash"]:
                conn = db()
                _log_security(conn, "password_change_failed", email=user["email"], ip=self._client_ip())
                conn.commit()
                conn.close()
                return self._json({"error": "Your current password is wrong."}, 401)
            salt = secrets.token_hex(8)
            conn = db()
            conn.execute("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (_hash(new, salt), salt, user["id"]))
            log_event(conn, user["id"], "password_changed", "/account", {})
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        if route == "/api/audio-token":
            token = secrets.token_hex(24)
            conn = db()
            conn.execute("DELETE FROM audio_tokens WHERE expires_at <= datetime('now')")
            conn.execute(
                "INSERT INTO audio_tokens (token_hash, user_id, expires_at) "
                "VALUES (?, ?, datetime('now', ?))",
                (_token_hash(token), user["id"], f"+{AUDIO_TOKEN_MINUTES} minutes"),
            )
            conn.commit()
            conn.close()
            return self._json({
                "token": token,
                "expires_in": AUDIO_TOKEN_MINUTES * 60,
                "expires_at": datetime.fromtimestamp(
                    datetime.now(timezone.utc).timestamp() + AUDIO_TOKEN_MINUTES * 60,
                    timezone.utc,
                ).isoformat(),
            })

        if route == "/api/onboarding":
            conn = db()
            existing = load_onboarding(conn, user["id"])
            has_consent = "whatsapp_consent" in data
            next_consent = truthy(data.get("whatsapp_consent")) if has_consent else bool(existing and existing["whatsapp_consent"])
            next_phone = normalize_phone(
                data.get("whatsapp_number") if "whatsapp_number" in data
                else (existing["whatsapp_number"] if existing else "")
            )
            if next_consent and not next_phone:
                conn.close()
                return self._json(
                    {"error": "Add a valid WhatsApp number with country code, or uncheck the community box."},
                    400,
                )
            if has_consent:
                data["whatsapp_number"] = next_phone if next_consent else ""
            before = dict(existing) if existing else {}
            acquisition = clean_acquisition(data.get("acquisition"), (before.get("source") or "direct"))
            row = save_onboarding_row(conn, user["id"], data, acquisition)
            if not before.get("completed_at") and row["completed_at"]:
                log_event(conn, user["id"], "onboarding_completed", "/onboarding", {})
            else:
                log_event(conn, user["id"], "onboarding_saved", "/onboarding", {})
            if int(before.get("whatsapp_consent") or 0) != int(row["whatsapp_consent"] or 0):
                log_event(
                    conn, user["id"],
                    "whatsapp_consent_granted" if row["whatsapp_consent"] else "whatsapp_consent_withdrawn",
                    "/onboarding", {"consent_version": CONSENT_VERSION},
                )
            conn.commit()
            conn.close()
            return self._json({"onboarding": dict(row)})

        if route == "/api/events":
            event = clean_text(data.get("event"), 60)
            if event not in EVENT_NAMES:
                return self._json({"error": "unknown event"}, 400)
            conn = db()
            log_event(
                conn, user["id"], event, clean_text(data.get("path"), 200),
                data.get("meta") if isinstance(data.get("meta"), dict) else {},
            )
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        if route == "/api/tasks":
            title = (data.get("title") or "").strip()
            week = data.get("week") or 1
            if not title:
                return self._json({"error": "Task needs a title."}, 400)
            conn = db()
            cur = conn.execute(
                "INSERT INTO tasks (user_id, title, detail, week, kind) VALUES (?,?,?,?, 'custom')",
                (user["id"], title, (data.get("detail") or "").strip(), int(week)),
            )
            log_event(conn, user["id"], "task_added", "/tasks", {"task_id": cur.lastrowid})
            conn.commit()
            row = conn.execute("SELECT id, title, detail, week, kind, done FROM tasks WHERE id = ?", (cur.lastrowid,)).fetchone()
            conn.close()
            return self._json({"task": dict(row)}, 201)

        if route == "/api/tasks/toggle":
            tid = data.get("id")
            conn = db()
            cur = conn.execute(
                "UPDATE tasks SET done = 1 - done WHERE id = ? AND user_id = ? RETURNING id, title, detail, week, kind, done",
                (tid, user["id"]),
            )
            row = cur.fetchone()
            if row and row["done"] == 1:
                log_event(conn, user["id"], "task_completed", "/tasks", {"task_id": row["id"], "kind": row["kind"]})
            conn.commit()
            conn.close()
            if not row:
                return self._json({"error": "not found"}, 404)
            return self._json({"task": dict(row)})

        return self._json({"error": "not found"}, 404)

    def do_PATCH(self):
        return self.do_POST()

    # ---------- helpers ----------

    def _serve_audio(self, slug: str) -> None:
        """Gated member audio: auth (header or ?t=), tier check, Range/seek support."""
        user = self._user() or self._audio_user()
        if not user:
            return self._json({"error": "unauthorized"}, 401)
        if not re.fullmatch(r"[a-z0-9-]+", slug or ""):
            return self._json({"error": "not found"}, 404)
        f = AUDIO_DIR / (slug + ".mp3")
        if not f.is_file():
            return self._json({"error": "not found"}, 404)
        if user["tier"] == "free" and slug not in FREE_AUDIO:
            return self._json({"error": "locked — included with the full book"}, 403)
        size = f.stat().st_size
        start, end, partial = 0, size - 1, False
        rng = self.headers.get("Range", "")
        if rng.startswith("bytes="):
            a, _, b = rng[6:].partition("-")
            if a:
                start = max(0, min(int(a), size - 1))
                if b:
                    end = max(start, min(int(b), size - 1))
                partial = start > 0 or end < size - 1
        length = end - start + 1
        self.send_response(206 if partial else 200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store")
        if partial:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(length))
        self.end_headers()
        with open(f, "rb") as fh:
            fh.seek(start)
            remaining = length
            while remaining > 0:
                chunk = fh.read(min(65536, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)

    def _me(self, user: sqlite3.Row) -> dict:
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "tier": user["tier"],
            "ref_code": user["ref_code"],
        }

    def _authed(self, user: sqlite3.Row) -> dict:
        token = secrets.token_hex(24)
        conn = db()
        conn.execute("DELETE FROM sessions WHERE expires_at <= datetime('now')")
        conn.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?, datetime('now', ?))",
            (_token_hash(token), user["id"], f"+{SESSION_DAYS} days"),
        )
        conn.commit()
        conn.close()
        return {"token": token, "user": self._me(user)}


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8100
    init_db()
    try:
        print(f"Soft Life dev server → http://localhost:{port}  (demo: {SEED_EMAIL} / {SEED_PASSWORD}  ·  admin: {ADMIN_PASSWORD})")
    except UnicodeEncodeError:
        # Windows consoles often use cp1252, which can't encode "→".
        print(f"Soft Life dev server -> http://localhost:{port}  (demo: {SEED_EMAIL} / {SEED_PASSWORD}  -  admin: {ADMIN_PASSWORD})")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
