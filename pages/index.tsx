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

      <div className="fixed right-4 top-4 z-50 flex items-center gap-3">
        {/* Discreet entry point to the closed beta — not a primary CTA. */}
        <Link
          href="/login"
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          {t.auth.betaLink}
        </Link>
        <LanguageSwitcher />
      </div>

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
