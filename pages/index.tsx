import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Hero from "@/components/Hero";
import AudienceSection from "@/components/AudienceSection";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.meta.title}</title>
        <meta name="description" content={t.meta.description} />
      </Head>

      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-xl font-semibold text-ink">
            calc<span className="italic text-mark">ile</span>
          </span>
          <div className="flex items-center gap-3">
            {/* Discreet entry point to the closed beta — not a primary CTA. */}
            <Link
              href="/login"
              className="text-xs font-medium text-ink-faint transition duration-150 hover:text-ink-soft active:scale-95"
            >
              {t.auth.betaLink}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <AudienceSection />
        <HowItWorks />
        <Pricing onSelectTier={setSelectedTier} />
        <WaitlistForm
          selectedTier={selectedTier}
          onClearTier={() => setSelectedTier(null)}
        />
      </main>

      <Footer />
    </>
  );
}
