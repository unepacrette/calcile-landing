import Head from "next/head";
import Hero from "@/components/Hero";
import AudienceSection from "@/components/AudienceSection";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Head>
        <title>Calcile — Résous tes maths, comprends chaque étape</title>
        <meta
          name="description"
          content="L'API de calcul symbolique qui explique, pas juste qui répond. Comme WolframAlpha, mais avec les étapes détaillées et 80% moins cher."
        />
      </Head>

      <main>
        <Hero />
        <AudienceSection />
        <HowItWorks />
        <Pricing />
        <WaitlistForm />
      </main>

      <Footer />
    </>
  );
}
