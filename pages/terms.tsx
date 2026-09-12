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
        <h1 className="text-3xl font-display font-semibold text-ink">{t.terms.heading}</h1>
        <p className="mt-2 text-sm text-ink-faint">{t.terms.lastUpdated}</p>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">
          {t.terms.intro}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.serviceHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.serviceBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.pricingHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.pricingBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.renewalHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.renewalBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.withdrawalHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.withdrawalBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.accuracyHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.accuracyBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.accountsHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.accountsBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.lawHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.lawBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.changesHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.changesBody}
        </p>

        <h2 className="mt-10 text-lg font-display font-semibold text-ink">
          {t.terms.contactHeading}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {t.terms.contactBody}
        </p>

        <p className="mt-10 space-x-6">
          <Link
            href="/mentions-legales"
            className="text-sm font-semibold text-mark-strong hover:underline"
          >
            {t.terms.legalLinkLabel} →
          </Link>
          <Link
            href="/licenses"
            className="text-sm font-semibold text-mark-strong hover:underline"
          >
            {t.footer.licensesLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
