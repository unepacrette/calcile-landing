import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.privacy.metaTitle}</title>
        <meta name="description" content={t.privacy.metaDescription} />
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.privacy.heading}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{t.privacy.lastUpdated}</p>
        <p className="mt-6 text-base leading-relaxed text-gray-700">
          {t.privacy.intro}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.privacy.dataHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.privacy.dataBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.privacy.useHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.privacy.useBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.privacy.thirdPartyHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.privacy.thirdPartyBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.privacy.rightsHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.privacy.rightsBody}
        </p>

        <p className="mt-10">
          <Link
            href="/licenses"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            {t.privacy.licensesLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
