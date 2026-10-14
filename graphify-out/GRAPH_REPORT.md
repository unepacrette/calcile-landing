# Graph Report - calcile-landing  (2026-10-14)

## Corpus Check
- 42 files · ~37,469 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 297 nodes · 513 edges · 17 communities (14 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1fe2b419`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useLanguage
- solve.tsx
- package.json
- profile.tsx
- compilerOptions
- waitlist.ts
- login.tsx
- Part 1 — Calculation-page findings, per competitor
- react
- MathInput.tsx
- _app.tsx
- walk
- next-env.d.ts
- postcss.config.mjs
- Calcile Landing
- Calcile Landing

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 47 edges
2. `Solve()` - 25 edges
3. `LanguageSwitcher()` - 16 edges
4. `compilerOptions` - 16 edges
5. `authHeaders()` - 13 edges
6. `react` - 13 edges
7. `detectOperation()` - 11 edges
8. `Footer()` - 10 edges
9. `clearStoredToken()` - 10 edges
10. `Profile()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `LanguageSwitcher()` --calls--> `setLang()`  [EXTRACTED]
  components/LanguageSwitcher.tsx → lib/i18n.tsx
- `handleLogout()` --calls--> `clearStoredToken()`  [EXTRACTED]
  pages/solve.tsx → lib/api.ts
- `FormulaSheet()` --calls--> `useLanguage()`  [EXTRACTED]
  components/FormulaSheet.tsx → lib/i18n.tsx
- `PrivacyNotice()` --calls--> `useLanguage()`  [EXTRACTED]
  components/PrivacyNotice.tsx → lib/i18n.tsx
- `WaitlistForm()` --calls--> `useLanguage()`  [EXTRACTED]
  components/WaitlistForm.tsx → lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (17 total, 2 thin omitted)

### Community 0 - "useLanguage"
Cohesion: 0.12
Nodes (26): AudienceSection(), Footer(), Hero(), HowItWorks(), LanguageSwitcher(), Pricing(), PricingProps, Lang (+18 more)

### Community 1 - "solve.tsx"
Cohesion: 0.06
Nodes (57): AlternativeMethod, AlternativeMethodApi, AnswerCheckApi, CalcApiResponse, CHAINABLE_SET_OP_MAP, countSetExpressionOps(), detectOperation(), evenlySpacedTicks() (+49 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (35): eslintConfig, dependencies, katex, mathlive, next, react, react-dom, devDependencies (+27 more)

### Community 3 - "profile.tsx"
Cohesion: 0.13
Nodes (25): API_URL, AUTH_TOKEN_KEY, authHeaders(), clearStoredToken(), getStoredToken(), AnswerCheckApi, CalculationHistoryEntryApi, ExerciseCheckHistoryEntryApi (+17 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "waitlist.ts"
Cohesion: 0.16
Nodes (13): RFC-5322, nextConfig, basicAuthHeader(), basicAuthHeader(), handler(), WaitlistCountResponse, handler(), MailchimpConfig (+5 more)

### Community 6 - "login.tsx"
Cohesion: 0.15
Nodes (11): PrivacyNotice(), PrivacyNoticeProps, Status, WaitlistApiResponse, WaitlistForm(), WaitlistFormProps, setStoredToken(), Login() (+3 more)

### Community 7 - "Part 1 — Calculation-page findings, per competitor"
Cohesion: 0.10
Nodes (19): Broadly strong SaaS conversion design, Calcile — Competitive Analysis & Design Direction, Cross-competitor patterns (apply regardless of which competitor they came from), Desmos, FR/EN bilingual layout rules (apply to every batch, non-negotiable per `CLAUDE.md`), Marketing pages — concrete changes, Math competitors' marketing pages, Mathway (+11 more)

### Community 8 - "react"
Cohesion: 0.24
Nodes (7): FormulaSheet(), DEMO_STEPS, MathRender(), FORMULA_CATEGORIES, FormulaCategoryId, FormulaId, react

### Community 9 - "MathInput.tsx"
Cohesion: 0.15
Nodes (12): buildMatrixLatex(), IntrinsicElements, JSX, MathInput(), MathInputProps, MATRIX_SIZES, QuickSymbol, react (+4 more)

### Community 10 - "_app.tsx"
Cohesion: 0.29
Nodes (5): LanguageProvider(), setLang(), fraunces, plexMono, sourceSans

### Community 11 - "walk"
Cohesion: 0.83
Nodes (3): main(), ROOT, walk()

### Community 15 - "Calcile Landing"
Cohesion: 0.29
Nodes (6): Calcile Landing, Conventions already in place (verified in code, not assumed -- don't reinvent these), Current initiative: full interface redesign, graphify, Structure, Subagents available (.claude/agents/)

### Community 16 - "Calcile Landing"
Cohesion: 0.50
Nodes (3): Acknowledgments, Calcile Landing, How to contribute

## Knowledge Gaps
- **139 isolated node(s):** `DEMO_STEPS`, `react`, `JSX`, `IntrinsicElements`, `MathInputProps` (+134 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 160 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useLanguage`, `solve.tsx`, `package.json`, `profile.tsx`, `login.tsx`, `MathInput.tsx`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **Why does `useLanguage()` connect `useLanguage` to `react`, `solve.tsx`, `profile.tsx`, `login.tsx`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `next` connect `waitlist.ts` to `package.json`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `DEMO_STEPS`, `react`, `JSX` to the rest of the system?**
  _139 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useLanguage` be split into smaller, more focused modules?**
  _Cohesion score 0.12050739957716702 - nodes in this community are weakly interconnected._
- **Should `solve.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05552617662612375 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._