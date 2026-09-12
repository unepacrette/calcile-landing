import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

const CALENDLY_URL = "https://calendly.com/amaury-calcile"; // TODO: remplacer par l'URL Calendly réelle

export default function Hero() {
  const { t } = useLanguage();
  // Real, live count from Mailchimp (pages/api/waitlist-count.ts) -- null
  // until it loads, and stays null forever if it fails or isn't
  // configured. Never a fabricated fallback number: no count, no line.
  // Fetched client-side (not blocking the initial paint, per
  // apple-design's response-latency rule) rather than at build time, so
  // it's never stale between deploys.
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
      .catch(() => {
        // Silent: this is a trust-signal nicety, not core functionality
        // -- a failed fetch just means the line never appears.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-gradient-to-b from-violet-50 to-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {t.hero.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
          {t.hero.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#waitlist"
            className="rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition duration-150 hover:bg-violet-700 active:scale-95"
          >
            {t.hero.ctaWaitlist}
          </a>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-900 transition duration-150 hover:border-gray-400 hover:bg-gray-50 active:scale-95"
          >
            {t.hero.ctaDemo}
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-500">{t.hero.reassurance}</p>
        {/* Real, live Mailchimp count -- "premiers inscrits" (first
            signups) rather than framing it as mass adoption, deliberately:
            this is a small, honest, pre-launch number and the phrasing
            has to hold up at 6 just as well as at 600, consistent with
            the waitlist section's own existing "be among the first
            testers" heading. Never shown until the real number has
            loaded -- no placeholder, no guess. */}
        {waitlistCount !== null && (
          <p className="mt-3 text-sm font-medium text-violet-700">
            {t.hero.waitlistCountPrefix}{" "}
            <span className="font-bold">{waitlistCount}</span>{" "}
            {t.hero.waitlistCountSuffix}
          </p>
        )}
        {/* Real, sourced fact about the underlying engine (sympy.org /
            NumFOCUS-reported repo and citation counts) -- never a
            fabricated Calcile-specific usage number. See
            COMPETITIVE_ANALYSIS.md's trust-bar item: still pending real
            Calcile numbers (users, equations solved) from Amaury; this
            is a legitimate, verifiable trust signal in the meantime, not
            a placeholder for those. */}
        <p className="mt-2 text-xs text-gray-400">
          {t.hero.trustSignalPrefix}{" "}
          <a
            href="https://www.sympy.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
          >
            {t.hero.trustSignalLinkLabel}
          </a>
          {t.hero.trustSignalSuffix}
        </p>
      </div>
    </section>
  );
}
