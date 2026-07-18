"""
Backend runtime smoke test.

Runs the FastAPI app in offline fallback mode and verifies the core endpoints
can boot and respond without Supabase or Gemini credentials.
"""

import os
import sys

from fastapi.testclient import TestClient

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ.pop("DATABASE_URL", None)

from app_main import app  # noqa: E402


PROFILE = {
    "state": "TN",
    "gender": "female",
    "caste_category": "OBC",
    "age": 30,
    "income_annual": 120000,
    "occupation_type": "unorganised_worker",
}


def assert_ok(name, response):
    if response.status_code >= 500:
        raise AssertionError(f"{name} failed: {response.status_code} {response.text}")
    print(f"{name}: {response.status_code}")


def main():
    with TestClient(app) as client:
        checks = [
            ("root", client.get("/")),
            ("health", client.get("/health")),
            (
                "match",
                client.post(
                    "/schemes/match",
                    json={"user_profile": PROFILE, "language": "en"},
                ),
            ),
            ("detail", client.get("/schemes/pmay-g")),
            ("eligibility", client.post("/schemes/check/pmay-g", json=PROFILE)),
            ("semantic_search", client.get("/schemes/semantic-search?q=housing&lang=en")),
            (
                "chat",
                client.post(
                    "/chat",
                    json={
                        "message": "housing support",
                        "user_profile": PROFILE,
                        "language": "en",
                    },
                ),
            ),
        ]

        for name, response in checks:
            assert_ok(name, response)

        match_total = checks[2][1].json().get("total", 0)
        if match_total < 1:
            raise AssertionError("match endpoint returned no fallback schemes")

    print("backend smoke test passed")


if __name__ == "__main__":
    main()
