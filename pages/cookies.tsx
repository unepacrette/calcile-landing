import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Cookies() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.cookies.metaTitle}</title>
        <meta name="description" content={t.cookies.metaDescription} />
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-display font-semibold text-ink">{t.cookies.heading}</h1>
        <p className="mt-2 text-sm text-ink-faint">{t.cookies.lastUpdated}</p>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">
          {t.cookies.intro}
        </p>

        {t.cookies.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mt-10 text-lg font-display font-semibold text-ink">
              {section.heading}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {section.body}
            </p>
          </section>
        ))}

        <p className="mt-10">
          <Link
            href="/privacy"
            className="text-sm font-semibold text-mark-strong hover:underline"
          >
            {t.cookies.privacyLinkLabel} →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
