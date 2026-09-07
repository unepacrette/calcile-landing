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
        <h1 className="text-3xl font-bold text-gray-900">{t.about.heading}</h1>
        <p className="mt-6 text-base leading-relaxed text-gray-700">
          {t.about.intro}
        </p>

        <h2 className="mt-12 text-xl font-bold text-gray-900">
          {t.about.howItWorksHeading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-700">
          {t.about.howItWorksIntro}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {t.about.valueAdds.map((item) => (
            <div key={item.title} className="rounded-lg bg-gray-50 p-5">
              <h3 className="text-sm font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">
          {t.about.transparencyHeading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-700">
          {t.about.transparencyBody}
        </p>

        <p className="mt-8">
          <Link
            href="/licenses"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            {t.about.licensesLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
