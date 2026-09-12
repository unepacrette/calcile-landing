import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.about.metaTitle}</title>
        <meta name="description" content={t.about.metaDescription} />
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-display font-semibold text-ink">{t.about.heading}</h1>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">
          {t.about.intro}
        </p>

        <h2 className="mt-12 text-xl font-display font-semibold text-ink">
          {t.about.howItWorksHeading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          {t.about.howItWorksIntro}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {t.about.valueAdds.map((item) => (
            <div key={item.title} className="rounded-lg bg-paper p-5">
              <h3 className="text-sm font-display font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-display font-semibold text-ink">
          {t.about.transparencyHeading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          {t.about.transparencyBody}
        </p>

        <p className="mt-8">
          <Link
            href="/licenses"
            className="text-sm font-semibold text-mark-strong hover:underline"
          >
            {t.about.licensesLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
