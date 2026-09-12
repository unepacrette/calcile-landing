import { useLanguage } from "@/lib/i18n";

export default function AudienceSection() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-semibold text-ink">
          {t.audience.heading}
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-3">
          {t.audience.items.map((audience) => (
            <div key={audience.title} className="flex flex-col bg-paper-raised p-6">
              <h3 className="font-display text-lg font-semibold text-ink">
                {audience.title}
              </h3>
              <p className="mt-3 flex-1 text-sm text-ink-soft">
                {audience.description}
              </p>
              <p className="mt-4 font-mono text-base font-medium text-mark">
                {audience.price}
              </p>
              {"annualNote" in audience && audience.annualNote && (
                <p className="mt-0.5 text-xs text-ink-faint">
                  {audience.annualNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
