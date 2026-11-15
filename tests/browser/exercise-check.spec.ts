import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// End-to-end browser verification of the "Correction par lot" (batch
// grading) feature and /history, against a local calcile-api + local
// next dev -- both started by scripts/run-browser-tests.mjs (see
// tests/browser/README.md). The API is seeded with:
//   prof@e2e.calcile.dev / ProfLocal123!  (tier "prof")
//   free@e2e.calcile.dev / FreeLocal123!  (tier "free")
// plus one calculation-history entry for the prof user.

const PROF = { email: "prof@e2e.calcile.dev", password: "ProfLocal123!" };
const FREE = { email: "free@e2e.calcile.dev", password: "FreeLocal123!" };

async function login(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  await page.fill("#login-email", credentials.email);
  await page.fill("#login-password", credentials.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/solve/);
}

// POST /api/auth/login is rate-limited to 5/minute -- the suite must not
// do a UI login per test or it trips its own limit. The /history tests
// reuse one API-issued prof token instead (the UI login flow itself is
// covered by the first and fourth tests).
const API_URL = "http://localhost:8000";
let profToken: string | null = null;

async function getProfToken(request: APIRequestContext): Promise<string> {
  if (!profToken) {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: PROF.email, password: PROF.password },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { access_token: string };
    profToken = body.access_token;
  }
  return profToken;
}

async function openWithToken(
  page: Page,
  token: string,
  path: string
) {
  await page.addInitScript((t) => {
    window.localStorage.setItem("calcile_token", t);
  }, token);
  await page.goto(path);
}

// MathLive's <math-field> is not a plain input: page.fill() won't work.
// Set the LaTeX value imperatively and dispatch the same "input" event
// MathLive itself fires on typing, which components/MathInput.tsx's
// onInput handler reads via getValue("latex").
async function fillMathField(page: Page, selector: string, latex: string) {
  await page.locator(selector).click();
  await page.evaluate(
    ([sel, value]) => {
      const el = document.querySelector(sel) as HTMLElement & {
        setValue: (v: string) => void;
      };
      el.setValue(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    [selector, latex]
  );
}

async function mathFieldValue(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    // MathInput mounts client-side only (next/dynamic, ssr: false) -- the
    // element may not exist yet, in which case return "" so expect.poll
    // keeps waiting instead of throwing.
    const el = document.querySelector(sel) as (HTMLElement & {
      getValue: (format: string) => string;
    }) | null;
    return el ? el.getValue("latex") : "";
  }, selector);
}

// ---------------------------------------------------------------------------
// a. Prof: login -> /solve -> batch grading tab -> submit a batch
//    (one correct, one incorrect, one malformed answer).
// ---------------------------------------------------------------------------
test("prof: batch grading on /solve shows per-answer results", async ({ page }) => {
  await login(page, PROF);

  // The tier is fetched asynchronously after login -- the entry button
  // shows a 🔒 until it lands. Wait for it to disappear, otherwise a
  // too-fast click would show the locked notice instead of the form.
  const entryButton = page.getByRole("button", { name: /Correction par lot/ });
  await expect(entryButton).not.toContainText("🔒");
  await entryButton.click();

  // Prof tier switches straight into the form -- never the locked notice.
  await expect(page.locator("#exercise-check-answers")).toBeVisible();
  await expect(page.getByText("Fonctionnalité réservée au tier Prof")).toHaveCount(0);

  // Correctness is SET equality against the equation's full solution
  // (solver/sympy_engine.py check_exercise_answers: "a partial answer is
  // wrong") -- so the correct line for x^2 - 4 = 0 is "2, -2", not "2".
  await fillMathField(page, "#exercise-check-equation", "x^2 - 4 = 0");
  await page.fill("#exercise-check-answers", "2, -2\n3\nabc");
  await page.getByRole("button", { name: "Vérifier les réponses" }).click();

  // One row per submitted answer, in the result box below the form.
  const rows = page.locator("div.scroll-mt-6 > div > div");
  await expect(rows).toHaveCount(3);

  // Each row echoes the raw answer in its own mono span -- anchor on it,
  // since e.g. "2" also appears inside other rows' rendered solutions.
  const rowFor = (answer: string) =>
    rows.filter({
      has: page.locator("span.font-mono", {
        hasText: new RegExp(
          `^\\s*${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`
        ),
      }),
    });

  const correctRow = rowFor("2, -2");
  await expect(correctRow.getByText("Correct", { exact: true })).toBeVisible();

  const incorrectRow = rowFor("3");
  await expect(incorrectRow.getByText("Incorrect", { exact: true })).toBeVisible();
  // Incorrect-but-parseable answers also show the real solution.
  await expect(incorrectRow.getByText("Vraie solution")).toBeVisible();

  // "abc" parses as a*b*c (free symbols), so the API marks it incorrect
  // without a parse error -- the row shows the real solution, not an
  // error message (documented in tests/browser/README.md).
  const malformedRow = rowFor("abc");
  await expect(malformedRow.getByText("Incorrect", { exact: true })).toBeVisible();
  await expect(malformedRow.getByText("Vraie solution")).toBeVisible();
});

