"""Seed local test users for the browser test suite (tests/browser/).

Run by scripts/run-browser-tests.mjs inside the calcile-api Poetry venv,
with cwd = the calcile-api repo root and DATABASE_URL pointing at the
throwaway SQLite file (browser-test.db) the local API server uses --
never the dev/prod database. Idempotent: re-running resets the two test
users' password/tier and only adds the seeded calculation-history entry
if the prof user has none yet.

Test credentials (local throwaway DB only, not secrets):
  prof@e2e.calcile.dev  / ProfLocal123!   (tier "prof")
  free@e2e.calcile.dev  / FreeLocal123!   (tier "free")
"""

from __future__ import annotations

import json
import os

from users.auth import hash_password
from users.database import SessionLocal, init_db
from users.models import CalculationHistory, User

PROF_EMAIL = os.getenv("BROWSER_TEST_PROF_EMAIL", "prof@e2e.calcile.dev")
PROF_PASSWORD = os.getenv("BROWSER_TEST_PROF_PASSWORD", "ProfLocal123!")
FREE_EMAIL = os.getenv("BROWSER_TEST_FREE_EMAIL", "free@e2e.calcile.dev")
FREE_PASSWORD = os.getenv("BROWSER_TEST_FREE_PASSWORD", "FreeLocal123!")


def upsert_user(db: SessionLocal, email: str, password: str, tier: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(email=email, password_hash=hash_password(password), tier=tier)
        db.add(user)
    else:
        user.password_hash = hash_password(password)
        user.tier = tier
    db.commit()
    db.refresh(user)
    return user


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        prof = upsert_user(db, PROF_EMAIL, PROF_PASSWORD, "prof")
        free = upsert_user(db, FREE_EMAIL, FREE_PASSWORD, "free")

        # One seeded calculation-history entry for the prof user, so the
        # /history "Historique des calculs" section has something to show
        # and its "Recharger" link can be exercised without first running
        # a calculation through the UI.
        existing = (
            db.query(CalculationHistory)
            .filter(CalculationHistory.user_id == prof.id)
            .count()
        )
        if existing == 0:
            db.add(
                CalculationHistory(
                    user_id=prof.id,
                    kind="solve",
                    client_input="x^2 - 4 = 0",
                    result_summary="x = -2 \\quad x = 2",
                )
            )
            db.commit()

        print(
            json.dumps(
                {
                    "prof": {"id": prof.id, "email": prof.email, "tier": prof.tier},
                    "free": {"id": free.id, "email": free.email, "tier": free.tier},
                }
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
