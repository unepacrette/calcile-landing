import { useLanguage } from "@/lib/i18n";

export default function AudienceSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {t.audience.heading}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {t.audience.items.map((audience) => (
            <div
              key={audience.title}
              className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {audience.title}
              </h3>
              <p className="mt-3 flex-1 text-sm text-gray-600">
                {audience.description}
              </p>
              <p className="mt-4 text-base font-semibold text-violet-700">
                {audience.price}
              </p>
              {"annualNote" in audience && audience.annualNote && (
                <p className="mt-0.5 text-xs font-medium text-violet-500">
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
