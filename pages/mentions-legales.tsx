import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function MentionsLegales() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.legal.metaTitle}</title>
        <meta name="description" content={t.legal.metaDescription} />
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-bold text-gray-900">{t.legal.heading}</h1>
        <p className="mt-2 text-sm text-gray-500">{t.legal.lastUpdated}</p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.legal.publisherHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.legal.publisherBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.legal.publicationDirectorHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.legal.publicationDirectorBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.legal.hostHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.legal.hostBody}
        </p>

        <h2 className="mt-10 text-lg font-bold text-gray-900">
          {t.legal.ipHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {t.legal.ipBody}
        </p>

        <p className="mt-10">
          <Link
            href="/licenses"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            {t.legal.licensesLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
