# Tests navigateur (Playwright) — « Correction par lot » et /history

Suite Playwright (Chromium) qui vérifie de bout en bout, en local, la
correction par lot (tier Prof) et la page /history : flux prof complet,
historique des corrections par lot, historique des calculs + « Recharger »,
gating du tier free, redirection vers /login sans token invalide.

**Exécution locale à la demande uniquement** — pas branchée sur la CI
(télécharger un Chromium par runner est lourd et lent pour un gain faible ;
la barre CI reste `npm run lint` + `npm run build` + `npm run test`).

## Prérequis

- Node ≥ 20, npm ; `npm install` (installe `@playwright/test` en devDependency).
- `npx playwright install chromium` (une seule fois).
- Le dépôt **calcile-api** en sibling : `../calcile-api-clone` (sinon, passe
  `CALCILE_API_DIR=/chemin/vers/calcile-api`), avec son venv Poetry installé
  (`poetry install`) — Python 3.14 OK.
- Ports 3000 et 8000 libres.

## Lancer

```bash
npm run test:browser
```

Le script (`scripts/run-browser-tests.mjs`) fait tout :

1. génère une `SECRET_KEY` jetable (variable d'environnement uniquement,
   jamais écrite dans un fichier) ;
2. supprime/recrée `browser-test.db` **dans le dépôt API** (DB SQLite
   jetable, jamais `database.db`) et lance `poetry run uvicorn main:app
   --port 8000` avec `DATABASE_URL=sqlite:///./browser-test.db` ;
3. seed les utilisateurs de test via `tests/browser/seed_users.py`
   (bcrypt, `users/auth.py`) :
   - `prof@e2e.calcile.dev` / `ProfLocal123!` (tier `prof`) + une entrée
     d'historique de calcul (`solve`, `x^2 - 4 = 0`),
   - `free@e2e.calcile.dev` / `FreeLocal123!` (tier `free`) ;
4. lance `next dev --webpack` sur :3000 avec
   `NEXT_PUBLIC_CALCILE_API_URL=http://localhost:8000` (la CSP
   `connect-src` autorise `http://localhost:8000` **uniquement hors
   production** — voir `next.config.ts` ; la CSP déployée reste Railway-only) ;
5. exécute `npx playwright test --config tests/browser/playwright.config.ts`
   et renvoie son code de sortie.

Les tests sont séquentiels (`workers: 1`) et partagent la DB locale : le
test « historique des corrections par lot » dépend de la soumission faite
par le test précédent — lancez la suite entière, pas un test isolé (sauf
`--grep` sur les tests indépendants).

## Sémantique vérifiée (à connaître)

- **Égalité d'ensembles** : une réponse n'est « Correct » que si elle
  liste *toutes* les solutions (ex. `2, -2` pour `x^2 - 4 = 0`). Une
  réponse partielle (`2` seul) est « Incorrect » — comportement voulu du
  solver (`check_exercise_answers` : « a partial answer is wrong »).
- **Réponse non numérique** (`abc`) : parsée comme `a*b*c` par l'API,
  donc marquée « Incorrect » *sans* message d'erreur — la vraie solution
  s'affiche. Observation remontée dans le rapport du cycle (comportement
  API, non corrigé côté front).
- `POST /api/auth/login` est limité à 5/minute : la suite ne fait que
  3 logins par exécution (1 login UI prof, 1 token prof réutilisé via
  l'API pour les tests /history, 1 login UI free).

## Fichiers

- `exercise-check.spec.ts` — les 6 scénarios (a–e de l'issue #2).
- `playwright.config.ts` — baseURL `http://localhost:3000`, Chromium, 1 worker.
- `seed_users.py` — seed idempotent (lancé dans le venv de l'API, cwd = dépôt API).
- `scripts/run-browser-tests.mjs` (à la racine du dépôt landing) — orchestration.
