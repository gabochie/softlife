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
import secrets
import sqlite3
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
DB = APP / "server" / "softlife.db"
STATIC = APP / "app"
SEED_EMAIL = "demo@softlife.app"
SEED_PASSWORD = "demo1234"

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


def init_db() -> None:
    first = not DB.exists()
    conn = db()
    if first:
        conn.executescript((APP / "server" / "schema.sql").read_text())
        _seed(conn)
    conn.close()


def _hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()


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

    def _user(self) -> sqlite3.Row | None:
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        conn = db()
        row = conn.execute(
            "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
            (auth[7:],),
        ).fetchone()
        conn.close()
        return row

    # ---------- API ----------

    def do_GET(self):
        if not self.path.startswith("/api/"):
            return super().do_GET()
        route = self.path.split("?")[0]
        user = self._user()
        if route == "/api/me":
            if not user:
                return self._json({"error": "unauthorized"}, 401)
            return self._json(self._me(user))
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
                "commission_rate": "50%",
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
            if ref:
                conn.execute("INSERT INTO referrals (ref_code, email, status) VALUES (?,?, 'signed_up')", (ref, email))
            uid = cur.lastrowid
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
            conn.close()
            if not row or _hash(password, row["salt"]) != row["password_hash"]:
                return self._json({"error": "Wrong email or password."}, 401)
            return self._json(self._authed(row))

        if route == "/api/signout":
            conn = db()
            conn.execute("DELETE FROM sessions WHERE token = ?", (self.headers.get("Authorization", "")[7:],))
            conn.commit()
            conn.close()
            return self._json({"ok": True})

        user = self._user()
        if not user:
            return self._json({"error": "unauthorized"}, 401)

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
            conn.commit()
            conn.close()
            if not row:
                return self._json({"error": "not found"}, 404)
            return self._json({"task": dict(row)})

        return self._json({"error": "not found"}, 404)

    def do_PATCH(self):
        return self.do_POST()

    # ---------- helpers ----------

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
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?,?)", (token, user["id"]))
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
