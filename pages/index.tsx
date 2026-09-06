import { useState } from "react";
import Head from "next/head";
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

      <LanguageSwitcher />

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
