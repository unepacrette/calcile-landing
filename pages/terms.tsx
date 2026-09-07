import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Terms() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.terms.metaTitle}</title>
        <meta name="description" content={t.terms.metaDescription} />
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-bold text-gray-900">{t.terms.heading}</h1>
        <p className="mt-2 text-sm text-gray-500">{t.terms.lastUpdated}</p>
        <p className="mt-6 text-base leading-relaxed text-gray-700">
          {t.terms.intro}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.terms.serviceHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.terms.serviceBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.terms.accuracyHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.terms.accuracyBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.terms.accountsHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.terms.accountsBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.terms.changesHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.terms.changesBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.terms.contactHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.terms.contactBody}
        </p>

        <p className="mt-10">
          <Link
            href="/licenses"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            {t.footer.licensesLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
