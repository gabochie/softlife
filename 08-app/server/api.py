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
import json
import os
import re
import secrets
import sqlite3
import sys
import urllib.parse
from datetime import datetime, timezone
from http.server import HTTPServer, SimpleHTTPRequestHandler
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
    "task_added", "task_completed", "audio_play", "checkout_click",
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


def init_db() -> None:
    first = not DB.exists()
    conn = db()
    conn.executescript((APP / "server" / "schema.sql").read_text())
    _migrate_session_tables(conn)
    if first:
        _seed(conn)
    conn.close()


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

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            return {}

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
        if route == "/api/config":
            host = self.headers.get("Host") or "127.0.0.1:8100"
            return self._json({
                "siteUrl": f"http://{host}",
                "checkoutUrl": os.environ.get("CHECKOUT_URL", ""),
                "selarUrl": os.environ.get("SELAR_CHECKOUT_URL", os.environ.get("CHECKOUT_URL", "")),
                "payhipUrl": os.environ.get("PAYHIP_CHECKOUT_URL", ""),
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
            clicks = conn.execute(
                "SELECT COUNT(*) c FROM referrals WHERE ref_code = ?", (user["ref_code"],)
            ).fetchone()["c"]
            signups = conn.execute(
                "SELECT COUNT(*) c FROM referrals WHERE ref_code = ? AND status = 'signed_up'",
                (user["ref_code"],),
            ).fetchone()["c"]
            conn.close()
            return self._json({
                "ref_code": user["ref_code"],
                "clicks": clicks,
                "signups": signups,
                "commission_rate": "30%",
                "payout_note": "Payouts run monthly via Selar mobile money (MVP: manual review).",
            })
        return self._json({"error": "not found"}, 404)

    def do_POST(self):
        if not self.path.startswith("/api/"):
            return self._json({"error": "not found"}, 404)
        route = self.path.split("?")[0]
        data = self._body()

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
            cur = conn.execute(
                "INSERT INTO users (email, name, password_hash, salt, tier, ref_code, referred_by) VALUES (?,?,?,?,?,?,?)",
                (email, name or email.split("@")[0].title(), _hash(password, salt), salt, "free", ref_code, ref or None),
            )
            uid = cur.lastrowid
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
                conn.close()
                return self._json({"error": "Wrong email or password."}, 401)
            log_event(conn, row["id"], "signin", "/signin", {})
            conn.commit()
            conn.close()
            return self._json(self._authed(row))

        if route == "/api/signout":
            conn = db()
            token = self.headers.get("Authorization", "")[7:]
            if token:
                conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        user = self._user()
        if not user:
            return self._json({"error": "unauthorized"}, 401)

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
    print(f"Soft Life dev server → http://localhost:{port}  (demo: {SEED_EMAIL} / {SEED_PASSWORD})")
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
