import { defineConfig } from "@playwright/test";

// Local-only browser suite (see tests/browser/README.md). The web and API
// servers are managed by scripts/run-browser-tests.mjs, not by Playwright's
// own webServer -- the API side (uvicorn + seeding) is outside Playwright's
// reach. workers: 1 keeps the suite deterministic against the single shared
// local API/DB.
export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    locale: "fr-FR",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
