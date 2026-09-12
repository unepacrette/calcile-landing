# Graph Report - calcile-landing  (2026-09-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 186 nodes · 306 edges · 15 communities (11 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4082b123`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 14

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 37 edges
2. `compilerOptions` - 16 edges
3. `LanguageSwitcher()` - 13 edges
4. `Profile()` - 9 edges
5. `react` - 9 edges
6. `Footer()` - 8 edges
7. `authHeaders()` - 8 edges
8. `clearStoredToken()` - 8 edges
9. `Solve()` - 7 edges
10. `scripts` - 6 edges

## Surprising Connections (you probably didn't know these)
- `LanguageSwitcher()` --calls--> `setLang()`  [EXTRACTED]
  components/LanguageSwitcher.tsx → lib/i18n.tsx
- `ResetPassword()` --calls--> `useLanguage()`  [EXTRACTED]
  pages/reset-password.tsx → lib/i18n.tsx
- `WaitlistForm()` --calls--> `useLanguage()`  [EXTRACTED]
  components/WaitlistForm.tsx → lib/i18n.tsx
- `About()` --calls--> `useLanguage()`  [EXTRACTED]
  pages/about.tsx → lib/i18n.tsx
- `Home()` --calls--> `useLanguage()`  [EXTRACTED]
  pages/index.tsx → lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (20): AudienceSection(), Footer(), Hero(), HowItWorks(), LanguageSwitcher(), Pricing(), PricingProps, Lang (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (23): MathRender(), AlternativeMethod, AlternativeMethodApi, CalcApiResponse, evenlySpacedTicks(), formatTick(), GlossaryEntry, GlossaryEntryApi (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (24): eslintConfig, dependencies, katex, next, react, react-dom, name, private (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (21): API_URL, AUTH_TOKEN_KEY, authHeaders(), clearStoredToken(), getStoredToken(), BillingCycle, BillingStatusApiResponse, BillingTier (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (10): RFC-5322, nextConfig, basicAuthHeader(), handler(), MailchimpConfig, MailchimpErrorBody, tagSubscriberByTier(), TIER_TAG_MAP (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (4): Status, WaitlistApiResponse, WaitlistForm(), WaitlistFormProps

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (4): ConfirmForm(), RequestForm(), ResetPassword(), Status

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (5): setStoredToken(), Login(), handleSubmit(), LoginSuccess, Status

### Community 11 - "Community 11"
Cohesion: 0.83
Nodes (3): main(), ROOT, walk()

## Knowledge Gaps
- **90 isolated node(s):** `PricingProps`, `Lang`, `LanguageContextValue`, `translations`, `AlternativeMethod` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 105 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.307) - this node is a cross-community bridge._
- **Why does `useLanguage()` connect `Community 0` to `Community 1`, `Community 3`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `next` connect `Community 5` to `Community 2`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `PricingProps`, `Lang`, `LanguageContextValue` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08547008547008547 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._