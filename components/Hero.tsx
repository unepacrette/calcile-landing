import { useLanguage } from "@/lib/i18n";

const CALENDLY_URL = "https://calendly.com/amaury-calcile"; // TODO: remplacer par l'URL Calendly réelle

export default function Hero() {
  const { t } = useLanguage();

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
      </div>
    </section>
  );
}
