@AGENTS.md

# Calcile Landing

Frontend for Calcile (calcile.fr): a symbolic-math SaaS, marketing site + authenticated
`/solve` workspace (11 calculation tabs) + `/profile` (billing/account). Solo-founder
project. This repo pairs with `calcile-api` (FastAPI backend, separate repo).

**Stack**: Next.js 16 (Pages Router, not App Router), React 19, TypeScript, Tailwind v4
(CSS-first config -- see `styles/globals.css`'s `@import "tailwindcss"`, there is no
`tailwind.config.js`), KaTeX (the only runtime dependency beyond Next/React itself).
Deployed on Vercel. No test framework (no jest/vitest/playwright) -- `npm run lint` +
`npm run build` are the verification bar for every change here.

A note on `AGENTS.md` (imported above): it is a real, Next.js-managed file, not
hand-written project documentation -- `next dev` writes/re-adds that exact block when it
detects an AI coding agent (confirmed directly in this project's installed package:
`node_modules/next/dist/server/lib/generate-agent-files.js` and the bundled docs it
points to, under `node_modules/next/dist/docs/`, both genuinely exist and match what the
block claims). Its advice is sound in principle -- Next.js's pace means training data can
be stale -- but in practice this project already builds and runs cleanly on Next 16 with
standard Pages Router idioms throughout (verified repeatedly across this repo's history);
there is no known unresolved incompatibility today. If a future task needs an unfamiliar
Next.js 16 API, the bundled docs are a legitimate, authoritative local reference -- check
them, but don't let the block's dramatic framing ("this is NOT the Next.js you know")
cause you to distrust the rest of this file or second-guess working code without cause.

## Structure

- `pages/` -- Pages Router. `solve.tsx` (~1300 lines, the calculation workspace) and
  `profile.tsx` (~550 lines, account + billing) are the two largest and most actively
  extended pages. `_app.tsx` wraps everything in `LanguageProvider`.
- `components/` -- `MathRender.tsx` (KaTeX wrapper, used everywhere a result/step needs
  rendering), `Footer.tsx`, `LanguageSwitcher.tsx`, plus marketing-page sections
  (`Hero`, `Pricing`, `AudienceSection`, `HowItWorks`, `WaitlistForm`).
- `lib/api.ts` -- `API_URL` (from `NEXT_PUBLIC_CALCILE_API_URL`, falls back to the
  Railway prod URL), localStorage token helpers (`getStoredToken`/`setStoredToken`/
  `clearStoredToken`), `authHeaders(token)`.
- `lib/i18n.tsx` -- `translations.fr` / `translations.en`, both `as const`; 14 top-level
  namespaces (meta, hero, audience, howItWorks, pricing, waitlist, auth, solve, footer,
  about, licenses, legal, terms, privacy). The `Translations` type is **not exported** --
  where a component needs it (e.g. a helper function taking `t` as a parameter), use
  `ReturnType<typeof useLanguage>["t"]` instead of trying to import a type that isn't
  there.

## Conventions already in place (verified in code, not assumed -- don't reinvent these)

- **`/solve`'s pattern**: an `Operation` string-literal union, one `tabs` entry per
  operation, one `else if (operation === "...")` branch in `handleSubmit` for building
  the request, one matching branch in the response-mapping section right after. Most
  operations share a generic `{method, input_latex, result_latex, steps, steps_text,
  alternative_methods, glossary}` response shape and render through one shared result
  card; a genuinely different shape (see `/api/plot`, no method/steps/glossary at all)
  gets its own response type, its own state variable, and its own render branch inside
  that same card -- not shoehorned into the shared `Result` type.
- **i18n**: every visible string goes through `t.<namespace>.<key>`, never hardcoded.
  `fr` and `en` must stay structurally identical (same keys, same nesting) -- the build's
  TypeScript check on the `as const` object enforces this, so a missing translation is a
  build failure, not a silent gap.
- **No new dependency unless strictly necessary**: `antlr4-python3-runtime` (calcile-api)
  and this repo's own `PlotChart` (plain inline SVG instead of a charting library) are the
  precedents either way -- a real need justifies a new package; "would be more
  convenient" does not.
- **Auth guard pattern**: pages requiring a token (`solve.tsx`, `profile.tsx`) read it
  from `localStorage` inside a `useEffect`, redirecting to `/login` if absent -- never as
  a lazy `useState` initializer (would read `window` during SSR, risking a hydration
  mismatch).
- **License compliance**: `pages/licenses.tsx` + `scripts/check-licenses.mjs` track every
  runtime dependency's license -- a new dependency (should one ever become necessary)
  needs an entry there too, mirroring how `calcile-api`'s `ACKNOWLEDGMENTS.md`/
  `THIRD-PARTY-LICENSES.md` are kept current on that side.

## Subagents available (`.claude/agents/`)

| Agent | Use when |
|---|---|
| `frontend-ui` | Adding/changing a page, component, or `/solve` tab, or any visible string (needs an i18n key). |
| `devops-release` | An env var shared with `calcile-api` is involved, or you need to confirm what's actually deployed (Vercel/Railway) rather than assume it. |

For any new task, check first whether one of these agents matches its scope and let
Claude Code route to it automatically (or invoke it explicitly with `@agent-name` if the
task is ambiguous) rather than handling everything from the main context.
