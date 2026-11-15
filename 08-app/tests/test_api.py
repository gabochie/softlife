#!/usr/bin/env python3
"""Automated tests for the Soft Life dev API (server/api.py).

Runs the real server on an ephemeral port against a throwaway SQLite DB —
no network, no pytest dependency. Run from anywhere:

    python3 -m unittest discover -s 08-app/tests -v
"""
import json
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))
import api


class Client:
    def __init__(self, port):
        self.base = f"http://127.0.0.1:{port}"

    def req(self, method, path, body=None, token=None):
        data = json.dumps(body).encode() if body is not None else None
        r = urllib.request.Request(self.base + path, data=data, method=method)
        if data:
            r.add_header("Content-Type", "application/json")
        if token:
            r.add_header("Authorization", "Bearer " + token)
        try:
            with urllib.request.urlopen(r, timeout=10) as resp:
                return resp.status, json.loads(resp.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")


class AppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(prefix="softlife-test-")
        api.DB = Path(cls.tmp) / "test.db"
        # tiny stand-in audio files so the gated-audio routes can be tested
        api.AUDIO_DIR = Path(cls.tmp) / "audio"
        api.AUDIO_DIR.mkdir()
        for slug in ("intro", "ch01", "ch02"):
            (api.AUDIO_DIR / f"{slug}.mp3").write_bytes(b"ID3fakeaudio" * 20)
        api.init_db()
        api.Handler.log_message = lambda *a, **k: None  # silence request logs
        cls.httpd = api.HTTPServer(("127.0.0.1", 0), api.Handler)
        cls.client = Client(cls.httpd.server_address[1])
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()

    def req(self, *a, **k):
        return self.client.req(*a, **k)

    # ---------- static ----------

    def test_static_serves_pwa(self):
        with urllib.request.urlopen(self.client.base + "/", timeout=10) as resp:
            html = resp.read().decode()
        self.assertIn("Soft Life", html)
        self.assertIn("app.js", html)

    def test_extra_pages_are_static_and_discoverable(self):
        for path, marker in (
            ("/products/", "PDF implementation toolkits"),
            ("/consultation/", "The Soft Life Business Audit"),
        ):
            with urllib.request.urlopen(self.client.base + path, timeout=10) as resp:
                html = resp.read().decode()
            self.assertIn(marker, html)
            self.assertNotIn("app.js", html)
        with urllib.request.urlopen(self.client.base + "/sitemap.xml", timeout=10) as resp:
            sitemap = resp.read().decode()
        self.assertIn("https://soft.gabochie.com/products/", sitemap)
        self.assertIn("https://soft.gabochie.com/consultation/", sitemap)

    # ---------- auth ----------

    def test_signup_success_returns_token_and_seeds_tasks(self):
        status, data = self.req("POST", "/api/signup",
                                {"email": "Amara@Test.com", "password": "softlife1", "name": "Amara"})
        self.assertEqual(status, 201)
        self.assertTrue(data["token"])
        self.assertEqual(data["user"]["email"], "amara@test.com")
        self.assertEqual(data["user"]["tier"], "free")
        self.assertTrue(data["user"]["ref_code"].startswith("SL"))
        status, tasks = self.req("GET", "/api/tasks", token=data["token"])
        self.assertEqual(status, 200)
        self.assertEqual(len(tasks["tasks"]), 16)
        self.assertTrue(all(t["kind"] == "launch" for t in tasks["tasks"]))

    def test_signup_rejects_bad_input(self):
        self.assertEqual(self.req("POST", "/api/signup",
                                  {"email": "nope", "password": "softlife1"})[0], 400)
        self.assertEqual(self.req("POST", "/api/signup",
                                  {"email": "a@b.com", "password": "short"})[0], 400)
        self.assertEqual(self.req("POST", "/api/signup", {})[0], 400)

    def test_signup_rejects_duplicate_email(self):
        body = {"email": "dupe@test.com", "password": "softlife1"}
        self.assertEqual(self.req("POST", "/api/signup", body)[0], 201)
        self.assertEqual(self.req("POST", "/api/signup", body)[0], 409)

    def test_signup_with_referral_records_it(self):
        _, referrer = self.req("POST", "/api/signup",
                               {"email": "ref@test.com", "password": "softlife1"})
        code = referrer["user"]["ref_code"]
        status, data = self.req("POST", "/api/signup",
                                {"email": "friend@test.com", "password": "softlife1", "ref": code})
        self.assertEqual(status, 201)
        status, stats = self.req("GET", "/api/affiliate", token=referrer["token"])
        self.assertEqual(status, 200)
        self.assertEqual(stats["ref_code"], code)
        self.assertEqual(stats["clicks"], 1)
        self.assertEqual(stats["signups"], 1)
        self.assertEqual(stats["commission_rate"], "30%")

    def test_signin_success_and_failure(self):
        self.req("POST", "/api/signup", {"email": "sign@test.com", "password": "softlife1"})
        status, data = self.req("POST", "/api/signin",
                                {"email": "sign@test.com", "password": "softlife1"})
        self.assertEqual(status, 200)
        self.assertTrue(data["token"])
        status, _ = self.req("POST", "/api/signin",
                             {"email": "sign@test.com", "password": "wrongpass1"})
        self.assertEqual(status, 401)
        status, _ = self.req("POST", "/api/signin",
                             {"email": "ghost@test.com", "password": "softlife1"})
        self.assertEqual(status, 401)

    def test_me_requires_token(self):
        self.assertEqual(self.req("GET", "/api/me")[0], 401)
        _, data = self.req("POST", "/api/signin",
                           {"email": "demo@softlife.app", "password": "demo1234"})
        status, me = self.req("GET", "/api/me", token=data["token"])
        self.assertEqual(status, 200)
        self.assertEqual(me["email"], "demo@softlife.app")
        self.assertEqual(me["ref_code"], "DEMO01")

    def test_sessions_are_hashed_and_expire(self):
        import hashlib
        import sqlite3
        _, data = self.req("POST", "/api/signup", {"email": "hash@test.com", "password": "softlife1"})
        conn = sqlite3.connect(api.DB)
        row = conn.execute(
            "SELECT s.token_hash, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id "
            "WHERE u.email = 'hash@test.com'"
        ).fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row[0], hashlib.sha256(data["token"].encode()).hexdigest())
        self.assertNotEqual(row[0], data["token"])
        conn.execute(
            "UPDATE sessions SET expires_at = datetime('now', '-1 minute') "
            "WHERE user_id = (SELECT id FROM users WHERE email = 'hash@test.com')"
        )
        conn.commit()
        conn.close()
        self.assertEqual(self.req("GET", "/api/me", token=data["token"])[0], 401)

    def test_audio_tokens_are_hashed_and_expire(self):
        import hashlib
        import sqlite3
        token = self._signup("aud-expire@test.com")
        audio_token = self._audio_token(token)
        conn = sqlite3.connect(api.DB)
        row = conn.execute(
            "SELECT t.token_hash FROM audio_tokens t JOIN users u ON u.id = t.user_id "
            "WHERE u.email = 'aud-expire@test.com'"
        ).fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row[0], hashlib.sha256(audio_token.encode()).hexdigest())
        conn.execute(
            "UPDATE audio_tokens SET expires_at = datetime('now', '-1 minute') "
            "WHERE user_id = (SELECT id FROM users WHERE email = 'aud-expire@test.com')"
        )
        conn.commit()
        conn.close()
        self.assertEqual(self.req("GET", f"/api/audio/intro.mp3?token={audio_token}")[0], 401)

    def test_signout_invalidates_token(self):
        _, data = self.req("POST", "/api/signup",
                           {"email": "out@test.com", "password": "softlife1"})
        token = data["token"]
        self.assertEqual(self.req("POST", "/api/signout", token=token)[0], 200)
        self.assertEqual(self.req("GET", "/api/me", token=token)[0], 401)

    # ---------- onboarding + events ----------

    def test_signup_captures_first_touch_acquisition(self):
        status, data = self.req("POST", "/api/signup", {
            "email": "source@test.com", "password": "softlife1",
            "acquisition": {
                "source": "utm", "utm_source": "newsletter",
                "utm_medium": "email", "utm_campaign": "launch",
                "referrer": "https://example.com/welcome",
            },
        })
        self.assertEqual(status, 201)
        status, ob = self.req("GET", "/api/onboarding", token=data["token"])
        self.assertEqual(status, 200)
        self.assertEqual(ob["onboarding"]["source"], "utm")
        self.assertEqual(ob["onboarding"]["utm_source"], "newsletter")
        self.assertEqual(ob["onboarding"]["utm_campaign"], "launch")

    def test_onboarding_requires_auth(self):
        self.assertEqual(self.req("GET", "/api/onboarding")[0], 401)
        self.assertEqual(self.req("POST", "/api/onboarding", {"main_goal": "offer"})[0], 401)

    def test_onboarding_completion_and_whatsapp_consent(self):
        _, data = self.req("POST", "/api/signup", {"email": "profile@test.com", "password": "softlife1"})
        token = data["token"]
        status, saved = self.req("POST", "/api/onboarding", {
            "business_name": "Soft Studio", "country": "Ghana",
            "business_stage": "early", "main_goal": "systems",
            "biggest_challenge": "time", "revenue_range": "1k_3k",
            "team_size": "solo", "timezone": "Africa/Accra",
            "whatsapp_consent": True, "whatsapp_number": "+233 24 123 4567",
            "marketing_consent": True,
        }, token=token)
        self.assertEqual(status, 200)
        ob = saved["onboarding"]
        self.assertEqual(ob["business_stage"], "early")
        self.assertEqual(ob["whatsapp_number"], "+233241234567")
        self.assertEqual(ob["whatsapp_consent"], 1)
        self.assertEqual(ob["marketing_consent"], 1)
        self.assertEqual(ob["consent_version"], "2026-11-14")
        self.assertTrue(ob["completed_at"])
        self.assertTrue(ob["whatsapp_consent_at"])

        status, saved = self.req("POST", "/api/onboarding", {
            "whatsapp_consent": False,
        }, token=token)
        self.assertEqual(status, 200)
        self.assertEqual(saved["onboarding"]["whatsapp_consent"], 0)
        self.assertEqual(saved["onboarding"]["whatsapp_number"], "")

    def test_whatsapp_consent_requires_a_valid_number(self):
        _, data = self.req("POST", "/api/signup", {"email": "consent@test.com", "password": "softlife1"})
        status, _ = self.req("POST", "/api/onboarding", {
            "whatsapp_consent": True, "whatsapp_number": "123",
        }, token=data["token"])
        self.assertEqual(status, 400)

    def test_event_logging_is_allowlisted(self):
        _, data = self.req("POST", "/api/signup", {"email": "events@test.com", "password": "softlife1"})
        token = data["token"]
        self.assertEqual(self.req("POST", "/api/events", {"event": "password_guess"}, token=token)[0], 400)
        status, resp = self.req("POST", "/api/events", {
            "event": "audio_play", "path": "/listen", "meta": {"slug": "intro"},
        }, token=token)
        self.assertEqual(status, 200)
        self.assertTrue(resp["ok"])

    # ---------- tasks ----------

    def test_tasks_require_auth(self):
        self.assertEqual(self.req("GET", "/api/tasks")[0], 401)
        self.assertEqual(self.req("POST", "/api/tasks", {"title": "x"})[0], 401)

    def test_demo_account_has_seeded_launch_plan(self):
        _, data = self.req("POST", "/api/signin",
                           {"email": "demo@softlife.app", "password": "demo1234"})
        _, tasks = self.req("GET", "/api/tasks", token=data["token"])
        weeks = [t["week"] for t in tasks["tasks"]]
        self.assertEqual(weeks, sorted(weeks))
        titles = {t["title"] for t in tasks["tasks"]}
        self.assertIn("Complete the Hustle Hangover Checklist", titles)

    def test_add_custom_task(self):
        _, data = self.req("POST", "/api/signup",
                           {"email": "tasks@test.com", "password": "softlife1"})
        token = data["token"]
        status, resp = self.req("POST", "/api/tasks",
                                {"title": "Draft premium offer v2", "week": 2}, token=token)
        self.assertEqual(status, 201)
        self.assertEqual(resp["task"]["kind"], "custom")
        self.assertEqual(resp["task"]["done"], 0)
        status, resp = self.req("POST", "/api/tasks", {"title": ""}, token=token)
        self.assertEqual(status, 400)

    def test_toggle_task_flips_state(self):
        _, data = self.req("POST", "/api/signup",
                           {"email": "toggle@test.com", "password": "softlife1"})
        token = data["token"]
        _, tasks = self.req("GET", "/api/tasks", token=token)
        tid = tasks["tasks"][0]["id"]
        _, resp = self.req("POST", "/api/tasks/toggle", {"id": tid}, token=token)
        self.assertEqual(resp["task"]["done"], 1)
        _, resp = self.req("POST", "/api/tasks/toggle", {"id": tid}, token=token)
        self.assertEqual(resp["task"]["done"], 0)
        status, _ = self.req("POST", "/api/tasks/toggle", {"id": 999999}, token=token)
        self.assertEqual(status, 404)

    def test_users_cannot_touch_each_others_tasks(self):
        _, a = self.req("POST", "/api/signup", {"email": "iso-a@test.com", "password": "softlife1"})
        _, b = self.req("POST", "/api/signup", {"email": "iso-b@test.com", "password": "softlife1"})
        _, tasks = self.req("GET", "/api/tasks", token=a["token"])
        tid = tasks["tasks"][0]["id"]
        status, _ = self.req("POST", "/api/tasks/toggle", {"id": tid}, token=b["token"])
        self.assertEqual(status, 404)

    # ---------- gated audio ----------

    def _signup(self, email):
        _, data = self.req("POST", "/api/signup", {"email": email, "password": "softlife1"})
        return data["token"]

    def _audio_token(self, session_token):
        status, data = self.req("POST", "/api/audio-token", {}, token=session_token)
        self.assertEqual(status, 200)
        self.assertIn("expires_in", data)
        return data["token"]

    def _audio(self, path, session_token):
        """Raw fetch for binary audio responses: returns (status, body)."""
        import urllib.request
        token = self._audio_token(session_token)
        r = urllib.request.Request(f"http://127.0.0.1:{self.httpd.server_address[1]}{path}?token={token}")
        try:
            with urllib.request.urlopen(r) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def test_audio_requires_auth(self):
        self.assertEqual(self.req("GET", "/api/audio/intro.mp3")[0], 401)
        self.assertEqual(self.req("GET", "/api/audio/intro.mp3?token=bogus")[0], 401)
        self.assertEqual(self.req("POST", "/api/audio-token", {})[0], 401)

    def test_audio_rejects_session_token_in_url(self):
        token = self._signup("aud-query@test.com")
        self.assertEqual(self.req("GET", f"/api/audio/intro.mp3?t={token}")[0], 401)
        self.assertEqual(self.req("GET", f"/api/audio/intro.mp3?token={token}")[0], 401)

    def test_free_tier_hears_trial_only(self):
        token = self._signup("aud-free@test.com")
        self.assertEqual(self._audio("/api/audio/intro.mp3", token)[0], 200)
        self.assertEqual(self._audio("/api/audio/ch01.mp3", token)[0], 200)
        self.assertEqual(self._audio("/api/audio/ch02.mp3", token)[0], 403)

    def test_paid_tier_unlocks_all_chapters(self):
        token = self._signup("aud-paid@test.com")
        import sqlite3
        conn = sqlite3.connect(api.DB)
        conn.execute("UPDATE users SET tier = 'paid' WHERE email = 'aud-paid@test.com'")
        conn.commit()
        conn.close()
        self.assertEqual(self._audio("/api/audio/ch02.mp3", token)[0], 200)
        self.assertEqual(self._audio("/api/audio/ch15.mp3", token)[0], 404)  # no file seeded

    def test_audio_range_requests(self):
        token = self._signup("aud-range@test.com")
        import urllib.request
        audio_token = self._audio_token(token)
        r = urllib.request.Request(f"http://127.0.0.1:{self.httpd.server_address[1]}/api/audio/intro.mp3?token={audio_token}",
                                   headers={"Range": "bytes=0-9"})
        with urllib.request.urlopen(r) as resp:
            self.assertEqual(resp.status, 206)
            self.assertEqual(resp.headers["Content-Range"], "bytes 0-9/240")
            self.assertEqual(resp.read(), b"ID3fakeaud")  # 10 bytes: 0..9

    def test_audio_rejects_bad_slugs(self):
        token = self._signup("aud-bad@test.com")
        self.assertEqual(self._audio("/api/audio/..%2Fschema.mp3", token)[0], 404)
        self.assertEqual(self._audio("/api/audio/nope.mp3", token)[0], 404)

    # ---------- misc ----------

    def test_unknown_api_routes_404(self):
        self.assertEqual(self.req("GET", "/api/nope")[0], 404)
        # POST routes check auth before matching, so an unknown route
        # without a token returns 401, and 404 once authenticated.
        self.assertEqual(self.req("POST", "/api/nope", {})[0], 401)
        _, data = self.req("POST", "/api/signin",
                           {"email": "demo@softlife.app", "password": "demo1234"})
        self.assertEqual(self.req("POST", "/api/nope", {}, token=data["token"])[0], 404)

    def test_affiliate_requires_auth(self):
        self.assertEqual(self.req("GET", "/api/affiliate")[0], 401)


if __name__ == "__main__":
    unittest.main()
