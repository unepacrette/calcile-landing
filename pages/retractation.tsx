import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Retractation() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.withdrawal.metaTitle}</title>
        <meta name="description" content={t.withdrawal.metaDescription} />
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-display font-semibold text-ink">
          {t.withdrawal.heading}
        </h1>
        <p className="mt-2 text-sm text-ink-faint">{t.withdrawal.lastUpdated}</p>

        {t.withdrawal.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mt-10 text-lg font-display font-semibold text-ink">
              {section.heading}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {section.body}
            </p>
          </section>
        ))}

        {/* Model form from the annex to art. R221-1 of the Code de la
            consommation, kept verbatim (only the trader's details are
            filled in) -- it's a regulated text, not copy to rephrase. */}
        <section className="mt-10 rounded-lg border border-rule bg-paper-raised p-6">
          <h2 className="text-lg font-display font-semibold text-ink">
            {t.withdrawal.formHeading}
          </h2>
          <p className="mt-2 text-sm italic text-ink-soft">{t.withdrawal.formIntro}</p>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-ink">
            {t.withdrawal.formLines.map((line) => (
              <li key={line}>— {line}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">{t.withdrawal.formFootnote}</p>
        </section>

        <p className="mt-10">
          <Link
            href="/terms"
            className="text-sm font-semibold text-mark-strong hover:underline"
          >
            {t.withdrawal.termsLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
