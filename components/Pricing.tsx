import { useLanguage } from "@/lib/i18n";

type PricingProps = {
  onSelectTier: (tierName: string) => void;
};

export default function Pricing({ onSelectTier }: PricingProps) {
  const { t } = useLanguage();

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {t.pricing.heading}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {t.pricing.tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-xl border p-6 ${
                index === 1
                  ? "border-violet-600 bg-violet-50 shadow-md"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {tier.name}
              </h3>
              <p className="mt-1 text-2xl font-bold text-violet-700">
                {tier.price}
              </p>
              {"annualNote" in tier && tier.annualNote && (
                <p className="mt-1 text-xs font-medium text-violet-600">
                  {tier.annualNote}
                </p>
              )}
              <p className="mt-3 text-sm text-gray-600">{tier.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-700">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden className="text-violet-600">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                onClick={() => onSelectTier(tier.name)}
                className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                  index === 1
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "border border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-100"
                }`}
              >
                {t.pricing.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
