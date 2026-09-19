import { useEffect, useState } from "react";
import MathRender from "@/components/MathRender";
import { useLanguage } from "@/lib/i18n";

const CALENDLY_URL = "https://calendly.com/amaury-calcile"; // TODO: remplacer par l'URL Calendly réelle

// Real output of engine.compute_derivative("x^2\sin(x)", 1) (calcile-api,
// solver/sympy_engine.py) -- copied verbatim, not retyped by hand, so
// the demo never drifts from what the real engine actually produces.
// Swapped from the original solve-a-quadratic example ("change
// l'exemple... un exemple actuel et surtout beaucoup plus vendeur") --
// a product-rule derivative is a far more relatable "I don't understand
// the steps" moment for the actual audience (calc students/teachers)
// than a quadratic most can already factor by eye, and its one is_key
// step (applying the product rule) is a genuine, distinct "aha" moment
// the two-tone step badge is built to highlight.
const DEMO_STEPS = [
  {
    description: "Expression de départ.",
    latex: "x^{2} \\sin{\\left(x \\right)}",
    isKey: false,
  },
  {
    description: "On applique la règle du produit : (u·v)' = u'·v + u·v'.",
    latex:
      "\\frac{d}{d x} x^{2} \\sin{\\left(x \\right)} = x^{2} \\cos{\\left(x \\right)} + 2 x \\sin{\\left(x \\right)}",
    isKey: true,
  },
  {
    description: "Résultat de la dérivée.",
    latex: "x^{2} \\cos{\\left(x \\right)} + 2 x \\sin{\\left(x \\right)}",
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

        <div className="relative rounded-2xl border border-rule bg-paper-raised px-6 py-6 shadow-[0_8px_24px_-8px_rgb(28_39_64_/_0.12),0_2px_6px_-2px_rgb(28_39_64_/_0.06)]">
          <span className="absolute -top-[11px] left-6 rounded-full bg-mark px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-paper-raised">
            {t.hero.demoTag}
          </span>
          <p className="font-mono text-[12.5px] tracking-wide text-ink-faint">
            {t.hero.demoInputLabel}&nbsp;x²sin(x)
          </p>
          <div className="mt-3.5 flex flex-col gap-3.5">
            {DEMO_STEPS.map((step, index) => (
              <div
                key={index}
                className={
                  step.isKey
                    ? "-mx-3 flex items-start gap-3 rounded-xl bg-mark-soft px-3 py-2.5"
                    : "flex items-start gap-3"
                }
              >
                <span
                  className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
                    step.isKey ? "bg-mark text-paper-raised" : "bg-rule text-ink-soft"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1 pt-px">
                  <p
                    className={`text-[12.5px] ${
                      step.isKey ? "font-semibold text-mark-strong" : "text-ink-soft"
                    }`}
                  >
                    {step.isKey ? `${t.hero.demoKeyStepPrefix} — ` : ""}
                    {step.description}
                  </p>
                  <div className="mt-1 overflow-x-auto text-[17px] text-ink">
                    <MathRender latex={step.latex} displayMode={false} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-check-soft bg-check-soft px-4 py-3.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="flex-none"
            >
              <circle cx="10" cy="10" r="9" className="fill-check" />
              <path
                d="M6 10.5l2.5 2.5L14 7.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="overflow-x-auto text-lg text-ink">
              <MathRender
                latex="x^{2} \cos{\left(x \right)} + 2 x \sin{\left(x \right)}"
                displayMode={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
