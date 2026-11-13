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
        self.assertEqual(stats["commission_rate"], "50%")

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

    def test_signout_invalidates_token(self):
        _, data = self.req("POST", "/api/signup",
                           {"email": "out@test.com", "password": "softlife1"})
        token = data["token"]
        self.assertEqual(self.req("POST", "/api/signout", token=token)[0], 200)
        self.assertEqual(self.req("GET", "/api/me", token=token)[0], 401)

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
