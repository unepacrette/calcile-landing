import { useEffect, useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MathRender from "@/components/MathRender";
import { useLanguage } from "@/lib/i18n";
import {
  API_URL,
  authHeaders,
  clearStoredToken,
  getStoredToken,
} from "@/lib/api";

type Operation = "solve" | "derivative" | "integral";
type Status = "idle" | "loading" | "error";

type StepApi = { description: string; latex: string };

// No steps_text here: that legacy fallback only ever exists for the
// primary method (see SolveApiResponse/CalcApiResponse) — the backend
// deliberately omits it on alternatives, so we don't invent it either.
type AlternativeMethodApi = {
  method: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
};

type SolveApiResponse = {
  solution: string[];
  method: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
  steps_text: string[];
  alternative_methods: AlternativeMethodApi[];
};

type CalcApiResponse = {
  result: string;
  method: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
  steps_text: string[];
  alternative_methods: AlternativeMethodApi[];
};

type AlternativeMethod = {
  method: string;
  inputLatex: string;
  resultLatex: string;
  steps: StepApi[];
};

type Result = {
  values: string[];
  method: string;
  inputLatex: string;
  resultLatex: string;
  steps: StepApi[];
  stepsText: string[];
  alternativeMethods: AlternativeMethod[];
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
  // Indices of alternative methods currently expanded (collapsed by
  // default — showing every alternative's full steps at once would be
  // visually overwhelming).
  const [openAlternatives, setOpenAlternatives] = useState<Set<number>>(
    new Set()
  );

  function toggleAlternative(index: number) {
    setOpenAlternatives((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleLogout() {
    clearStoredToken();
    router.replace("/login");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setStatus("loading");
    setResult(null);
    setOpenAlternatives(new Set());

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
        setResult({
          values: body.solution,
          method: body.method,
          inputLatex: body.input_latex,
          resultLatex: body.result_latex,
          steps: body.steps ?? [],
          stepsText: body.steps_text ?? [],
          alternativeMethods: (body.alternative_methods ?? []).map((alt) => ({
            method: alt.method,
            inputLatex: alt.input_latex,
            resultLatex: alt.result_latex,
            steps: alt.steps,
          })),
        });
      } else {
        const body = (await response.json()) as CalcApiResponse;
        setResult({
          values: [body.result],
          method: body.method,
          inputLatex: body.input_latex,
          resultLatex: body.result_latex,
          steps: body.steps ?? [],
          stepsText: body.steps_text ?? [],
          alternativeMethods: (body.alternative_methods ?? []).map((alt) => ({
            method: alt.method,
            inputLatex: alt.input_latex,
            resultLatex: alt.result_latex,
            steps: alt.steps,
          })),
        });
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
        <Link
          href="/profile"
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          {t.solve.profileLink}
        </Link>
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
              {result.method && (
                <span className="inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {t.solve.methodLabel} : {result.method}
                </span>
              )}

              {result.inputLatex && (
                <div className="mt-4 overflow-x-auto text-center text-gray-800">
                  <MathRender latex={result.inputLatex} />
                </div>
              )}

              {result.steps.length > 0 ? (
                <>
                  <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t.solve.stepsHeading}
                  </h3>
                  <ol className="mt-3 space-y-4">
                    {result.steps.map((step, index) => (
                      <li
                        key={index}
                        className="border-l-2 border-violet-200 pl-4"
                      >
                        <p className="text-sm text-gray-700">
                          {step.description}
                        </p>
                        <div className="mt-1 overflow-x-auto text-gray-900">
                          <MathRender latex={step.latex} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                result.stepsText.length > 0 && (
                  <>
                    <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {t.solve.stepsHeading}
                    </h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                      {result.stepsText.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </>
                )
              )}

              <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.solve.resultHeading}
              </h2>
              {result.resultLatex ? (
                <div className="mt-2 overflow-x-auto rounded-lg border-2 border-violet-200 bg-violet-50 px-4 py-4 text-center text-xl text-violet-900">
                  <MathRender latex={result.resultLatex} />
                </div>
              ) : (
                <p className="mt-2 text-lg font-semibold text-violet-700">
                  {result.values.join(", ")}
                </p>
              )}

              {result.alternativeMethods.length > 0 && (
                <>
                  <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t.solve.alternativeMethodsHeading}
                  </h3>
                  <div className="mt-3 space-y-2">
                    {result.alternativeMethods.map((alt, index) => {
                      const isOpen = openAlternatives.has(index);
                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-gray-200"
                        >
                          <button
                            type="button"
                            onClick={() => toggleAlternative(index)}
                            aria-expanded={isOpen}
                            aria-label={
                              isOpen
                                ? t.solve.alternativeMethodsCollapse
                                : t.solve.alternativeMethodsExpand
                            }
                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                          >
                            <span>{alt.method}</span>
                            <span
                              aria-hidden="true"
                              className={`text-gray-400 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            >
                              ▾
                            </span>
                          </button>

                          {isOpen && (
                            <div className="border-t border-gray-200 px-4 py-4">
                              <ol className="space-y-4">
                                {alt.steps.map((step, stepIndex) => (
                                  <li
                                    key={stepIndex}
                                    className="border-l-2 border-violet-200 pl-4"
                                  >
                                    <p className="text-sm text-gray-700">
                                      {step.description}
                                    </p>
                                    <div className="mt-1 overflow-x-auto text-gray-900">
                                      <MathRender latex={step.latex} />
                                    </div>
                                  </li>
                                ))}
                              </ol>

                              <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-base text-gray-800">
                                <MathRender latex={alt.resultLatex} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
