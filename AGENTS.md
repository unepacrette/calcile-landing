# AGENTS.md — calcile-landing

Site public de Calcile (calcile.fr), Next.js, i18n FR/EN, déployé sur Vercel.
Réponds en français. Code et commits en anglais.

## Règles de contenu (tout texte visible)
- Ne jamais nommer un concurrent (WolframAlpha ou autre).
- Tous les appels à l'action pointent vers la waitlist, jamais vers une création de compte.
- Ne rien promettre qui ne soit pas en production. La bêta est sur invitation, l'accès est accordé à la main.
- Tarifs : Student 4,90 €/mois ou 39 €/an ; Professor 50 €/mois ou 450 €/an ; Lab sur devis. Pas d'offre gratuite.
- Tout texte existe en FR et en EN, les deux versions modifiées ensemble.
- Pages légales (mentions, confidentialité, CGV, cookies, rétractation) : ne pas modifier sans accord. Trois emplacements « [À REMPLIR] » attendent le médiateur CM2C.

## Règles d'ingénierie
- Lire le code existant avant de modifier. Plus petite modification possible.
- Lancer `npm run build` et `npm run lint` avant de conclure, donner le résultat réel.
- Nouvelle dépendance : mettre à jour la page /licenses et les fichiers de licences ; refuser GPL/AGPL.
- Variables d'environnement Vercel : vérifier leur valeur avant de pousser un changement qui en dépend.

## Git et déploiement
- Commits courts : feat: / fix: / docs: / refactor: / test:.
- Ne jamais pousser ni déployer en production sans accord explicite. Donner la commande exacte avant.

## Secrets
- Aucun secret dans le code, les logs ou les fichiers committés. Seules les variables NEXT_PUBLIC_* sont publiques par conception.

## Fin de tâche
Conclure par ce qui reste à vérifier ou à faire.
