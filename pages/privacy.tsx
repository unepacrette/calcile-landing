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
        <h1 className="text-3xl font-display font-semibold text-ink">
          {t.privacy.heading}
        </h1>
        <p className="mt-2 text-sm text-ink-faint">{t.privacy.lastUpdated}</p>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">
          {t.privacy.intro}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.privacy.dataHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.privacy.dataBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.privacy.legalBasisHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.privacy.legalBasisBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.privacy.useHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.privacy.useBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.privacy.retentionHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.privacy.retentionBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.privacy.thirdPartyHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.privacy.thirdPartyBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.privacy.cookiesHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.privacy.cookiesBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.privacy.rightsHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.privacy.rightsBody}
        </p>

        <p className="mt-10 space-x-6">
          <Link
            href="/mentions-legales"
            className="text-sm font-semibold text-mark-strong hover:underline"
          >
            {t.privacy.legalLinkLabel} →
          </Link>
          <Link
            href="/licenses"
            className="text-sm font-semibold text-mark-strong hover:underline"
          >
            {t.privacy.licensesLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
