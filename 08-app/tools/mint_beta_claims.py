#!/usr/bin/env python3
"""Mint beta-access claim links for Soft Life testers.

Creates rows in softlife_purchase_claims (the exact table buyers' claims live in)
with tier 'free' (trial), then prints one single-use access link per tester plus a
ready-to-paste WhatsApp/email invite. Beta links expire in 14 days; paid claim links keep 30 days.

Usage:
  python tools/mint_beta_claims.py tools/beta_testers.txt            # production
  python tools/mint_beta_claims.py tools/beta_testers.txt --local    # local dev DB

Input file: one tester per line. Email required, optional name after a comma:
  amara@example.com, Amara Okafor
  tunde@example.com

Re-running is safe: it only ever touches rows it created (order_id LIKE 'BETA-%').
"""
from __future__ import annotations

import json
import re
import secrets
import sqlite3
import subprocess
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
DEV_DB = APP / "server" / "softlife.db"
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")
SITE = {"remote": "https://soft.gabochie.com", "local": "http://localhost:8100"}


def load_testers(path: Path):
    testers = []
    for line_no, raw in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split(",")]
        email = parts[0].lower()
        name = parts[1] if len(parts) > 1 else ""
        if not EMAIL_RE.match(email):
            sys.exit(f"Line {line_no}: not a valid email: {email!r}")
        testers.append({"email": email, "name": name})
    return testers


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def mint_local(testers):
    conn = sqlite3.connect(DEV_DB)
    for i, t in enumerate(testers, 1):
        t["token"] = secrets.token_hex(16)
        t["order"] = f"BETA-{i:02d}"
        conn.execute(
            "DELETE FROM purchase_claims WHERE lower(email)=? AND completed_at IS NULL "
            "AND order_id LIKE 'BETA-%'",
            (t["email"],),
        )
        conn.execute(
            "INSERT INTO purchase_claims (email, token, order_id, tier) VALUES (?,?,?,'free')",
            (t["email"], t["token"], t["order"]),
        )
    conn.commit()
    conn.close()


def mint_remote(testers):
    stmts = [
        "DELETE FROM softlife_purchase_claims WHERE completed_at IS NULL AND order_id LIKE 'BETA-%'"
    ]
    values = []
    for i, t in enumerate(testers, 1):
        t["token"] = secrets.token_hex(16)
        t["order"] = f"BETA-{i:02d}"
        values.append(
            f"({sql_quote(t['email'])}, {sql_quote(t['token'])}, {sql_quote(t['order'])}, 'free')"
        )
    stmts.append(
        "INSERT INTO softlife_purchase_claims (email, token, order_id, tier) VALUES "
        + ", ".join(values)
    )
    sql_file = Path(__file__).parent / "_mint_beta_tmp.sql"
    sql_file.write_text(";\n".join(stmts) + ";", encoding="utf-8")
    try:
        result = subprocess.run(
            ["npx", "-y", "wrangler@latest", "d1", "execute", "gabochie-db",
             "--remote", "--file", str(sql_file), "-y"],
            cwd=APP / "deploy" / "cloudflare",
            capture_output=True, text=True, timeout=300,
        )
        if result.returncode != 0:
            sys.exit(f"wrangler failed:\n{result.stdout[-800:]}\n{result.stderr[-800:]}")
        tail = (result.stdout + result.stderr).strip().splitlines()[-3:]
        print("wrangler: " + " | ".join(x.strip() for x in tail))
    finally:
        sql_file.unlink(missing_ok=True)


INVITE = """Hi {name}!

You're in 🎉 You're one of my first 18 beta testers for The Soft Life System — the app version of the book: a 90-day task plan, audio lessons you can listen to on the move, and everything working toward building your business in about 15 hours a week.

Your access link (works once, valid for 14 days):
{link}

Tap it, set your password, and the free trial opens up - upgrade only if it proves itself. In exchange I'd love your honest feedback — what's confusing, what's boring, what actually helps. Reply here or email me anytime.

Welcome to the soft life,
Deon ChristoLove"""


def print_report(testers, mode):
    base = SITE[mode]
    print()
    for i, t in enumerate(testers, 1):
        link = f"{base}/#/claim?token={t['token']}"
        t["link"] = link
        label = t["name"] or t["email"].split("@")[0].title()
        print(f"{i:02d}. {label} <{t['email']}>")
        print(f"    {link}")
    print()
    print("=" * 62)
    print("READY-TO-SEND INVITES (one block per tester)")
    print("=" * 62)
    for t in testers:
        name = t["name"] or t["email"].split("@")[0].title()
        print()
        print(INVITE.format(name=name, link=t["link"]))
        print("-" * 62)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows cp1252 console + emoji
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    local = "--local" in sys.argv
    if not args:
        sys.exit(__doc__)
    testers = load_testers(Path(args[0]))
    if not testers:
        sys.exit("No testers found in the input file.")
    print(f"Minting {len(testers)} beta claim links ({'LOCAL DEV' if local else 'PRODUCTION'})...")
    mint_local(testers) if local else mint_remote(testers)
    print_report(testers, "local" if local else "remote")


if __name__ == "__main__":
    main()