// ---------------------------------------------------------------------------
// b. Prof: /history shows the submitted batch with its counters.
// ---------------------------------------------------------------------------
test("prof: /history lists the batch grading entry with counters", async ({ page, request }) => {
  await openWithToken(page, await getProfToken(request), "/history");

  const section = page.locator("section", { hasText: "Corrections par lot" });
  await expect(section).toBeVisible();

  // The entry submitted by the previous test (serial, same local DB):
  // 3 answers -- 1 correct, 2 incorrect.
  const entry = section.locator("div.rounded-lg.border").first();
  await expect(entry).toBeVisible();
  await expect(entry.getByText("3 réponse(s) — 1 ✓ 2 ✗")).toBeVisible();
  // The equation is rendered (KaTeX), not raw text.
  await expect(entry.locator(".katex").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// c. Prof: /history calculation history + "Recharger" round-trip to /solve.
// ---------------------------------------------------------------------------
test("prof: /history calculation entry reloads into /solve", async ({ page, request }) => {
  await openWithToken(page, await getProfToken(request), "/history");

  const section = page.locator("section", { hasText: "Historique des calculs" });
  await expect(section).toBeVisible();

  // The seeded entry (kind "solve", input "x^2 - 4 = 0").
  const entry = section.locator("div.rounded-lg.border").first();
  await expect(entry.getByText("solve", { exact: true })).toBeVisible();

  await entry.getByRole("link", { name: "Recharger" }).click();
  // solve.tsx's reload effect consumes ?reload=...&kind=... then strips
  // the query (router.replace) so a refresh doesn't repeat the reload --
  // by the time we look, the URL may already be bare /solve.
  await expect(page).toHaveURL(/\/solve(\?.*)?$/);

  // The reloaded equation lands in the main math field.
  await expect
    .poll(() => mathFieldValue(page, "#solve-equation"))
    .toContain("x^2");
});

// ---------------------------------------------------------------------------
// d. Gating: free tier never sees the form or the data, only locked notices.
// ---------------------------------------------------------------------------
test("free tier: locked notices on /solve and /history, never the feature", async ({ page }) => {
  await login(page, FREE);

  // /solve: the entry button shows the lock glyph and reveals the locked
  // notice on click -- never the batch form.
  await page.getByRole("button", { name: /Correction par lot/ }).click();
  await expect(page.getByText("Fonctionnalité réservée au tier Prof")).toBeVisible();
  await expect(page.locator("#exercise-check-answers")).toHaveCount(0);
  await expect(page.locator("#exercise-check-equation")).toHaveCount(0);

  // /history: both sections show their locked notice, never any data.
  await page.goto("/history");
  await expect(page.getByText("Corrections par lot")).toBeVisible();
  await expect(page.getByText("Fonctionnalité réservée au tier Prof")).toBeVisible();
  await expect(
    page.getByText("Fonctionnalité réservée aux formules payantes")
  ).toBeVisible();
  await expect(page.getByText(/réponse\(s\)/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Recharger" })).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// e. No token / invalid token -> redirected to /login.
// ---------------------------------------------------------------------------
test("no stored token redirects /solve and /history to /login", async ({ page }) => {
  await page.goto("/solve");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/history");
  await expect(page).toHaveURL(/\/login/);
});

test("invalid token redirects /solve and /history to /login", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("calcile_token", "not-a-real-token");
  });
  await page.goto("/history");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/solve");
  await expect(page).toHaveURL(/\/login/);
});
