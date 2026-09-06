import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "en";

export const translations = {
  fr: {
    meta: {
      title: "Calcile — Résous tes maths, comprends chaque étape",
      description:
        "L'API de calcul symbolique qui explique, pas juste qui répond. Comme WolframAlpha, mais avec les étapes détaillées et 80% moins cher.",
    },
    hero: {
      title: "Calcile — Résous tes maths, comprends chaque étape",
      subtitle:
        "L'API de calcul symbolique qui explique, pas juste qui répond. Comme WolframAlpha, mais avec les étapes détaillées et 80% moins cher.",
      ctaWaitlist: "Rejoindre la waitlist",
      ctaDemo: "Réserver une démo",
    },
    audience: {
      heading: "Pour qui ?",
      items: [
        {
          title: "Étudiants",
          description:
            "Vérifie tes réponses et comprends chaque étape de résolution — comme un prof particulier disponible 24/7.",
          price: "4,90€/mois",
          annualNote: "ou 39€/an en annuel",
        },
        {
          title: "Profs",
          description:
            "Automatise la correction d'exercices. Économise 3-4h par semaine.",
          price: "50€/mois",
          annualNote: "ou 450€/an en annuel",
        },
        {
          title: "Labs/Universités",
          description:
            "Alternative SaaS à Mathematica/Maple, API robuste, 80% moins cher.",
          price: "Sur devis",
        },
      ],
    },
    howItWorks: {
      heading: "Comment ça marche",
      steps: [
        "Entre ton équation ou expression",
        "Calcile la résout avec SymPy (équations, dérivées, intégrales)",
        "Tu reçois la réponse ET chaque étape de la résolution",
      ],
    },
    pricing: {
      heading: "Tarifs",
      cta: "Rejoindre la waitlist",
      tiers: [
        {
          name: "Student",
          price: "4,90€/mois",
          annualNote: "ou 39€/an (3,25€/mois) en facturation annuelle",
          description: "Pour vérifier tes réponses et progresser.",
          features: [
            "Résolution d'équations, dérivées, intégrales",
            "Étapes détaillées à chaque calcul",
            "Historique de tes calculs",
          ],
        },
        {
          name: "Prof",
          price: "50€/mois",
          annualNote: "ou 450€/an (37,50€/mois) en facturation annuelle",
          description: "Pour automatiser la correction d'exercices.",
          features: [
            "Tout ce qui est inclus dans Student",
            "Volume de calculs plus élevé",
            "Support prioritaire",
          ],
        },
        {
          name: "Lab",
          price: "Sur devis",
          description: "Pour les labs et universités.",
          features: [
            "API robuste, haute disponibilité",
            "Alternative à Mathematica/Maple",
            "Accompagnement dédié",
          ],
        },
      ],
    },
    waitlist: {
      heading: "Sois parmi les premiers testeurs",
      subtitle:
        "Laisse-nous ton email, on te prévient dès que Calcile ouvre ses portes.",
      tierPrefix: "Tu t'inscris en tant que :",
      change: "Changer",
      emailLabel: "Adresse email",
      emailPlaceholder: "ton@email.com",
      submit: "Je m'inscris",
      submitLoading: "Inscription…",
      success: "Merci, tu es sur la liste !",
      alreadySubscribed: "Tu es déjà inscrit !",
      error: "Une erreur est survenue, réessaie dans un instant.",
    },
  },
  en: {
    meta: {
      title: "Calcile — Solve your math, understand every step",
      description:
        "The symbolic computation API that explains, not just answers. Like WolframAlpha, but with full step-by-step breakdowns and 80% cheaper.",
    },
    hero: {
      title: "Calcile — Solve your math, understand every step",
      subtitle:
        "The symbolic computation API that explains, not just answers. Like WolframAlpha, but with full step-by-step breakdowns and 80% cheaper.",
      ctaWaitlist: "Join the waitlist",
      ctaDemo: "Book a demo",
    },
    audience: {
      heading: "Who is it for?",
      items: [
        {
          title: "Students",
          description:
            "Check your answers and understand every step — like a personal tutor available 24/7.",
          price: "€4.90/month",
          annualNote: "or €39/year billed annually",
        },
        {
          title: "Professors",
          description:
            "Automate exercise grading. Save 3-4 hours a week.",
          price: "€50/month",
          annualNote: "or €450/year billed annually",
        },
        {
          title: "Labs/Universities",
          description:
            "SaaS alternative to Mathematica/Maple, robust API, 80% cheaper.",
          price: "Custom pricing",
        },
      ],
    },
    howItWorks: {
      heading: "How it works",
      steps: [
        "Enter your equation or expression",
        "Calcile solves it with SymPy (equations, derivatives, integrals)",
        "You get the answer AND every step of the resolution",
      ],
    },
    pricing: {
      heading: "Pricing",
      cta: "Join the waitlist",
      tiers: [
        {
          name: "Student",
          price: "€4.90/month",
          annualNote: "or €39/year (€3.25/month) billed annually",
          description: "Check your answers and keep improving.",
          features: [
            "Solve equations, derivatives, integrals",
            "Detailed steps for every calculation",
            "History of your calculations",
          ],
        },
        {
          name: "Prof",
          price: "€50/month",
          annualNote: "or €450/year (€37.50/month) billed annually",
          description: "Automate exercise grading.",
          features: [
            "Everything in Student",
            "Higher calculation volume",
            "Priority support",
          ],
        },
        {
          name: "Lab",
          price: "Custom pricing",
          description: "For labs and universities.",
          features: [
            "Robust, high-availability API",
            "Alternative to Mathematica/Maple",
            "Dedicated support",
          ],
        },
      ],
    },
    waitlist: {
      heading: "Be one of the first testers",
      subtitle:
        "Leave us your email, we'll let you know as soon as Calcile opens its doors.",
      tierPrefix: "You're signing up as:",
      change: "Change",
      emailLabel: "Email address",
      emailPlaceholder: "you@email.com",
      submit: "Sign me up",
      submitLoading: "Signing up…",
      success: "Thanks, you're on the list!",
      alreadySubscribed: "You're already signed up!",
      error: "Something went wrong, try again in a moment.",
    },
  },
} as const;

// `translations` is `as const`, so `translations.fr` and `translations.en`
// each have their own literal string types. The context value must accept
// whichever one is active, hence the union rather than just `"fr"`'s type.
type Translations = (typeof translations)[Lang];

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("calcile-lang");
      // Reading localStorage must stay client-only (SSR has no `window`),
      // so this can't be a lazy useState initializer without causing a
      // hydration mismatch — an effect syncing from that external store
      // on mount is the correct pattern here despite the lint rule below.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "fr" || stored === "en") setLangState(stored);
    } catch {
      // ignore (private browsing, etc.)
    }
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      window.localStorage.setItem("calcile-lang", next);
    } catch {
      // ignore
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
