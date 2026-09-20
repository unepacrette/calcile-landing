import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MathRender from "@/components/MathRender";
import { useLanguage } from "@/lib/i18n";
import { API_URL, authHeaders, clearStoredToken, getStoredToken } from "@/lib/api";

type AnswerCheckApi = {
  raw_answer: string;
  parsed_values: string[];
  correct: boolean;
  error: string | null;
};

type ExerciseCheckHistoryEntryApi = {
  id: string;
  equation: string;
  real_solution: string[];
  results: AnswerCheckApi[];
  created_at: string;
};

type CalculationHistoryEntryApi = {
  id: string;
  kind: string;
  client_input: string;
  result_summary: string;
  created_at: string;
};

export default function History() {
  const { t } = useLanguage();
  const router = useRouter();

  // Auth guard: same pattern as pages/solve.tsx and pages/profile.tsx.
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(stored);
  }, [router]);

  // Same tier-fetch pattern already used in pages/solve.tsx for the
  // exercise-check gate -- kept as its own local copy rather than a
  // shared hook for now (see solve.tsx's own comment on this choice).
  const [profTier, setProfTier] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadTier() {
      try {
        const response = await fetch(`${API_URL}/api/billing/status`, {
          headers: authHeaders(token as string),
        });
        if (response.status === 401) {
          clearStoredToken();
          router.replace("/login");
          return;
        }
        if (!response.ok) return;
        const body = (await response.json()) as { tier: string };
        if (cancelled) return;
        setProfTier(body.tier);
      } catch (err) {
        console.error("[history] échec du chargement du tier :", err);
      }
    }

    loadTier();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isProf = profTier === "prof" || profTier === "lab";
  const hasCalcHistoryAccess = profTier !== null && profTier !== "free";

  // --- Exercise-check history (Prof/Lab) -- view only, no reload. ---
  const [exerciseChecks, setExerciseChecks] = useState<ExerciseCheckHistoryEntryApi[] | null>(
    null
  );

  useEffect(() => {
    if (!token || !isProf) return;
    let cancelled = false;

    async function loadExerciseChecks() {
      try {
        const response = await fetch(`${API_URL}/api/exercise/check/history`, {
          headers: authHeaders(token as string),
        });
        if (!response.ok) return;
        const body = (await response.json()) as { checks: ExerciseCheckHistoryEntryApi[] };
        if (cancelled) return;
        setExerciseChecks(body.checks);
      } catch (err) {
        console.error("[history] échec du chargement des corrections par lot :", err);
      }
    }

    loadExerciseChecks();
    return () => {
      cancelled = true;
    };
  }, [token, isProf]);

  // --- General calculation history (student/prof/lab) -- reloadable. ---
  const [calculations, setCalculations] = useState<CalculationHistoryEntryApi[] | null>(null);

  useEffect(() => {
    if (!token || !hasCalcHistoryAccess) return;
    let cancelled = false;

    async function loadCalculations() {
      try {
        const response = await fetch(`${API_URL}/api/user/calculation-history`, {
          headers: authHeaders(token as string),
        });
        if (!response.ok) return;
        const body = (await response.json()) as { calculations: CalculationHistoryEntryApi[] };
        if (cancelled) return;
        setCalculations(body.calculations);
      } catch (err) {
        console.error("[history] échec du chargement de l'historique des calculs :", err);
      }
    }

    loadCalculations();
    return () => {
      cancelled = true;
    };
  }, [token, hasCalcHistoryAccess]);

  if (!token) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{t.history.heading} — Calcile</title>
      </Head>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-3">
        <Link
          href="/profile"
          className="text-xs font-medium text-ink-faint hover:text-ink-soft"
        >
          {t.solve.profileLink}
        </Link>
        <LanguageSwitcher />
      </div>

      <main className="min-h-screen bg-paper px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center text-4xl font-display font-semibold tracking-tight text-ink">
            {t.history.heading}
          </h1>
          <p className="mt-6 text-center">
            <Link href="/solve" className="text-sm font-medium text-mark-strong hover:underline">
              {t.history.backLink}
            </Link>
          </p>

          {/* --- Corrections par lot (Prof/Lab) --- */}
          <section className="mt-12">
            <h2 className="text-lg font-display font-semibold text-ink">
              {t.history.exerciseChecksHeading}
            </h2>
            {!isProf ? (
              <div className="mt-3 max-w-md rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-semibold">{t.history.exerciseChecksLockedTitle}</p>
                <p className="mt-1">{t.history.exerciseChecksLockedMessage}</p>
                <Link
                  href="/profile"
                  className="mt-1 inline-block font-medium underline underline-offset-2"
                >
                  {t.history.exerciseChecksLockedCta}
                </Link>
              </div>
            ) : exerciseChecks === null ? null : exerciseChecks.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">{t.history.exerciseChecksEmpty}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {exerciseChecks.map((check) => {
                  const correctCount = check.results.filter((r) => r.correct).length;
                  return (
                    <div
                      key={check.id}
                      className="rounded-lg border border-rule bg-paper-raised px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="overflow-x-auto text-ink">
                          <MathRender latex={check.equation} displayMode={false} />
                        </div>
                        <span className="text-xs text-ink-faint">
                          {new Date(check.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-soft">
                        {check.results.length} {t.history.exerciseCheckAnswersCount} —{" "}
                        <span className="text-check">{correctCount} ✓</span>{" "}
                        <span className="text-mark-strong">
                          {check.results.length - correctCount} ✗
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* --- Historique général des calculs (student/prof/lab) --- */}
          <section className="mt-12">
            <h2 className="text-lg font-display font-semibold text-ink">
              {t.history.calculationsHeading}
            </h2>
            {!hasCalcHistoryAccess ? (
              <div className="mt-3 max-w-md rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-semibold">{t.history.calculationsLockedTitle}</p>
                <p className="mt-1">{t.history.calculationsLockedMessage}</p>
                <Link
                  href="/profile"
                  className="mt-1 inline-block font-medium underline underline-offset-2"
                >
                  {t.history.calculationsLockedCta}
                </Link>
              </div>
            ) : calculations === null ? null : calculations.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">{t.history.calculationsEmpty}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {calculations.map((calc) => (
                  <div
                    key={calc.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule bg-paper-raised px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded-full bg-mark-soft px-2 py-0.5 text-xs font-bold tracking-wide text-mark-strong">
                        {calc.kind}
                      </span>
                      <div className="mt-1 overflow-x-auto text-ink">
                        <MathRender latex={calc.result_summary} displayMode={false} />
                      </div>
                      <span className="text-xs text-ink-faint">
                        {new Date(calc.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Link
                      href={{
                        pathname: "/solve",
                        query: { reload: calc.client_input, kind: calc.kind },
                      }}
                      className="flex-none rounded-full border border-rule px-3 py-1.5 text-sm text-ink-soft transition duration-150 hover:border-rule-strong hover:bg-paper active:scale-95"
                    >
                      {t.history.calculationReload}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
