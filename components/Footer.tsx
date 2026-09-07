import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-sm text-gray-500 sm:flex-row sm:justify-between">
        <p>Calcile © 2026 — contact@calcile.fr</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/about" className="hover:text-gray-700">
            {t.footer.aboutLinkLabel}
          </Link>
          <Link href="/terms" className="hover:text-gray-700">
            {t.footer.termsLinkLabel}
          </Link>
          <Link href="/privacy" className="hover:text-gray-700">
            {t.footer.privacyLinkLabel}
          </Link>
          {/* Placeholders : à remplacer par les vrais comptes une fois créés */}
          <a href="#" className="hover:text-gray-700">
            Twitter
          </a>
          <a href="#" className="hover:text-gray-700">
            Reddit
          </a>
        </div>
      </div>
      <div className="border-t border-gray-100">
        <div className="mx-auto max-w-5xl px-6 py-4 text-center text-xs text-gray-400">
          {t.footer.poweredByPrefix}{" "}
          <a
            href="https://www.sympy.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-gray-600"
          >
            {t.footer.sympyLinkLabel}
          </a>{" "}
          ({t.footer.licenseNote}) —{" "}
          <Link href="/licenses" className="hover:text-gray-600">
            {t.footer.licensesLinkLabel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
