import { useLanguage } from "@/lib/i18n";

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-rule bg-paper-raised">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-semibold text-ink">
          {t.howItWorks.heading}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {t.howItWorks.steps.map((title, index) => (
            <div key={title} className="relative pl-10">
              <span
                aria-hidden
                className="absolute left-0 top-0 font-display text-2xl font-medium italic text-mark"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[15px] text-ink-soft">{title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
