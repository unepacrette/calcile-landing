import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-rule bg-paper-raised">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-sm text-ink-faint sm:flex-row sm:justify-between">
        <p>Calcile © 2026 — contact@calcile.fr</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/about" className="hover:text-ink-soft">
            {t.footer.aboutLinkLabel}
          </Link>
          <Link href="/terms" className="hover:text-ink-soft">
            {t.footer.termsLinkLabel}
          </Link>
          <Link href="/privacy" className="hover:text-ink-soft">
            {t.footer.privacyLinkLabel}
          </Link>
          <Link href="/mentions-legales" className="hover:text-ink-soft">
            {t.footer.legalLinkLabel}
          </Link>
          {/* Placeholders : à remplacer par les vrais comptes une fois créés */}
          <a href="#" className="hover:text-ink-soft">
            Twitter
          </a>
          <a href="#" className="hover:text-ink-soft">
            Reddit
          </a>
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-6 py-4 text-center text-xs text-ink-faint">
          {t.footer.poweredByPrefix}{" "}
          <a
            href="https://www.sympy.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-ink-soft"
          >
            {t.footer.sympyLinkLabel}
          </a>{" "}
          ({t.footer.licenseNote}) —{" "}
          <Link href="/licenses" className="hover:text-ink-soft">
            {t.footer.licensesLinkLabel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
