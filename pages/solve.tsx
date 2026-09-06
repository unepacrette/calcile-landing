import { useEffect, useState, type FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import {
  API_URL,
  authHeaders,
  clearStoredToken,
  getStoredToken,
} from "@/lib/api";

type Operation = "solve" | "derivative" | "integral";
type Status = "idle" | "loading" | "error";

type SolveApiResponse = {
  solution: string[];
  steps: string[];
};

type CalcApiResponse = {
  result: string;
  steps: string[];
};

type Result = {
  values: string[];
  steps: string[];
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300";

export default function Solve() {
  const { t } = useLanguage();
  const router = useRouter();

  // Auth guard: null while we haven't checked localStorage yet (avoids
  // flashing the form before a redirect), then either the token or a
  // redirect to /login.
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      router.replace("/login");
      return;
    }
    // Reading localStorage must stay client-only (no `window` during SSR),
    // so the token can't be a lazy useState initializer without risking a
    // hydration mismatch — syncing it from that external store on mount is
    // the correct pattern here despite the lint rule below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(stored);
  }, [router]);

  const [operation, setOperation] = useState<Operation>("solve");
  const [equation, setEquation] = useState("");
  const [order, setOrder] = useState("");
  const [lowerBound, setLowerBound] = useState("");
  const [upperBound, setUpperBound] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);

  function handleLogout() {
    clearStoredToken();
    router.replace("/login");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setStatus("loading");
    setResult(null);

    try {
      let response: Response;

      if (operation === "solve") {
        response = await fetch(`${API_URL}/api/solve`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ equation }),
        });
      } else if (operation === "derivative") {
        const parsedOrder = order.trim() === "" ? undefined : Number(order);
        response = await fetch(`${API_URL}/api/derivative`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            equation,
            ...(parsedOrder !== undefined ? { order: parsedOrder } : {}),
          }),
        });
      } else {
        const lower = lowerBound.trim() === "" ? undefined : Number(lowerBound);
        const upper = upperBound.trim() === "" ? undefined : Number(upperBound);
        // Only send bounds when both are filled in; a single bound is
        // ignored and we fall back to an indefinite integral.
        const bothProvided = lower !== undefined && upper !== undefined;
        response = await fetch(`${API_URL}/api/integral`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            equation,
            ...(bothProvided
              ? { lower_bound: lower, upper_bound: upper }
              : {}),
          }),
        });
      }

      if (response.status === 401) {
        clearStoredToken();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      if (operation === "solve") {
        const body = (await response.json()) as SolveApiResponse;
        setResult({ values: body.solution, steps: body.steps });
      } else {
        const body = (await response.json()) as CalcApiResponse;
        setResult({ values: [body.result], steps: body.steps });
      }
      setStatus("idle");
    } catch (err) {
      console.error("[solve] échec de l'appel API :", err);
      setStatus("error");
    }
  }

  if (!token) {
    return null;
  }

  const tabs: { key: Operation; label: string }[] = [
    { key: "solve", label: t.solve.tabSolve },
    { key: "derivative", label: t.solve.tabDerivative },
    { key: "integral", label: t.solve.tabIntegral },
  ];

  return (
    <>
      <Head>
        <title>{t.solve.heading} — Calcile</title>
      </Head>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          {t.solve.logout}
        </button>
        <LanguageSwitcher />
      </div>

      <main className="min-h-screen bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-center text-3xl font-bold text-gray-900">
            {t.solve.heading}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t.solve.subtitle}
          </p>

          <div className="mt-8 flex justify-center gap-2 rounded-full border border-gray-300 bg-white p-1 text-sm font-semibold shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setOperation(tab.key)}
                aria-pressed={operation === tab.key}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  operation === tab.key
                    ? "bg-violet-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="solve-equation" className="sr-only">
                {t.solve.equationLabel}
              </label>
              <input
                id="solve-equation"
                type="text"
                required
                value={equation}
                onChange={(event) => setEquation(event.target.value)}
                placeholder={t.solve.equationPlaceholder}
                className={inputClass}
              />
            </div>

            {operation === "derivative" && (
              <div>
                <label
                  htmlFor="solve-order"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {t.solve.orderLabel}
                </label>
                <input
                  id="solve-order"
                  type="number"
                  min={1}
                  step={1}
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  placeholder="1"
                  className={inputClass}
                />
              </div>
            )}

            {operation === "integral" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="solve-lower-bound"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {t.solve.lowerBoundLabel}
                  </label>
                  <input
                    id="solve-lower-bound"
                    type="number"
                    value={lowerBound}
                    onChange={(event) => setLowerBound(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="solve-upper-bound"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {t.solve.upperBoundLabel}
                  </label>
                  <input
                    id="solve-upper-bound"
                    type="number"
                    value={upperBound}
                    onChange={(event) => setUpperBound(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? t.solve.submitLoading : t.solve.submit}
            </button>
          </form>

          {status === "error" && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {t.solve.error}
            </p>
          )}

          {result && (
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.solve.resultHeading}
              </h2>
              <p className="mt-2 text-lg font-semibold text-violet-700">
                {result.values.join(", ")}
              </p>

              {result.steps.length > 0 && (
                <>
                  <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t.solve.stepsHeading}
                  </h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                    {result.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
