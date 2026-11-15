#!/usr/bin/env node
// Orchestrates a full local end-to-end run of the browser test suite
// (tests/browser/): starts a throwaway local calcile-api (uvicorn, own
// SQLite DB, random one-shot SECRET_KEY passed via env only -- never
// written to any file), seeds the two test users, starts `next dev`
// pointed at that API, then runs Playwright. Local, on-demand -- NOT
// wired into CI (see tests/browser/README.md).
//
// Usage: npm run test:browser
// Override the API repo location with CALCILE_API_DIR (default: sibling
// directory ../calcile-api-clone).

import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = process.env.CALCILE_API_DIR
  ? path.resolve(process.env.CALCILE_API_DIR)
  : path.resolve(repoRoot, "..", "calcile-api-clone");
const apiPort = Number(process.env.BROWSER_TEST_API_PORT || "8000");
const webPort = Number(process.env.BROWSER_TEST_WEB_PORT || "3000");
const dbFile = path.join(apiDir, "browser-test.db");
const seedScript = path.join(repoRoot, "tests", "browser", "seed_users.py");

// One-shot signing key for the throwaway local API -- generated per run,
// passed to uvicorn through its environment only, never stored anywhere.
const secretKey = randomBytes(32).toString("hex");
const apiEnv = {
  ...process.env,
  SECRET_KEY: secretKey,
  // Relative to the API server's cwd (apiDir), i.e. browser-test.db
  // sits inside the API repo but is gitignored there / deleted per run.
  DATABASE_URL: "sqlite:///./browser-test.db",
  ALLOWED_ORIGINS: `http://localhost:${webPort}`,
};

const children = [];
function cleanup() {
  for (const child of children) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
}
process.on("exit", cleanup);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    cleanup();
    process.exit(130);
  });
}

function start(command, args, options) {
  const child = spawn(command, args, { detached: true, stdio: "inherit", ...options });
  children.push(child);
  return child;
}

async function waitForUrl(url, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} did not become ready at ${url} within ${timeoutMs} ms`);
}

async function main() {
  rmSync(dbFile, { force: true });

  console.log(`[test:browser] starting local API (uvicorn) from ${apiDir} on :${apiPort}`);
  start("poetry", ["run", "uvicorn", "main:app", "--port", String(apiPort)], {
    cwd: apiDir,
    env: apiEnv,
  });
  await waitForUrl(`http://localhost:${apiPort}/health`, 60_000, "local API");

  console.log("[test:browser] seeding test users");
  const seed = spawnSync("poetry", ["run", "python", seedScript], {
    cwd: apiDir,
    env: apiEnv,
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (seed.status !== 0) {
    throw new Error("seeding failed (see output above)");
  }

  console.log(`[test:browser] starting next dev on :${webPort}`);
  start(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "dev", "--webpack", "--port", String(webPort)],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        NEXT_PUBLIC_CALCILE_API_URL: `http://localhost:${apiPort}`,
      },
    }
  );
  await waitForUrl(`http://localhost:${webPort}/login`, 120_000, "next dev");

  console.log("[test:browser] running Playwright");
  const tests = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["playwright", "test", "--config", "tests/browser/playwright.config.ts"],
    { cwd: repoRoot, stdio: "inherit" }
  );
  // Exit explicitly: the fetch keep-alive sockets used by waitForUrl can
  // keep the Node event loop (and thus the spawned servers) alive past
  // the end of main. The "exit" handler then kills the servers.
  process.exit(tests.status ?? 1);
}

main().catch((err) => {
  console.error(`[test:browser] ${err.message}`);
  process.exitCode = 1;
});
