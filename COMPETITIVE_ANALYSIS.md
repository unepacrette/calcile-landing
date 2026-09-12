# Calcile — Competitive Analysis & Design Direction

Produced by `market-analyst`, reviewed pending Amaury's approval before `frontend-ui` implements anything visual from it. Research was done via real web search/live page capture (dated 2026-09-12) — see inline sources. Two angles researched, as required: the calculation/results page (direct comparison for `/solve`) and marketing/conversion patterns (direct comparison for the landing pages and pricing).

---

## Part 1 — Calculation-page findings, per competitor

### WolframAlpha
Single-column pod layout, no sidebar. Math rendered in a large, high-contrast serif/italic typeset style, clearly set apart from small gray sans-serif UI labels ("Input:", "Result:"). Steps are **completely and unconditionally gated** — even a trivial `12*15` query hides the derivation behind a large graphic upsell panel, not a partial teaser. Trust reads through provenance copy ("FROM THE MAKERS OF WOLFRAM LANGUAGE AND MATHEMATICA"), not visual polish. One accent color (orange) used consistently for logo, CTA, and every upsell.
**Adopt**: the serif/italic math-vs-sans-serif-chrome typographic split; provenance/authority copy as a trust signal at solo-founder scale ("built by a math student," stated plainly, is Calcile's honest equivalent).
**Don't adopt**: binary all-or-nothing step gating — Calcile's current model already shows all steps to authenticated users, which is closer to Photomath's more generous approach (see below) and shouldn't regress toward Wolfram's harder gate.

### Symbolab
Full-width with a persistent AI-chat sidebar and an explicit `Steps / Graph / Examples / Related` tab bar. Steps are shown by default (soft daily-quota gate, not a hard wall), with pale-blue highlighting on "key" step cards vs. plain white for intermediate lines — the only competitor found using a two-tone step hierarchy. Offers a page-level "one step at a time" pacing toggle and a per-step collapse for an AI explanation layer, independent of the math itself. Reads as "study assistant" rather than "serious tool" — persistent mascot, embedded ad in the sidebar, a "Solve by: [method]" switcher.
**Adopt**: the key-step vs. intermediate-step visual distinction (directly solves the density problem in a long derivation); the per-step collapsible explanation as an optional add-on rather than forcing all-or-nothing display; a "solve by method" switcher genuinely fits Calcile as a symbolic engine with multiple valid methods.
**Don't adopt**: the persistent chat-mascot framing and embedded ads — inconsistent with Calcile's "serious tool" positioning and with being a clean paid product with no free ad-supported tier.

### Mathway
Chat-bubble UI, not a document layout — most structurally different of the five. Answer shown first as a one-line bubble; steps are a single click away, then hard-gated behind a "Mathway+" modal. Homepage headline promises "Free step-by-step solutions" while the product actually gates all steps — a real messaging/product mismatch, flagged explicitly as something to avoid.
**Adopt**: nothing structural (the chat metaphor doesn't fit a symbolic-solver results page) — but the mismatch itself is a cautionary example: whatever Calcile's pricing page promises about steps must match what `/solve` actually delivers, exactly.
**Don't adopt**: chat-bubble layout, injected cross-sell messages disguised as assistant replies, third-party display ads on a paid product's free tier.

### Photomath
Camera-first, mobile-only — no directly comparable web results page, so most of its layout (screen-to-screen navigation, camera input) doesn't transfer. One technique is directly transferable and is the strongest single finding across all five: **the specific sub-expression being transformed in a step is highlighted in orange/red with a short annotation**, rather than color-coding the whole step block. This is what actually solves "how do you keep a long derivation from overwhelming the user" at the token level, not just the step level. Photomath's paywall model also stands out: core step-by-step is a permanent free promise ("will always remain free of cost"); the paid tier sells a *richer* layer (400+ animated video tutorials with voiceover) rather than gating the core steps.
**Adopt**: highlight-the-changed-term-not-the-whole-step, applied to Calcile's step cards; the "free = correct steps, paid = deeper explanation" framing as the honest version of Calcile's own free/paid split.
**Don't adopt**: nothing structural transfers (mobile screen navigation, camera input) — noted as out of scope, not a gap.

### Desmos
Grapher, not a step-by-step solver — no algebraic derivation feature exists, confirmed via live capture and search. Split-pane (expression list + canvas), zero marketing chrome on the tool page itself, no ads, per-object color assignment instead of a fixed answer/steps color scheme. Reads as trustworthy through restraint (grid-paper aesthetic) rather than authority copy.
**Adopt**: restraint as a trust signal — no ads, no gamification, no chrome inside the actual working surface once a user is past the marketing page.
**Don't adopt**: the entire premise (graph-first, no derivation) has no analog for a symbolic step-by-step product; not applicable to `/solve`'s core purpose.

### Cross-competitor patterns (apply regardless of which competitor they came from)
1. **Answer before steps, always** — universal across Wolfram, Symbolab, Mathway, Photomath. Calcile's `/solve` should keep leading with the result, steps below/after (already the case per the current `result.resultLatex` rendering after `result.steps` in the shared result card — confirm this ordering is preserved, don't invert it).
2. **Math notation is always visually distinct from UI chrome** — serif/italic typeset, larger than surrounding sans-serif labels, across every competitor. Calcile already renders math through `MathRender`/KaTeX; the design direction (Part 3) should make sure surrounding UI text uses a clearly different (sans-serif, smaller, lower-contrast) treatment so this distinction is deliberate, not incidental.
3. **No competitor uses tabs/pagination/table-of-contents for a long derivation** — there's no proven pattern to copy for a genuinely long solution. Calcile should originate something here rather than search for a precedent; Part 3 proposes a direction.
4. **Method-switching is a real, non-universal feature** (Symbolab's "Solve by:", Mathway's method picker) that fits a symbolic engine with multiple valid solving paths — Calcile already has `alternative_methods` in its API response shape (confirmed in `solve.tsx`), so this isn't a new feature request, it's a presentation upgrade of something already wired end-to-end.

---

## Part 2 — Conversion findings, per competitor/example

### Math competitors' marketing pages
- **WolframAlpha Pro**: quantifies paid-tier limits numerically (compute-time multiplier, upload size) instead of vague adjectives — concrete and hard to fake, worth copying the *mechanism*. No trust signals, weak generic CTA ("SELECT") — a low bar Calcile should clear easily.
- **Symbolab**: 3 billing periods (not feature tiers) with an annual plan bracketed between full-price monthly and a "not much cheaper" semi-annual, making annual look inevitable — a real anchoring trick, but the badge text ("Save 65%") is short English that won't survive French translation ("Économisez 65 %") without a flexible-width badge.
- **Photomath Plus**: the single strongest value-prop pattern found — "step-by-step will always remain free... Plus is for *understanding*, like a teacher explaining on a whiteboard" — free solves it, paid explains it deeper. Concrete, countable asset ("400+ Animated Tutorials") rather than vague "more features."
- **Mathway**: hero headline is outcome-led and jargon-free ("Got a math problem? Get the steps."), states the free-tier promise explicitly in FAQ language on the homepage itself, and puts a numeric trust bar right under the hero ("5B+ Problems solved," "20+ Years," "Backed by Chegg") — the most transferable trust pattern for a solo founder with no logo wall.
- **Desmos**: fully free, no landing/marketing chrome at all — proves "just the tool" works as a UX approach, but not usable by Calcile since Calcile needs subscription revenue and does have a paywall to explain.

### Broadly strong SaaS conversion design
- **Linear**: hero shows real product screenshots, not illustration. Identical CTA text ("Get started") across every self-serve pricing tier — removes a decision point. Documented "Linear design" aesthetic: strict single-column top-to-bottom scroll, no side-by-side competing panels, bold display type, minimal simultaneous choices per section.
- **Stripe**: exact pricing math shown inline, objections pre-empted via an FAQ directly on the pricing page ("Do you have setup fees?" → answered right there). Every trust claim carries one attached number ("+5.5% uplift," "99.999% uptime"), never a bare adjective.
- **Notion**: freemium model gates *scale and depth* (guest count, page history) not *core usability* — the product stays generous for free, upgrade triggers appear naturally as usage grows. Recommended middle tier is visually distinct (bordered/elevated) and reuses the same low-friction CTA verb as other self-serve tiers.
- **Superhuman**: branded CTA verb ("Get Superhuman") instead of generic "Sign up," social proof placed immediately under the hero before any feature explanation.

### Synthesized conversion principles (the ones that matter for Calcile specifically)
1. Hero leads with outcome ("get every step, not just the answer"), not category ("symbolic math engine").
2. State the free-tier promise explicitly, in plain language, near the hero or the pricing entry point — this is the single most repeated pattern across Mathway and Photomath and directly pre-empts the visitor's first objection.
3. Frame the paid tier as *understanding*, not *unlocking basic function* — matches Calcile's actual product shape (compute is the commodity, explanation depth is the differentiator) better than a hard step-gate would.
4. Gate scale/depth (saved history, export formats, number of saved solves), not core usability, per Notion's model — keep `/solve` fully capable for a one-off free use.
5. Quantify every paid-tier differentiator with a real number, never an adjective.
6. Put a numeric trust bar directly under the hero using Calcile's own real numbers, however modest, rather than an empty trust-signal section or invented claims.
7. Pre-empt the top pricing objection ("is a card required for the free plan?", "can I cancel anytime?") with a short FAQ beside the pricing table.
8. Single-column, strictly top-to-bottom marketing page flow — this is also the safest structural choice for FR/EN parity (see below), since it avoids forcing two side-by-side blocks of different natural language length to stay vertically aligned.

---

## Part 3 — Synthesized design direction for Calcile (reconciled with `apple-design`)

This section is written to be specific enough to brief `frontend-ui` from directly, and applies the `apple-design` skill's principles (read in full, not namechecked) to *how* each change should feel, on top of *what* the research above says to change.

### Typography
- Keep KaTeX-rendered math visually distinct from UI chrome, per the universal cross-competitor pattern: math stays serif/italic (KaTeX's default), UI text (labels, buttons, nav) stays the current sans-serif, and the size/contrast gap between them should be deliberate, not just whatever the default happens to produce — increase the size ratio of rendered math vs. surrounding body text where they currently sit too close.
- Apply `apple-design`'s typography rules (§15): tracking is size-specific — the current `text-4xl`/`text-5xl` hero heading (`Hero.tsx`) should get slightly negative letter-spacing as it scales up (`tracking-tight` is already applied — verify the actual computed value is meaningfully negative at the largest breakpoint, not just the class name present), while body text and step-card copy stay near `0`. Build hierarchy from weight + size + leading together, not size alone.
- Respect Dynamic-Type-equivalent scaling: spacing in step cards and the pricing grid should scale with `rem`/`em`, not fixed `px`, per the skill's rule — check current step-card padding (`py-2 pl-4 pr-3` in `solve.tsx`) for hardcoded values that don't scale.

### The `/solve` result card — concrete changes
1. **Preserve answer-before-steps ordering** (already correct — `result.resultLatex` renders after `result.steps`, per the existing code; do not invert this).
2. **Add a two-tone step hierarchy**, adapted from Symbolab: distinguish a "key move" step from a routine intermediate line. Concretely, the current uniform `border-l-[3px] border-violet-300 bg-gray-50/60` treatment for every step (`solve.tsx` lines ~1170, ~1269) should differentiate at least the step(s) that represent the actual method decision (e.g., "factor," "apply the quadratic formula," "integrate by parts") from steps that are routine algebraic simplification — this requires `backend-solver` to flag which steps are "key" in the API response (a new boolean field or similar), so this is cross-repo: note it for the orchestrator, not something `frontend-ui` can fully solve alone.
3. **Highlight the changed sub-expression within a step**, adapted from Photomath — the single strongest transferable finding. Where `MathRender` renders a step's `latex`, the specific term that changed from the previous step should be visually distinguished (color/weight), not the whole line. This is more involved than #2 (requires either backend annotation of what changed, or a diff computed client-side between consecutive `steps[i-1].latex` and `steps[i].latex`) — flag as a design-direction item requiring a technical feasibility check by `frontend-ui`/`backend-solver` before committing to it for the first batch; if not feasible in the first pass, defer it rather than block the rest of the redesign on it.
4. **For long derivations**, since no competitor has a proven pattern to copy: adopt Symbolab's "one step at a time" pacing toggle as the safest originated solution — an optional per-solve toggle between "show all steps" (current, keep as default) and "reveal one step at a time" (new), using `apple-design`'s interruptibility principles (§3) for the reveal transition itself — spring-based, interruptible, never a fixed-duration CSS transition the user has to wait out.
5. **Method-switching**: `alternative_methods` already exists in the API response and is already rendered (confirmed in `solve.tsx` around line 1266) — this is a presentation upgrade, not new plumbing. Consider surfacing it more prominently (e.g., a visible "solve by: [method]" selector before the result, per Symbolab/Mathway) rather than only as a collapsed alternative section, since research shows this is a real, valued feature for a symbolic engine — but this is a UX call for `frontend-ui` to make concrete, not a mandate to change the current collapsed presentation if there's a good reason to keep it.
6. **Motion**: any new reveal/expand/collapse interaction introduced here (step pacing toggle, alternative-methods expansion) should follow `apple-design`'s defaults — critically damped springs (`damping 1.0`, `response 0.3–0.4`) for anything that isn't a flick/drag gesture, animate from the current on-screen value on interrupt, never lock input during the transition.

### Marketing pages — concrete changes
1. **Hero** (`Hero.tsx`): current headline/subtitle are already externalized via `t.hero.title`/`t.hero.subtitle` (good — no i18n rework needed structurally), but the copy itself (owned by Amaury, not this document) should shift toward outcome-led language per the synthesized principles — this document flags the *pattern* to write to, not the final French/English copy itself, which needs Amaury's own product judgment.
2. **State the free-tier promise explicitly**, near the hero or directly above `Pricing.tsx`'s tier grid — a short, plainly worded sentence answering "is there really a free way to try this," per Mathway/Photomath's pattern. New i18n keys needed under `hero` or a new `pricing.freePromise`-style key, in both `fr` and `en`, matching Photomath's tone: the correct steps are free, deeper explanation is what's paid — provided this framing genuinely matches Calcile's actual free/paid split (confirm with Amaury before writing final copy; this document proposes the pattern, not the final product decision).
3. **Numeric trust bar under the hero**: add a stat row using Calcile's own real numbers (equations solved, active users, uptime — whatever is genuinely true and available) rather than an empty/generic trust section. This is new: no such element currently exists in `Hero.tsx`. Needs real numbers from Amaury before copy is finalized — do not fabricate placeholder statistics and ship them.
4. **Pricing page** (`Pricing.tsx`): the middle tier is already visually distinct (`index === 1` gets the violet border/background/shadow treatment) — this already matches the Notion/Linear "recommended tier" pattern, keep it. Two additions worth making: (a) quantify differentiators between tiers with real numbers where currently a plain feature-list bullet exists (check `t.pricing.tiers[].features` for vague wording vs. countable deltas), (b) add a short FAQ or one-line reassurance directly below/beside the grid pre-empting "is a card required for the free tier" — a new small component or an addition to `Pricing.tsx`, with matching `fr`/`en` keys.
5. **CTA consistency**: current CTA (`t.pricing.cta`) is already identical across all three tiers (confirmed in code — same `{t.pricing.cta}` used for every tier), which already matches the Linear/Notion low-friction pattern — no change needed here, explicitly noting it as a thing that's *already right* and shouldn't be "fixed."
6. **Section flow**: keep marketing pages single-column, top-to-bottom (already the case per `Hero`/`Pricing`'s full-width section stacking) — do not introduce side-by-side competing panels anywhere in the redesign, both for the Linear-style conversion reasoning and for FR/EN safety (below).
7. **Materials/depth**: the current hero background (`bg-gradient-to-b from-violet-50 to-white`) is flat, not translucent-layered. Where the redesign introduces any floating/sticky chrome (a sticky nav, a sticky CTA on scroll, a modal), apply `apple-design`'s materials guidance (§12): `backdrop-filter` blur + semi-transparent background rather than an opaque bar, content scrolling underneath.

### FR/EN bilingual layout rules (apply to every batch, non-negotiable per `CLAUDE.md`)
- Any new pricing badge, stat-bar label, or short CTA text must be sized against the **French** string, not the English one — `min-width` not fixed `width`, no `white-space: nowrap` on badges, allow two-line wraps on table/column headers by reserving row height for it.
- The current `Pricing.tsx` tier cards use `flex flex-col` with natural height (no fixed height) — this is already safe; preserve this pattern for any new pricing-adjacent component rather than introducing a fixed-height card.
- Any new short punchy CTA verb (e.g., a Superhuman-style branded CTA) must be tested against its French translation's actual rendered width before being locked into a fixed-width button class.

### What NOT to change, and why
1. **`/solve`'s answer-before-steps ordering, and the fact that all steps are shown to authenticated users with no internal step-gating.** This already matches the more generous end of the competitor spectrum (closer to Photomath's "steps stay free" model than Wolfram/Mathway's hard gate) and is a legitimate, defensible product position — don't introduce artificial step-gating in the name of "looking more like a paywalled competitor."
2. **The existing `Operation`-per-tab architecture and shared result-card pattern in `solve.tsx`.** It already correctly separates generic-shaped responses from genuinely different ones (`/api/plot`) — the redesign should restyle within this architecture, not replace it; nothing in the competitive research suggests a structural reason to.
3. **The already-distinct, bordered middle pricing tier and identical CTA text across tiers in `Pricing.tsx`.** Already matches best-observed practice (Notion, Linear) — flagged explicitly above so it isn't accidentally "redesigned" for its own sake.
4. **KaTeX as the math renderer.** No competitor researched suggested a reason to move off a standard, correct math-typesetting library — the existing "no new dependency without necessity" rule in `CLAUDE.md` applies here as much as anywhere.
5. **Desmos's zero-marketing-chrome / graph-first approach**, and **Photomath's camera-first mobile flow** — both explicitly out of scope, not because they're bad, but because they solve a different product's problem (free grapher with no paywall to explain; camera-input mobile app) and don't transfer to Calcile's typed-input web solver with a real paywall to explain.

---

## Sequencing note for the orchestrator

This document is the required input before `frontend-ui` starts any visual implementation (per `CLAUDE.md`'s "Current initiative" section and `frontend-ui.md`'s own rule). Two items above are flagged as needing a decision from Amaury before final copy/numbers are written (the free-tier promise wording, and the real numbers for the trust bar) — implementation of the surrounding layout/structure can proceed without blocking on that copy, but the copy itself should not be invented. One item (highlighting the changed sub-expression per step) is flagged as needing a feasibility check across `backend-solver`/`frontend-ui` before committing to it for the first batch, and should be deferred rather than block the rest of the redesign if it turns out to require backend changes beyond the redesign's current scope.

Suggested implementation order (per `frontend-ui.md`'s existing "Sequencing" section, confirm with Amaury before locking in): marketing pages first (hero free-tier promise + trust bar + pricing FAQ), then `/solve`'s result card (two-tone steps, pacing toggle), then remaining pages.
