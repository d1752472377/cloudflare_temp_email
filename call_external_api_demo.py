#!/usr/bin/env python3
"""
Demo client for cloudflare_temp_email external API.

Default run is safe:
- verifies auth behavior
- creates one temporary address
- lists mails for that address
- fetches a nonexistent mail id (returns null)

Secrets are NOT hardcoded. Set env var OPEN_API_KEY before running.
Optional side-effect calls:
- --send-to somebody@example.com  sends a test email from the created address
- --delete-mail-id ID             deletes that mail id for the created address
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional


def pretty(obj: Any) -> str:
    if isinstance(obj, (dict, list)):
        return json.dumps(obj, ensure_ascii=False, indent=2)
    return str(obj)


class ApiClient:
    def __init__(self, base_url: str, api_key: Optional[str]) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def request(self, method: str, path: str, body: Any = None, *, key: Optional[str] = "default") -> tuple[int, str, Any]:
        url = self.base_url + path
        headers = {"User-Agent": "cloudflare-temp-email-demo/1.0"}
        if key == "default" and self.api_key:
            headers["X-API-Key"] = self.api_key
        elif key and key != "default":
            headers["X-API-Key"] = key

        data = None
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=data, method=method.upper(), headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8", "replace")
                parsed = self._parse(raw, resp.headers.get("content-type", ""))
                return resp.status, raw, parsed
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            parsed = self._parse(raw, e.headers.get("content-type", ""))
            return e.code, raw, parsed

    @staticmethod
    def _parse(raw: str, content_type: str) -> Any:
        if "json" in content_type.lower():
            try:
                return json.loads(raw)
            except Exception:
                return raw
        try:
            return json.loads(raw)
        except Exception:
            return raw


def print_step(title: str, status: int, parsed: Any) -> None:
    print(f"\n=== {title} ===")
    print("HTTP", status)
    print(pretty(parsed))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=os.getenv("TEMP_EMAIL_API_BASE", "https://mail.dovislab.com/external/api"))
    ap.add_argument("--domain", default=os.getenv("TEMP_EMAIL_DOMAIN", "dovislab.com"))
    ap.add_argument("--api-key", default=os.getenv("OPEN_API_KEY"), help="Prefer env OPEN_API_KEY; do not hardcode in this file")
    ap.add_argument("--send-to", default=None, help="Optional: send test email to this recipient")
    ap.add_argument("--delete-mail-id", default=None, help="Optional: delete this mail id for created address")
    args = ap.parse_args()

    if not args.api_key:
        print("ERROR: OPEN_API_KEY is required. Example: set OPEN_API_KEY=...", file=sys.stderr)
        return 2

    c = ApiClient(args.base, args.api_key)

    # 1) auth checks
    status, _, parsed = c.request("GET", "/mails?email=nonexistent@example.com&limit=1&offset=0", key=None)
    print_step("auth check without X-API-Key (expected 401)", status, parsed)

    status, _, parsed = c.request("GET", "/mails?email=nonexistent@example.com&limit=1&offset=0", key="wrong-key")
    print_step("auth check with wrong X-API-Key (expected 401)", status, parsed)

    # 2) create address
    local = "pyapi" + str(int(time.time()))
    status, _, parsed = c.request("POST", "/address", {"name": local, "domain": args.domain})
    print_step("create address", status, parsed)
    if status < 200 or status >= 300 or not isinstance(parsed, dict):
        return 1

    address = parsed.get("address") or f"{local}@{args.domain}"
    print("created_address =", address)

    # 3) list mails
    q_email = urllib.parse.quote(address)
    status, _, parsed = c.request("GET", f"/mails?email={q_email}&limit=5&offset=0")
    print_step("list mails for created address", status, parsed)

    # 4) get nonexistent mail by id, non-destructive
    status, _, parsed = c.request("GET", f"/mail/0?email={q_email}")
    print_step("get nonexistent mail id=0 (expected null)", status, parsed)

    # 5) optional send_mail
    if args.send_to:
        body = {
            "address": address,
            "from_name": "Temp Email API Demo",
            "to_mail": args.send_to,
            "to_name": "API Tester",
            "subject": f"cloudflare_temp_email API demo {int(time.time())}",
            "content": "This is a test email sent through /external/api/send_mail.",
            "is_html": False,
        }
        status, _, parsed = c.request("POST", "/send_mail", body)
        print_step("send_mail", status, parsed)

    # 6) optional delete mail
    if args.delete_mail_id is not None:
        status, _, parsed = c.request("DELETE", f"/mail/{urllib.parse.quote(str(args.delete_mail_id))}?email={q_email}")
        print_step(f"delete mail id={args.delete_mail_id}", status, parsed)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
