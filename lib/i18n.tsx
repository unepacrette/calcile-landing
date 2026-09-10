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
    auth: {
      betaLink: "Bêta",
      emailLabel: "Adresse email",
      emailPlaceholder: "ton@email.com",
      passwordLabel: "Mot de passe",
      passwordPlaceholderLogin: "Ton mot de passe",
      loginHeading: "Connexion",
      loginSubtitle: "Accède à ton espace Calcile.",
      loginSubmit: "Se connecter",
      loginSubmitLoading: "Connexion…",
      loginInvalidCredentials: "Email ou mot de passe incorrect.",
      noAccountPrefix:
        "Pas encore de compte ? Inscris-toi à la waitlist sur la",
      noAccountLinkLabel: "page d'accueil",
      noAccountSuffix: ", tu recevras un accès une fois validé.",
      genericError: "Une erreur est survenue, réessaie dans un instant.",
      forgotPasswordLink: "Mot de passe oublié ?",
      profile: {
        heading: "Mon profil",
        currentPasswordLabel: "Mot de passe actuel",
        currentPasswordPlaceholder: "Ton mot de passe actuel",
        newPasswordLabel: "Nouveau mot de passe",
        newPasswordPlaceholder: "8 caractères minimum",
        confirmPasswordLabel: "Confirmer le nouveau mot de passe",
        confirmPasswordPlaceholder: "Retape le nouveau mot de passe",
        submit: "Changer le mot de passe",
        submitLoading: "Mise à jour…",
        success: "Mot de passe mis à jour avec succès.",
        passwordTooShort:
          "Le nouveau mot de passe doit contenir au moins 8 caractères.",
        passwordsDontMatch: "Les deux mots de passe ne correspondent pas.",
        invalidCurrentPassword: "Mot de passe actuel incorrect.",
        genericError: "Une erreur est survenue, réessaie dans un instant.",
        backToSolve: "Retour au solveur",
        billing: {
          heading: "Facturation",
          currentTierPrefix: "Formule actuelle :",
          tierFree: "Gratuit",
          tierStudent: "Student",
          tierProf: "Prof",
          tierLab: "Lab",
          statusActive: "actif",
          statusCanceled: "annulé",
          statusPastDue: "paiement en retard",
          monthly: "Mensuel",
          yearly: "Annuel",
          subscribe: "S'abonner",
          managePortal: "Gérer mon abonnement",
          studentName: "Student",
          studentMonthlyPrice: "4,90€/mois",
          studentYearlyPrice: "39€/an",
          profName: "Prof",
          profMonthlyPrice: "50€/mois",
          profYearlyPrice: "450€/an",
          labName: "Lab",
          labPrice: "Sur devis",
          labContact: "Nous contacter",
          checkoutSuccessNotice:
            "Merci ! Ton abonnement est en cours d'activation.",
          checkoutCancelNotice:
            "Paiement annulé — aucun changement n'a été effectué.",
        },
      },
      passwordReset: {
        heading: "Mot de passe oublié",
        requestSubtitle:
          "Indique ton email, on t'envoie un lien de réinitialisation.",
        requestSubmit: "Envoyer le lien",
        requestSubmitLoading: "Envoi…",
        requestSuccess: "Si ce compte existe, un email a été envoyé.",
        confirmSubtitle: "Choisis un nouveau mot de passe.",
        confirmSubmit: "Réinitialiser le mot de passe",
        confirmSubmitLoading: "Réinitialisation…",
        confirmSuccess: "Mot de passe réinitialisé. Tu peux te connecter.",
        invalidOrExpiredToken: "Lien invalide ou expiré.",
        backToLogin: "Retour à la connexion",
      },
    },
    solve: {
      heading: "Espace bêta",
      subtitle:
        "Résous une équation, dérive ou intègre une expression, avec toutes les étapes.",
      tabSolve: "Résoudre une équation",
      tabDerivative: "Dériver",
      tabIntegral: "Intégrer",
      tabLimit: "Limite",
      tabSeries: "Série",
      tabInequality: "Inégalité",
      tabSystem: "Système d'équations",
      tabSum: "Somme",
      tabProduct: "Produit",
      tabMatrix: "Matrice",
      equationLabel: "Équation ou expression",
      equationPlaceholder: "x^2 + 3x + 2 = 0",
      expressionPlaceholder: "sin(x)/x",
      sumProductExpressionPlaceholder: "1/n^2",
      inequalityPlaceholder: "x^2 - 4 > 0",
      orderLabel: "Ordre de dérivation",
      lowerBoundLabel: "Borne inférieure (optionnel)",
      upperBoundLabel: "Borne supérieure (optionnel)",
      sumProductVariableLabel: "Variable (ex: n)",
      sumProductLowerLabel: "Borne inférieure",
      sumProductUpperLabel: "Borne supérieure",
      matrixSizeLabel: "Taille",
      matrixOperationLabel: "Opération",
      matrixOperationDeterminant: "Déterminant",
      matrixOperationInverse: "Inverse",
      matrixOperationEigenvalues: "Valeurs propres",
      matrixCellsLabel: "Cellules de la matrice",
      matrixCellPlaceholder: "0",
      matrixEmptyCellError:
        "Remplis toutes les cellules de la matrice avant de calculer.",
      matrixNotInvertibleNotice:
        "Cette matrice n'est pas inversible (déterminant nul).",
      limitPointLabel: "Point (ex: 0, oo, -oo, pi)",
      limitDirectionLabel: "Direction",
      limitDirectionBoth: "Des deux côtés",
      limitDirectionLeft: "Par la gauche",
      limitDirectionRight: "Par la droite",
      seriesPointLabel: "Point de développement",
      seriesOrderLabel: "Ordre (1 à 10)",
      systemEquationsLabel: "Équations (une par ligne, 2 ou 3)",
      systemEquationsPlaceholder: "x + y = 5\nx - y = 1",
      submit: "Calculer",
      submitLoading: "Calcul…",
      resultHeading: "Résultat",
      stepsHeading: "Étapes",
      methodLabel: "Méthode",
      alternativeMethodsHeading: "Autres méthodes possibles",
      alternativeMethodsExpand: "Afficher les étapes de cette méthode",
      alternativeMethodsCollapse: "Masquer les étapes de cette méthode",
      glossaryHeading: "Définitions",
      error: "Une erreur est survenue, réessaie dans un instant.",
      logout: "Se déconnecter",
      profileLink: "Mon profil",
    },
    footer: {
      poweredByPrefix: "Propulsé par",
      sympyLinkLabel: "SymPy",
      licenseNote: "sous licence BSD 3-Clause",
      licensesLinkLabel: "Voir notre page Licences",
      aboutLinkLabel: "À propos",
      termsLinkLabel: "Conditions d'utilisation",
      privacyLinkLabel: "Confidentialité",
    },
    about: {
      metaTitle: "À propos — Calcile",
      metaDescription:
        "Comment Calcile fonctionne : SymPy comme moteur de calcul, et ce qu'on ajoute par-dessus.",
      heading: "À propos de Calcile",
      intro:
        "Calcile est né d'un constat simple : les outils de calcul symbolique existants (Mathematica, Maple, WolframAlpha) sont soit chers, soit avares en explications. On voulait un outil qui montre le raisonnement, pas juste le résultat.",
      howItWorksHeading: "Comment ça marche",
      howItWorksIntro:
        "Calcile utilise SymPy (open-source) comme moteur de calcul symbolique. On ne réinvente pas la roue sur les maths elles-mêmes — SymPy est mature, testé par une large communauté, et fiable. On ajoute de la valeur par-dessus :",
      valueAdds: [
        {
          title: "Une interface pensée pour apprendre",
          description:
            "Saisie en notation naturelle (\"x^2 + 3x + 2\"), résultats lisibles, historique de tes calculs — pas une console Python.",
        },
        {
          title: "Des explications pédagogiques",
          description:
            "Chaque calcul renvoie les étapes de résolution, pas juste la réponse finale — pensé pour comprendre, pas seulement vérifier.",
        },
        {
          title: "Des outils de correction pour les profs",
          description:
            "Automatiser la correction d'exercices, gagner plusieurs heures par semaine — un usage que SymPy seul ne couvre pas.",
        },
      ],
      transparencyHeading: "Notre position sur l'open-source",
      transparencyBody:
        "On est transparents là-dessus : sans SymPy, Calcile n'existerait pas sous cette forme. C'est un projet open-source de grande qualité et on tenait à le dire clairement, avec le détail de nos dépendances et leurs licences, plutôt que de le passer sous silence.",
      licensesLinkLabel: "Voir la page Licences",
    },
    licenses: {
      metaTitle: "Licences — Calcile",
      metaDescription:
        "Les dépendances open-source de Calcile et leurs licences, à commencer par SymPy (BSD 3-Clause).",
      heading: "Licences",
      intro:
        "Calcile s'appuie sur des bibliothèques open-source. Cette page liste nos dépendances et explique comment on les utilise.",
      howWeUseHeading: "Comment on utilise SymPy",
      howWeUseBody:
        "SymPy (sympy.org) est notre moteur de calcul symbolique : résolution d'équations, dérivées, intégrales, simplification, et génération des étapes de résolution. On l'utilise comme bibliothèque, sans le modifier. Par-dessus, Calcile ajoute un parseur de notation naturelle, une interface pédagogique, l'authentification, l'historique des calculs et des outils de correction pour les enseignants — Calcile n'est pas qu'un wrapper autour de SymPy.",
      sympyHeading: "SymPy — texte complet de la licence BSD 3-Clause",
      dependenciesHeading: "Dépendances",
      pythonHeading: "Backend (Python)",
      npmHeading: "Frontend (npm)",
      licenseColumn: "Licence",
      packageColumn: "Paquet",
      ownCodeHeading: "Notre propre code",
      ownCodeBody:
        "Le code source de Calcile (l'interface, l'API, la logique métier) reste propriétaire — tous droits réservés. Seules nos dépendances open-source gardent leurs licences respectives, listées ci-dessus dans leur intégralité.",
    },
    terms: {
      metaTitle: "Conditions d'utilisation — Calcile",
      metaDescription: "Conditions d'utilisation du service Calcile.",
      heading: "Conditions d'utilisation",
      lastUpdated: "Dernière mise à jour : 7 septembre 2026",
      intro:
        "En utilisant Calcile, tu acceptes les conditions suivantes. Ce document sera complété au fur et à mesure de l'évolution du service.",
      serviceHeading: "Le service",
      serviceBody:
        "Calcile est une API et une interface de calcul symbolique (résolution d'équations, dérivées, intégrales) avec des explications pas à pas, actuellement en bêta fermée sur invitation.",
      accuracyHeading: "Justesse des résultats",
      accuracyBody:
        "Calcile utilise SymPy (bibliothèque open-source, sympy.org) comme moteur de calcul. Comme tout logiciel, SymPy peut contenir des bugs ou des cas limites mal gérés. On ne peut donc pas garantir une exactitude à 100% des résultats et des étapes affichées. Vérifie les résultats importants, en particulier pour un usage académique noté ou professionnel.",
      accountsHeading: "Comptes",
      accountsBody:
        "L'accès se fait sur invitation. Tu es responsable de la confidentialité de ton mot de passe et de l'activité sur ton compte.",
      changesHeading: "Modifications",
      changesBody:
        "On peut faire évoluer ces conditions ; les changements importants seront communiqués par email.",
      contactHeading: "Contact",
      contactBody: "Une question ? Écris-nous à contact@calcile.fr.",
    },
    privacy: {
      metaTitle: "Confidentialité — Calcile",
      metaDescription: "Politique de confidentialité de Calcile.",
      heading: "Politique de confidentialité",
      lastUpdated: "Dernière mise à jour : 7 septembre 2026",
      intro:
        "Cette page explique quelles données Calcile collecte et comment elles sont utilisées.",
      dataHeading: "Données collectées",
      dataBody:
        "On collecte ton email (pour la waitlist et ton compte), ton mot de passe (haché, jamais en clair), et l'historique de tes calculs (pour te permettre de les retrouver). On ne collecte pas plus que nécessaire au fonctionnement du service.",
      useHeading: "Utilisation des données",
      useBody:
        "Tes données servent à faire fonctionner ton compte et le service (authentification, historique, emails transactionnels via Resend). On ne vend pas tes données et on ne les partage pas à des fins publicitaires.",
      thirdPartyHeading: "Prestataires et logiciels tiers",
      thirdPartyBody:
        "Calcile utilise SymPy, une bibliothèque open-source (voir notre page Licences), qui s'exécute sur nos serveurs — aucune donnée n'est envoyée à SymPy ou à un tiers pour effectuer les calculs. Pour l'envoi d'emails transactionnels, on utilise Resend.",
      rightsHeading: "Tes droits",
      rightsBody:
        "Tu peux demander l'accès, la correction ou la suppression de tes données à tout moment en écrivant à contact@calcile.fr.",
      licensesLinkLabel: "Voir la page Licences",
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
    auth: {
      betaLink: "Beta",
      emailLabel: "Email address",
      emailPlaceholder: "you@email.com",
      passwordLabel: "Password",
      passwordPlaceholderLogin: "Your password",
      loginHeading: "Log in",
      loginSubtitle: "Access your Calcile workspace.",
      loginSubmit: "Log in",
      loginSubmitLoading: "Logging in…",
      loginInvalidCredentials: "Incorrect email or password.",
      noAccountPrefix:
        "Don't have an account yet? Sign up for the waitlist on the",
      noAccountLinkLabel: "homepage",
      noAccountSuffix: ", you'll get access once it's granted.",
      genericError: "Something went wrong, try again in a moment.",
      forgotPasswordLink: "Forgot your password?",
      profile: {
        heading: "My profile",
        currentPasswordLabel: "Current password",
        currentPasswordPlaceholder: "Your current password",
        newPasswordLabel: "New password",
        newPasswordPlaceholder: "At least 8 characters",
        confirmPasswordLabel: "Confirm new password",
        confirmPasswordPlaceholder: "Type the new password again",
        submit: "Change password",
        submitLoading: "Updating…",
        success: "Password updated successfully.",
        passwordTooShort:
          "The new password must be at least 8 characters long.",
        passwordsDontMatch: "The two passwords don't match.",
        invalidCurrentPassword: "Current password is incorrect.",
        genericError: "Something went wrong, try again in a moment.",
        backToSolve: "Back to solver",
        billing: {
          heading: "Billing",
          currentTierPrefix: "Current plan:",
          tierFree: "Free",
          tierStudent: "Student",
          tierProf: "Prof",
          tierLab: "Lab",
          statusActive: "active",
          statusCanceled: "canceled",
          statusPastDue: "payment overdue",
          monthly: "Monthly",
          yearly: "Yearly",
          subscribe: "Subscribe",
          managePortal: "Manage subscription",
          studentName: "Student",
          studentMonthlyPrice: "€4.90/month",
          studentYearlyPrice: "€39/year",
          profName: "Prof",
          profMonthlyPrice: "€50/month",
          profYearlyPrice: "€450/year",
          labName: "Lab",
          labPrice: "Custom pricing",
          labContact: "Contact us",
          checkoutSuccessNotice: "Thanks! Your subscription is being activated.",
          checkoutCancelNotice: "Payment canceled — nothing was changed.",
        },
      },
      passwordReset: {
        heading: "Forgot password",
        requestSubtitle:
          "Enter your email, we'll send you a reset link.",
        requestSubmit: "Send reset link",
        requestSubmitLoading: "Sending…",
        requestSuccess: "If that account exists, an email has been sent.",
        confirmSubtitle: "Choose a new password.",
        confirmSubmit: "Reset password",
        confirmSubmitLoading: "Resetting…",
        confirmSuccess: "Password reset. You can now log in.",
        invalidOrExpiredToken: "Invalid or expired link.",
        backToLogin: "Back to login",
      },
    },
    solve: {
      heading: "Beta workspace",
      subtitle:
        "Solve an equation, differentiate, or integrate an expression, with every step.",
      tabSolve: "Solve an equation",
      tabDerivative: "Differentiate",
      tabIntegral: "Integrate",
      tabLimit: "Limit",
      tabSeries: "Series",
      tabInequality: "Inequality",
      tabSystem: "System of equations",
      tabSum: "Sum",
      tabProduct: "Product",
      tabMatrix: "Matrix",
      equationLabel: "Equation or expression",
      equationPlaceholder: "x^2 + 3x + 2 = 0",
      expressionPlaceholder: "sin(x)/x",
      sumProductExpressionPlaceholder: "1/n^2",
      inequalityPlaceholder: "x^2 - 4 > 0",
      orderLabel: "Order of differentiation",
      lowerBoundLabel: "Lower bound (optional)",
      upperBoundLabel: "Upper bound (optional)",
      sumProductVariableLabel: "Variable (e.g. n)",
      sumProductLowerLabel: "Lower bound",
      sumProductUpperLabel: "Upper bound",
      matrixSizeLabel: "Size",
      matrixOperationLabel: "Operation",
      matrixOperationDeterminant: "Determinant",
      matrixOperationInverse: "Inverse",
      matrixOperationEigenvalues: "Eigenvalues",
      matrixCellsLabel: "Matrix cells",
      matrixCellPlaceholder: "0",
      matrixEmptyCellError: "Fill in every matrix cell before calculating.",
      matrixNotInvertibleNotice:
        "This matrix isn't invertible (determinant is zero).",
      limitPointLabel: "Point (e.g. 0, oo, -oo, pi)",
      limitDirectionLabel: "Direction",
      limitDirectionBoth: "Both sides",
      limitDirectionLeft: "From the left",
      limitDirectionRight: "From the right",
      seriesPointLabel: "Expansion point",
      seriesOrderLabel: "Order (1 to 10)",
      systemEquationsLabel: "Equations (one per line, 2 or 3)",
      systemEquationsPlaceholder: "x + y = 5\nx - y = 1",
      submit: "Calculate",
      submitLoading: "Calculating…",
      resultHeading: "Result",
      stepsHeading: "Steps",
      methodLabel: "Method",
      alternativeMethodsHeading: "Other possible methods",
      alternativeMethodsExpand: "Show this method's steps",
      alternativeMethodsCollapse: "Hide this method's steps",
      glossaryHeading: "Definitions",
      error: "Something went wrong, try again in a moment.",
      logout: "Log out",
      profileLink: "My profile",
    },
    footer: {
      poweredByPrefix: "Powered by",
      sympyLinkLabel: "SymPy",
      licenseNote: "licensed under BSD 3-Clause",
      licensesLinkLabel: "See our Licenses page",
      aboutLinkLabel: "About",
      termsLinkLabel: "Terms of use",
      privacyLinkLabel: "Privacy",
    },
    about: {
      metaTitle: "About — Calcile",
      metaDescription:
        "How Calcile works: SymPy as the computation engine, and what we add on top.",
      heading: "About Calcile",
      intro:
        "Calcile started from a simple observation: existing symbolic computation tools (Mathematica, Maple, WolframAlpha) are either expensive or stingy with explanations. We wanted a tool that shows the reasoning, not just the answer.",
      howItWorksHeading: "How it works",
      howItWorksIntro:
        "Calcile uses SymPy (open-source) as the math computation engine. We're not reinventing the math itself — SymPy is mature, tested by a large community, and reliable. We add value on top:",
      valueAdds: [
        {
          title: "A UI built for learning",
          description:
            "Natural-notation input (\"x^2 + 3x + 2\"), readable results, a history of your calculations — not a Python console.",
        },
        {
          title: "Pedagogical explanations",
          description:
            "Every calculation returns the solving steps, not just the final answer — built to help you understand, not just check.",
        },
        {
          title: "Grading tools for teachers",
          description:
            "Automate exercise grading and save hours a week — a use case SymPy alone doesn't cover.",
        },
      ],
      transparencyHeading: "Where we stand on open source",
      transparencyBody:
        "We're upfront about this: without SymPy, Calcile wouldn't exist in this form. It's a high-quality open-source project and we wanted to say so clearly, with the full detail of our dependencies and their licenses, rather than staying quiet about it.",
      licensesLinkLabel: "See the Licenses page",
    },
    licenses: {
      metaTitle: "Licenses — Calcile",
      metaDescription:
        "Calcile's open-source dependencies and their licenses, starting with SymPy (BSD 3-Clause).",
      heading: "Licenses",
      intro:
        "Calcile is built on open-source libraries. This page lists our dependencies and explains how we use them.",
      howWeUseHeading: "How we use SymPy",
      howWeUseBody:
        "SymPy (sympy.org) is our symbolic computation engine: solving equations, derivatives, integrals, simplification, and generating the solving steps. We use it as a library, unmodified. On top of it, Calcile adds a natural-notation parser, a pedagogical UI, authentication, calculation history, and grading tools for teachers — Calcile is not just a wrapper around SymPy.",
      sympyHeading: "SymPy — full BSD 3-Clause license text",
      dependenciesHeading: "Dependencies",
      pythonHeading: "Backend (Python)",
      npmHeading: "Frontend (npm)",
      licenseColumn: "License",
      packageColumn: "Package",
      ownCodeHeading: "Our own code",
      ownCodeBody:
        "Calcile's source code (the UI, the API, the business logic) remains proprietary — all rights reserved. Only our open-source dependencies keep their respective licenses, listed above in full.",
    },
    terms: {
      metaTitle: "Terms of Use — Calcile",
      metaDescription: "Terms of use for the Calcile service.",
      heading: "Terms of Use",
      lastUpdated: "Last updated: September 7, 2026",
      intro:
        "By using Calcile, you agree to the following terms. This document will be expanded as the service evolves.",
      serviceHeading: "The service",
      serviceBody:
        "Calcile is a symbolic computation API and UI (solving equations, derivatives, integrals) with step-by-step explanations, currently in closed beta by invitation.",
      accuracyHeading: "Accuracy of results",
      accuracyBody:
        "Calcile uses SymPy (an open-source library, sympy.org) as its computation engine. Like any software, SymPy can contain bugs or poorly-handled edge cases. We therefore cannot guarantee 100% accuracy of the results and steps shown. Verify important results yourself, especially for graded academic or professional use.",
      accountsHeading: "Accounts",
      accountsBody:
        "Access is by invitation. You're responsible for keeping your password confidential and for activity on your account.",
      changesHeading: "Changes",
      changesBody:
        "We may update these terms; significant changes will be communicated by email.",
      contactHeading: "Contact",
      contactBody: "Questions? Reach out at contact@calcile.fr.",
    },
    privacy: {
      metaTitle: "Privacy — Calcile",
      metaDescription: "Calcile's privacy policy.",
      heading: "Privacy Policy",
      lastUpdated: "Last updated: September 7, 2026",
      intro:
        "This page explains what data Calcile collects and how it's used.",
      dataHeading: "Data we collect",
      dataBody:
        "We collect your email (for the waitlist and your account), your password (hashed, never stored in plain text), and your calculation history (so you can find your past work). We don't collect more than the service needs to run.",
      useHeading: "How we use your data",
      useBody:
        "Your data is used to run your account and the service (authentication, history, transactional emails via Resend). We don't sell your data or share it for advertising purposes.",
      thirdPartyHeading: "Third-party services and software",
      thirdPartyBody:
        "Calcile uses SymPy, an open-source library (see our Licenses page), which runs on our own servers — no data is sent to SymPy or a third party to perform calculations. For transactional emails, we use Resend.",
      rightsHeading: "Your rights",
      rightsBody:
        "You can request access to, correction of, or deletion of your data at any time by writing to contact@calcile.fr.",
      licensesLinkLabel: "See the Licenses page",
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
