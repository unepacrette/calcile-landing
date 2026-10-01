# Graph Report - calcile-landing  (2026-10-01)

## Corpus Check
- 39 files · ~34,130 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 290 nodes · 482 edges · 17 communities (14 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d36352b5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useLanguage
- solve.tsx
- package.json
- profile.tsx
- compilerOptions
- waitlist.ts
- devDependencies
- Part 1 — Calculation-page findings, per competitor
- history.tsx
- MathInput.tsx
- _app.tsx
- walk
- next-env.d.ts
- postcss.config.mjs
- Calcile Landing
- Calcile Landing

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 41 edges
2. `Solve()` - 25 edges
3. `compilerOptions` - 16 edges
4. `LanguageSwitcher()` - 14 edges
5. `authHeaders()` - 13 edges
6. `react` - 13 edges
7. `detectOperation()` - 11 edges
8. `clearStoredToken()` - 10 edges
9. `Profile()` - 9 edges
10. `Footer()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `LanguageSwitcher()` --calls--> `setLang()`  [EXTRACTED]
  components/LanguageSwitcher.tsx → lib/i18n.tsx
- `handleLogout()` --calls--> `clearStoredToken()`  [EXTRACTED]
  pages/solve.tsx → lib/api.ts
- `loadTier()` --calls--> `authHeaders()`  [EXTRACTED]
  pages/solve.tsx → lib/api.ts
- `FormulaSheet()` --calls--> `useLanguage()`  [EXTRACTED]
  components/FormulaSheet.tsx → lib/i18n.tsx
- `Solve()` --calls--> `getStoredToken()`  [EXTRACTED]
  pages/solve.tsx → lib/api.ts

## Import Cycles
- None detected.

## Communities (17 total, 2 thin omitted)

### Community 0 - "useLanguage"
Cohesion: 0.10
Nodes (28): AudienceSection(), Footer(), Hero(), HowItWorks(), LanguageSwitcher(), Pricing(), PricingProps, Status (+20 more)

### Community 1 - "solve.tsx"
Cohesion: 0.05
Nodes (58): AlternativeMethod, AlternativeMethodApi, AnswerCheckApi, CalcApiResponse, CHAINABLE_SET_OP_MAP, countSetExpressionOps(), detectOperation(), evenlySpacedTicks() (+50 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (26): eslintConfig, dependencies, katex, mathlive, next, react, react-dom, name (+18 more)

### Community 3 - "profile.tsx"
Cohesion: 0.11
Nodes (26): API_URL, AUTH_TOKEN_KEY, authHeaders(), clearStoredToken(), getStoredToken(), setStoredToken(), History(), loadCalculations() (+18 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "waitlist.ts"
Cohesion: 0.16
Nodes (13): RFC-5322, nextConfig, basicAuthHeader(), basicAuthHeader(), handler(), WaitlistCountResponse, handler(), MailchimpConfig (+5 more)

### Community 6 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 7 - "Part 1 — Calculation-page findings, per competitor"
Cohesion: 0.10
Nodes (19): Broadly strong SaaS conversion design, Calcile — Competitive Analysis & Design Direction, Cross-competitor patterns (apply regardless of which competitor they came from), Desmos, FR/EN bilingual layout rules (apply to every batch, non-negotiable per `CLAUDE.md`), Marketing pages — concrete changes, Math competitors' marketing pages, Mathway (+11 more)

### Community 8 - "history.tsx"
Cohesion: 0.18
Nodes (10): FormulaSheet(), DEMO_STEPS, MathRender(), FORMULA_CATEGORIES, FormulaCategoryId, FormulaId, AnswerCheckApi, CalculationHistoryEntryApi (+2 more)

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
- **138 isolated node(s):** `DEMO_STEPS`, `react`, `JSX`, `IntrinsicElements`, `MathInputProps` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 159 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `history.tsx` to `useLanguage`, `solve.tsx`, `package.json`, `profile.tsx`, `MathInput.tsx`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `useLanguage()` connect `useLanguage` to `history.tsx`, `solve.tsx`, `profile.tsx`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `next` connect `waitlist.ts` to `package.json`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `DEMO_STEPS`, `react`, `JSX` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useLanguage` be split into smaller, more focused modules?**
  _Cohesion score 0.10083256244218317 - nodes in this community are weakly interconnected._
- **Should `solve.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05427547363031234 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._