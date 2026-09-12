import { useLanguage } from "@/lib/i18n";

type PricingProps = {
  onSelectTier: (tierName: string) => void;
};

export default function Pricing({ onSelectTier }: PricingProps) {
  const { t } = useLanguage();

  return (
    <section className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-semibold text-ink">
          {t.pricing.heading}
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {t.pricing.tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-xl border bg-paper-raised p-6 ${
                index === 1 ? "border-mark shadow-[0_0_0_1px_var(--color-mark)]" : "border-rule"
              }`}
            >
              <h3 className="font-display text-lg font-semibold text-ink">
                {tier.name}
              </h3>
              <p className="mt-1 font-mono text-2xl text-ink">{tier.price}</p>
              {"annualNote" in tier && tier.annualNote && (
                <p className="mt-1 text-xs font-medium text-ink-faint">
                  {tier.annualNote}
                </p>
              )}
              <p className="mt-3 text-sm text-ink-soft">{tier.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden className="font-semibold text-check">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                onClick={() => onSelectTier(tier.name)}
                className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition duration-150 active:scale-95 ${
                  index === 1
                    ? "bg-mark text-paper-raised hover:bg-mark-strong"
                    : "border border-rule-strong text-ink hover:border-ink-soft"
                }`}
              >
                {t.pricing.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-md text-center text-sm text-ink-soft">
          <span className="font-medium text-ink">{t.pricing.faqQuestion}</span>{" "}
          {t.pricing.faqAnswer}
        </p>
      </div>
    </section>
  );
}
