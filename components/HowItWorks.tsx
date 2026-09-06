import { useLanguage } from "@/lib/i18n";

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {t.howItWorks.heading}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {t.howItWorks.steps.map((title, index) => (
            <div key={title} className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-4 text-base text-gray-700">{title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
