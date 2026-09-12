import { useEffect, useState } from "react";
import MathRender from "@/components/MathRender";
import { useLanguage } from "@/lib/i18n";

const CALENDLY_URL = "https://calendly.com/amaury-calcile"; // TODO: remplacer par l'URL Calendly réelle

// Real output of engine.solve_equation("x^2 - 4 = 0") (calcile-api,
// solver/sympy_engine.py) -- copied verbatim, not retyped by hand, so
// the demo never drifts from what the real engine actually produces.
// is_key matches the real value for each step; there is no
// highlighted_latex on this particular example (the diff between step 1
// and step 2's LaTeX is a full rewrite, past the "too much changed"
// threshold -- shown as-is rather than forcing a highlight that
// wouldn't be real).
const DEMO_STEPS = [
  {
    description: "On regroupe tous les termes du même côté de l'égalité.",
    latex: "x^{2} - 4 = 0",
    isKey: false,
  },
  {
    description:
      "On factorise l'expression : un produit de facteurs est nul si l'un des facteurs est nul.",
    latex: "\\left(x - 2\\right) \\left(x + 2\\right) = 0",
    isKey: true,
  },
  {
    description: "On obtient l'ensemble des solutions.",
    latex: "\\left\\{-2, 2\\right\\}",
    isKey: false,
  },
];

export default function Hero() {
  const { t } = useLanguage();
  // Real, live count from Mailchimp (pages/api/waitlist-count.ts) --
  // fetched but deliberately not rendered below yet: the real number is
  // still too small to be a useful trust signal (Amaury's call). Kept
  // wired up rather than removed so re-enabling it later is a one-line
  // change, not a rebuild.
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/waitlist-count")
      .then((res) => res.json())
      .then((body: { count: number | null }) => {
        if (!cancelled && typeof body.count === "number") {
          setWaitlistCount(body.count);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  void waitlistCount; // kept for when the trust line below is re-enabled

  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-mark">
            {t.hero.eyebrow}
          </p>
          <h1 className="mt-3 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {t.hero.title}{" "}
            <span className="italic text-mark">{t.hero.titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg text-ink-soft">
            {t.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href="#waitlist"
              className="rounded-lg bg-mark px-6 py-3 text-base font-semibold text-paper-raised shadow-sm transition duration-150 hover:bg-mark-strong active:scale-95"
            >
              {t.hero.ctaWaitlist}
            </a>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-rule-strong bg-transparent px-6 py-3 text-base font-semibold text-ink transition duration-150 hover:border-ink-soft active:scale-95"
            >
              {t.hero.ctaDemo}
            </a>
          </div>
          <div className="mt-6 flex flex-col gap-1.5">
            <p className="text-sm text-ink-soft">{t.hero.reassurance}</p>
            <p className="text-xs text-ink-faint">
              {t.hero.trustSignalPrefix}{" "}
              <a
                href="https://www.sympy.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink-soft underline decoration-rule-strong underline-offset-2 hover:text-ink"
              >
                {t.hero.trustSignalLinkLabel}
              </a>
              {t.hero.trustSignalSuffix}
            </p>
          </div>
        </div>

        <div className="relative rounded-xl border border-rule bg-paper-raised px-6 py-5 shadow-[0_1px_0_var(--color-rule)]">
          <span className="absolute -top-[11px] left-6 rounded-full bg-mark px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper-raised">
            {t.hero.demoTag}
          </span>
          <span
            aria-hidden
            className="absolute bottom-0 left-[46px] top-0 w-px bg-mark-soft"
          />
          <p className="pl-5 font-mono text-[13px] text-ink-faint">
            {t.hero.demoInputLabel}&nbsp;x² − 4 = 0
          </p>
          {DEMO_STEPS.map((step, index) => (
            <div key={index}>
              {index > 0 && <div className="my-1.5 ml-5 h-px bg-rule" />}
              <div className="flex gap-3 py-2 pl-5">
                <span
                  className={`w-3.5 flex-none pt-0.5 font-mono text-xs ${
                    step.isKey ? "font-semibold text-mark" : "text-ink-faint"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-[12.5px] ${
                      step.isKey ? "font-semibold text-mark-strong" : "text-ink-soft"
                    }`}
                  >
                    {step.isKey ? `${t.hero.demoKeyStepPrefix} — ` : ""}
                    {step.description}
                  </p>
                  <div className="mt-1 overflow-x-auto text-base text-ink">
                    <MathRender latex={step.latex} displayMode={false} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="ml-5 mt-2 rounded-lg border border-rule bg-check-soft px-4 py-3.5 font-mono text-lg text-ink">
            x ∈ {"{"} −2, 2 {"}"}
          </div>
        </div>
      </div>
    </section>
  );
}
