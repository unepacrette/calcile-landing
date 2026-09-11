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
          withdrawalConsentLabel:
            "Je demande l'exécution immédiate du service dès la validation du paiement, et je renonce expressément à mon droit de rétractation de 14 jours (article L221-28 13° du Code de la consommation). J'accepte les",
          withdrawalConsentTermsLink:
            "Conditions générales de vente et d'utilisation.",
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
      legalLinkLabel: "Mentions légales",
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
    legal: {
      metaTitle: "Mentions légales — Calcile",
      metaDescription: "Identité de l'éditeur et de l'hébergeur du site Calcile.",
      heading: "Mentions légales",
      lastUpdated: "Dernière mise à jour : 11 septembre 2026",
      publisherHeading: "Éditeur du site",
      publisherBody:
        "Calcile est édité par Amaury Le Roux, entrepreneur individuel (micro-entreprise), domicilié à Besançon (France). SIREN : en cours d'attribution. TVA non applicable, article 293 B du Code général des impôts. Contact : contact@calcile.fr.",
      publicationDirectorHeading: "Directeur de la publication",
      publicationDirectorBody: "Amaury Le Roux, en sa qualité d'éditeur du site.",
      hostHeading: "Hébergement",
      hostBody:
        "Le site calcile.fr est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com). L'API et la base de données du service sont hébergées séparément par Railway Corporation — voir notre politique de confidentialité pour le détail des sous-traitants et des transferts de données associés.",
      ipHeading: "Propriété intellectuelle",
      ipBody:
        "Le code source, l'interface et les contenus propres à Calcile sont la propriété d'Amaury Le Roux, sauf mention contraire (voir notre page Licences pour les dépendances open-source utilisées). Toute reproduction non autorisée est interdite.",
      licensesLinkLabel: "Voir la page Licences",
    },
    terms: {
      metaTitle: "Conditions générales de vente et d'utilisation — Calcile",
      metaDescription: "Conditions générales de vente et d'utilisation du service Calcile.",
      heading: "Conditions générales de vente et d'utilisation",
      lastUpdated: "Dernière mise à jour : 11 septembre 2026",
      intro:
        "En utilisant Calcile, tu acceptes les conditions suivantes. Ce document sera complété au fur et à mesure de l'évolution du service. Pour l'identité de l'éditeur et de l'hébergeur, voir nos Mentions légales.",
      serviceHeading: "Le service",
      serviceBody:
        "Calcile est une API et une interface de calcul symbolique (résolution d'équations, dérivées, intégrales) avec des explications pas à pas, actuellement en bêta fermée sur invitation, avec des formules payantes optionnelles (Student, Prof, Lab).",
      pricingHeading: "Tarifs, abonnement et paiement",
      pricingBody:
        "Calcile propose trois formules par abonnement : Student (4,90€/mois ou 39€/an), Prof (50€/mois ou 450€/an), et Lab (sur devis, contrat spécifique). Les tarifs affichés sont nets, toutes taxes comprises : Calcile bénéficie de la franchise en base de TVA (article 293 B du Code général des impôts), la TVA n'est donc pas applicable et n'apparaît pas sur les factures. Le paiement est traité par notre prestataire Stripe ; Calcile ne voit ni ne stocke jamais ton numéro de carte bancaire.",
      renewalHeading: "Durée, renouvellement automatique et résiliation",
      renewalBody:
        "Les abonnements Student et Prof sont à renouvellement automatique : sauf résiliation avant la fin de la période en cours, l'abonnement est reconduit pour une durée identique (mensuelle ou annuelle selon la formule choisie) et le montant correspondant est prélevé automatiquement. Tu peux résilier à tout moment depuis ton espace client (bouton « Gérer mon abonnement », qui ouvre le portail de facturation Stripe) : la résiliation prend effet à la fin de la période déjà payée, sans reconduction ultérieure, et l'accès à Calcile reste actif jusqu'à cette date. Sauf exercice du droit de rétractation décrit ci-dessous, les sommes déjà versées pour une période en cours ne sont pas remboursées au prorata.",
      withdrawalHeading: "Droit de rétractation",
      withdrawalBody:
        "Conformément aux articles L221-18 et suivants du Code de la consommation, tu disposes en principe d'un délai de 14 jours pour te rétracter d'un abonnement souscrit en ligne, sans avoir à te justifier. L'accès à Calcile est toutefois fourni immédiatement après le paiement : conformément à l'article L221-28 13° du même code, en cochant la case de confirmation présentée avant le paiement, tu demandes expressément l'exécution immédiate du service et tu renonces expressément à ton droit de rétractation. Une fois cette case cochée et le paiement effectué, tu ne peux donc plus te rétracter pour la période en cours. Si tu n'as pas coché cette case, ou si l'exécution immédiate n'a pas commencé, tu conserves ton droit de rétractation dans les conditions de droit commun ; contacte-nous à contact@calcile.fr pour l'exercer.",
      accuracyHeading: "Justesse des résultats",
      accuracyBody:
        "Calcile utilise SymPy (bibliothèque open-source, sympy.org) comme moteur de calcul. Comme tout logiciel, SymPy peut contenir des bugs ou des cas limites mal gérés. On ne peut donc pas garantir une exactitude à 100% des résultats et des étapes affichées. Vérifie les résultats importants, en particulier pour un usage académique noté ou professionnel.",
      accountsHeading: "Comptes",
      accountsBody:
        "L'accès se fait sur invitation. Tu es responsable de la confidentialité de ton mot de passe et de l'activité sur ton compte.",
      lawHeading: "Droit applicable et litiges",
      lawBody:
        "Les présentes conditions sont soumises au droit français. En cas de litige, contacte-nous d'abord à contact@calcile.fr pour une résolution amiable ; à défaut, les tribunaux français compétents seront saisis, dans le respect des règles impératives de protection des consommateurs applicables à ta situation.",
      changesHeading: "Modifications",
      changesBody:
        "On peut faire évoluer ces conditions ; les changements importants seront communiqués par email.",
      contactHeading: "Contact",
      contactBody: "Une question ? Écris-nous à contact@calcile.fr.",
      legalLinkLabel: "Voir les Mentions légales",
    },
    privacy: {
      metaTitle: "Confidentialité — Calcile",
      metaDescription: "Politique de confidentialité de Calcile.",
      heading: "Politique de confidentialité",
      lastUpdated: "Dernière mise à jour : 11 septembre 2026",
      intro:
        "Cette page explique quelles données Calcile collecte, pourquoi, et comment elles sont utilisées — pour le site calcile.fr et l'API qui le fait fonctionner.",
      dataHeading: "Données collectées",
      dataBody:
        "On collecte ton email (pour la waitlist et ton compte), ton mot de passe (haché, jamais en clair), l'historique de tes calculs (pour te permettre de les retrouver), et — si tu souscris un abonnement payant — les données de facturation gérées par Stripe (identifiant client Stripe, statut de l'abonnement, formule choisie). Calcile ne voit ni ne stocke jamais ton numéro de carte bancaire : il est saisi directement sur la page de paiement sécurisée de Stripe. On ne collecte pas plus que nécessaire au fonctionnement du service.",
      legalBasisHeading: "Base légale du traitement",
      legalBasisBody:
        "Le traitement de tes données repose sur l'exécution du contrat qui nous lie (article 6.1.b du RGPD) : te fournir l'accès au service, faire fonctionner ton compte, gérer ton abonnement le cas échéant. Les données de facturation sont en plus traitées pour respecter nos obligations légales et comptables (article 6.1.c du RGPD).",
      useHeading: "Utilisation des données",
      useBody:
        "Tes données servent à faire fonctionner ton compte et le service (authentification, historique, gestion de l'abonnement, emails transactionnels via Resend). On ne vend pas tes données et on ne les partage pas à des fins publicitaires.",
      retentionHeading: "Durée de conservation",
      retentionBody:
        "Tes données de compte et ton historique de calculs sont conservés tant que ton compte est actif, puis effacés dans un délai raisonnable après suppression du compte — sauf obligation légale de conservation plus longue, notamment pour les documents comptables et de facturation, conservés 10 ans conformément aux obligations comptables applicables aux entreprises.",
      thirdPartyHeading: "Prestataires et transferts hors UE",
      thirdPartyBody:
        "Calcile utilise SymPy, une bibliothèque open-source (voir notre page Licences), qui s'exécute sur nos propres serveurs — aucune donnée n'est envoyée à SymPy ou à un tiers pour effectuer les calculs. On fait par ailleurs appel aux prestataires suivants, chacun agissant comme sous-traitant au sens du RGPD : Railway (hébergement de l'API et de la base de données), Stripe (paiement et gestion des abonnements — Stripe Payments Europe Limited pour les utilisateurs européens), et Resend (envoi d'emails transactionnels). Ces prestataires peuvent traiter des données en dehors de l'Union européenne, notamment aux États-Unis ; ces transferts sont encadrés par des clauses contractuelles types de la Commission européenne et/ou une certification au Data Privacy Framework UE-États-Unis, selon le prestataire.",
      cookiesHeading: "Cookies et stockage local",
      cookiesBody:
        "Calcile n'utilise aucun cookie publicitaire ni outil d'analyse d'audience. Le site utilise uniquement le stockage local de ton navigateur (localStorage) pour deux usages strictement nécessaires au fonctionnement du service : garder ta session connectée, et mémoriser ta préférence de langue. Ces usages sont exemptés de consentement préalable au regard des recommandations de la CNIL sur les traceurs, car strictement nécessaires à la fourniture du service que tu demandes.",
      rightsHeading: "Tes droits",
      rightsBody:
        "Tu peux demander l'accès à tes données, leur correction, leur suppression, ou leur portabilité (récupération dans un format réutilisable) à tout moment en écrivant à contact@calcile.fr. Si tu estimes que tes droits ne sont pas respectés, tu peux aussi adresser une réclamation à la CNIL (cnil.fr).",
      licensesLinkLabel: "Voir la page Licences",
      legalLinkLabel: "Voir les Mentions légales",
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
          withdrawalConsentLabel:
            "I request immediate performance of the service as soon as payment is confirmed, and I expressly waive my 14-day right of withdrawal (article L221-28 13° of the French Consumer Code). I agree to the",
          withdrawalConsentTermsLink: "Terms of Sale and Use.",
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
      legalLinkLabel: "Legal notice",
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
    legal: {
      metaTitle: "Legal Notice — Calcile",
      metaDescription: "Identity of Calcile's publisher and host.",
      heading: "Legal Notice",
      lastUpdated: "Last updated: September 11, 2026",
      publisherHeading: "Site publisher",
      publisherBody:
        "Calcile is published by Amaury Le Roux, sole trader (French \"micro-entreprise\"), based in Besançon (France). SIREN: pending registration. VAT not applicable, article 293 B of the French General Tax Code. Contact: contact@calcile.fr.",
      publicationDirectorHeading: "Publication director",
      publicationDirectorBody: "Amaury Le Roux, as the site's publisher.",
      hostHeading: "Hosting",
      hostBody:
        "The calcile.fr site is hosted by Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA (vercel.com). The service's API and database are hosted separately by Railway Corporation — see our privacy policy for the full list of subprocessors and related data transfers.",
      ipHeading: "Intellectual property",
      ipBody:
        "Calcile's source code, interface, and own content belong to Amaury Le Roux, except where noted otherwise (see our Licenses page for the open-source dependencies used). Unauthorized reproduction is prohibited.",
      licensesLinkLabel: "See the Licenses page",
    },
    terms: {
      metaTitle: "Terms of Sale and Use — Calcile",
      metaDescription: "Terms of sale and use for the Calcile service.",
      heading: "Terms of Sale and Use",
      lastUpdated: "Last updated: September 11, 2026",
      intro:
        "By using Calcile, you agree to the following terms. This document will be expanded as the service evolves. For the publisher's and host's identity, see our Legal Notice.",
      serviceHeading: "The service",
      serviceBody:
        "Calcile is a symbolic computation API and UI (solving equations, derivatives, integrals) with step-by-step explanations, currently in closed beta by invitation, with optional paid plans (Student, Prof, Lab).",
      pricingHeading: "Pricing, subscription, and payment",
      pricingBody:
        "Calcile offers three subscription plans: Student (€4.90/month or €39/year), Prof (€50/month or €450/year), and Lab (custom pricing, dedicated contract). Displayed prices are net, all taxes included: Calcile is under the French VAT exemption scheme (\"franchise en base de TVA\", article 293 B of the General Tax Code), so VAT does not apply and does not appear on invoices. Payment is processed by our provider, Stripe; Calcile never sees or stores your card number.",
      renewalHeading: "Duration, automatic renewal, and cancellation",
      renewalBody:
        "Student and Prof subscriptions renew automatically: unless canceled before the end of the current period, the subscription renews for the same duration (monthly or yearly, depending on the plan) and the corresponding amount is charged automatically. You can cancel at any time from your account (the \"Manage subscription\" button, which opens the Stripe billing portal): cancellation takes effect at the end of the period already paid for, with no further renewal, and access to Calcile stays active until that date. Except where the right of withdrawal described below applies, amounts already paid for a current period are not refunded pro rata.",
      withdrawalHeading: "Right of withdrawal",
      withdrawalBody:
        "Under articles L221-18 et seq. of the French Consumer Code, you generally have 14 days to withdraw from a subscription entered into online, without needing to justify it. Access to Calcile is however granted immediately after payment: under article L221-28 13° of the same code, by checking the confirmation box shown before payment, you expressly request immediate performance of the service and expressly waive your right of withdrawal. Once that box is checked and payment is made, you can no longer withdraw for the current period. If you did not check that box, or if immediate performance hasn't started, you keep your right of withdrawal under ordinary conditions; contact us at contact@calcile.fr to exercise it.",
      accuracyHeading: "Accuracy of results",
      accuracyBody:
        "Calcile uses SymPy (an open-source library, sympy.org) as its computation engine. Like any software, SymPy can contain bugs or poorly-handled edge cases. We therefore cannot guarantee 100% accuracy of the results and steps shown. Verify important results yourself, especially for graded academic or professional use.",
      accountsHeading: "Accounts",
      accountsBody:
        "Access is by invitation. You're responsible for keeping your password confidential and for activity on your account.",
      lawHeading: "Governing law and disputes",
      lawBody:
        "These terms are governed by French law. In the event of a dispute, contact us first at contact@calcile.fr for an amicable resolution; failing that, the competent French courts will have jurisdiction, subject to the mandatory consumer-protection rules applicable to your situation.",
      changesHeading: "Changes",
      changesBody:
        "We may update these terms; significant changes will be communicated by email.",
      contactHeading: "Contact",
      contactBody: "Questions? Reach out at contact@calcile.fr.",
      legalLinkLabel: "See the Legal Notice",
    },
    privacy: {
      metaTitle: "Privacy — Calcile",
      metaDescription: "Calcile's privacy policy.",
      heading: "Privacy Policy",
      lastUpdated: "Last updated: September 11, 2026",
      intro:
        "This page explains what data Calcile collects, why, and how it's used — for the calcile.fr site and the API behind it.",
      dataHeading: "Data we collect",
      dataBody:
        "We collect your email (for the waitlist and your account), your password (hashed, never stored in plain text), your calculation history (so you can find your past work), and — if you subscribe to a paid plan — the billing data managed by Stripe (Stripe customer id, subscription status, chosen plan). Calcile never sees or stores your card number: it's entered directly on Stripe's own secure payment page. We don't collect more than the service needs to run.",
      legalBasisHeading: "Legal basis for processing",
      legalBasisBody:
        "Processing your data relies on the performance of our contract with you (GDPR article 6.1.b): providing access to the service, running your account, managing your subscription where applicable. Billing data is additionally processed to meet our legal and accounting obligations (GDPR article 6.1.c).",
      useHeading: "How we use your data",
      useBody:
        "Your data is used to run your account and the service (authentication, history, subscription management, transactional emails via Resend). We don't sell your data or share it for advertising purposes.",
      retentionHeading: "Data retention",
      retentionBody:
        "Your account data and calculation history are kept as long as your account is active, then deleted within a reasonable delay after account deletion — except where a longer legal retention period applies, notably for accounting and billing records, kept for 10 years under the accounting obligations applicable to businesses.",
      thirdPartyHeading: "Providers and transfers outside the EU",
      thirdPartyBody:
        "Calcile uses SymPy, an open-source library (see our Licenses page), which runs on our own servers — no data is sent to SymPy or a third party to perform calculations. We also use the following providers, each acting as a processor under the GDPR: Railway (API and database hosting), Stripe (payment and subscription management — Stripe Payments Europe Limited for European users), and Resend (transactional emails). These providers may process data outside the European Union, notably in the United States; such transfers are governed by the European Commission's Standard Contractual Clauses and/or certification under the EU-US Data Privacy Framework, depending on the provider.",
      cookiesHeading: "Cookies and local storage",
      cookiesBody:
        "Calcile uses no advertising cookies and no audience-analytics tool. The site only uses your browser's local storage (localStorage) for two uses strictly necessary to run the service: keeping you signed in, and remembering your language preference. Under CNIL's (the French data protection authority's) guidance on trackers, these uses are exempt from prior consent, since they're strictly necessary to provide the service you're requesting.",
      rightsHeading: "Your rights",
      rightsBody:
        "You can request access to, correction of, deletion of, or portability of (retrieval in a reusable format) your data at any time by writing to contact@calcile.fr. If you believe your rights aren't being respected, you can also file a complaint with the CNIL (cnil.fr).",
      licensesLinkLabel: "See the Licenses page",
      legalLinkLabel: "See the Legal Notice",
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
