import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
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

type Operation =
  | "solve"
  | "derivative"
  | "integral"
  | "limit"
  | "series"
  | "inequality"
  | "system"
  | "sum"
  | "product"
  | "matrix"
  | "plot";
type Status = "idle" | "loading" | "error";
type LimitDirection = "both" | "left" | "right";
type MatrixSize = 2 | 3;
type MatrixOperation = "determinant" | "inverse" | "eigenvalues";

// is_key marks the step where the actual solving technique is chosen/
// applied (see calcile-api's solver.sympy_engine.Step docstring) --
// always present (defaults to false server-side, never omitted), used
// here for the two-tone step hierarchy (COMPETITIVE_ANALYSIS.md, adapted
// from Symbolab): a key step is visually distinguished from routine
// setup/wrap-up steps around it. highlighted_latex is the same LaTeX
// with the sub-expression that changed from the previous step already
// wrapped in \textcolor{...}{...} by the backend (a real token-level
// diff, never guessed here) -- render it in place of `latex` whenever
// it's non-null, never re-derive a diff client-side.
type StepApi = {
  description: string;
  latex: string;
  is_key: boolean;
  highlighted_latex: string | null;
};

type GlossaryEntryApi = { symbol: string; name: string; definition: string };

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
  glossary: GlossaryEntryApi[];
};

type CalcApiResponse = {
  result: string;
  method: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
  steps_text: string[];
  alternative_methods: AlternativeMethodApi[];
  glossary: GlossaryEntryApi[];
};

// /api/system-solve's shape: no single "result", a {var: value} solution
// instead (rendered into the same result_latex/steps display as everything
// else — see handleSubmit's "system" branch).
type SystemApiResponse = {
  variables: string[];
  solution: Record<string, string>;
  method: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
  steps_text: string[];
  alternative_methods: AlternativeMethodApi[];
  glossary: GlossaryEntryApi[];
};

// /api/matrix/{determinant,inverse,eigenvalues}'s shape: same
// method/input_latex/result_latex/steps/... backbone as everything else,
// plus two fields only one particular operation ever populates:
// is_invertible (inverse only, null otherwise) and eigenvalues
// (eigenvalues only, [] otherwise).
type MatrixApiResponse = {
  input: string[][];
  method: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
  steps_text: string[];
  alternative_methods: AlternativeMethodApi[];
  glossary: GlossaryEntryApi[];
  is_invertible: boolean | null;
  eigenvalues: string[];
};

// /api/plot's shape: no method/steps/alternative_methods/glossary at all
// (a sampled curve has no pedagogical derivation to narrate) -- just the
// labeled function and its sampled points, rendered as its own dedicated
// view instead of going through the shared Result type below.
type PlotPointApi = { x: number; y: number | null };

type PlotApiResponse = {
  input_latex: string;
  variable: string;
  lower: number;
  upper: number;
  points: PlotPointApi[];
  y_min: number;
  y_max: number;
};

type AlternativeMethod = {
  method: string;
  inputLatex: string;
  resultLatex: string;
  steps: StepApi[];
};

type GlossaryEntry = { symbol: string; name: string; definition: string };

type Result = {
  values: string[];
  method: string;
  inputLatex: string;
  resultLatex: string;
  steps: StepApi[];
  stepsText: string[];
  alternativeMethods: AlternativeMethod[];
  glossary: GlossaryEntry[];
  // Only set (true/false) for a matrix/inverse result; null everywhere
  // else, including the other matrix operations.
  isInvertible: boolean | null;
};

const inputClass =
  "w-full rounded-lg border border-rule-strong px-4 py-3 text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-mark";

// A handful of evenly-spaced tick positions between min and max --
// shared by both axes of PlotChart below.
function evenlySpacedTicks(min: number, max: number, count: number): number[] {
  if (!(max > min)) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

function formatTick(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

// Inline SVG, no charting library (consistent with this repo only ever
// adding a dependency when strictly necessary -- see antlr4-python3-
// runtime's own commit message). A top-level component (not defined
// inside Solve()) purely for readability; it holds no state of its own.
function PlotChart({
  points,
  yMin,
  yMax,
  lower,
  upper,
  ariaLabel,
}: {
  points: { x: number; y: number | null }[];
  yMin: number;
  yMax: number;
  lower: number;
  upper: number;
  ariaLabel: string;
}) {
  const width = 600;
  const height = 340;
  const padding = 28;

  // Guards against dividing by zero for a degenerate range (a constant
  // function, or a single-point/empty domain) -- falls back to a 1-unit
  // span so the chart still renders instead of producing NaN coordinates.
  const xRange = upper - lower || 1;
  const yRange = yMax - yMin || 1;

  function toSvgX(x: number): number {
    return padding + ((x - lower) / xRange) * (width - 2 * padding);
  }
  function toSvgY(y: number): number {
    // SVG y grows downward -- flip so a larger y sits higher on screen.
    return height - padding - ((y - yMin) / yRange) * (height - 2 * padding);
  }

  // Break the curve into separate segments at every null point -- never
  // a line drawn across a gap (asymptote, restricted domain, ...).
  const segments: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  for (const point of points) {
    if (point.y === null) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      continue;
    }
    current.push({ x: toSvgX(point.x), y: toSvgY(point.y) });
  }
  if (current.length > 0) segments.push(current);

  const showXAxis = yMin <= 0 && yMax >= 0;
  const showYAxis = lower <= 0 && upper >= 0;
  const xTicks = evenlySpacedTicks(lower, upper, 5);
  const yTicks = evenlySpacedTicks(yMin, yMax, 5);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {xTicks.map((tickX) => (
        <g key={`x-${tickX}`}>
          <line
            x1={toSvgX(tickX)}
            y1={padding}
            x2={toSvgX(tickX)}
            y2={height - padding}
            className="stroke-rule"
            strokeWidth={1}
          />
          <text
            x={toSvgX(tickX)}
            y={height - padding + 14}
            textAnchor="middle"
            className="fill-ink-faint text-[9px]"
          >
            {formatTick(tickX)}
          </text>
        </g>
      ))}
      {yTicks.map((tickY) => (
        <g key={`y-${tickY}`}>
          <line
            x1={padding}
            y1={toSvgY(tickY)}
            x2={width - padding}
            y2={toSvgY(tickY)}
            className="stroke-rule"
            strokeWidth={1}
          />
          <text
            x={padding - 6}
            y={toSvgY(tickY) + 3}
            textAnchor="end"
            className="fill-ink-faint text-[9px]"
          >
            {formatTick(tickY)}
          </text>
        </g>
      ))}

      {showXAxis && (
        <line
          x1={padding}
          y1={toSvgY(0)}
          x2={width - padding}
          y2={toSvgY(0)}
          className="stroke-ink-faint"
          strokeWidth={1.5}
        />
      )}
      {showYAxis && (
        <line
          x1={toSvgX(0)}
          y1={padding}
          x2={toSvgX(0)}
          y2={height - padding}
          className="stroke-ink-faint"
          strokeWidth={1.5}
        />
      )}

      {segments.map((segment, index) => (
        <polyline
          key={index}
          points={segment.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          className="stroke-mark"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

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
  const [limitPoint, setLimitPoint] = useState("");
  const [limitDirection, setLimitDirection] = useState<LimitDirection>("both");
  const [seriesPoint, setSeriesPoint] = useState("0");
  const [seriesOrder, setSeriesOrder] = useState("5");
  const [systemEquations, setSystemEquations] = useState("");
  // Shared between the "sum" and "product" tabs: mutually exclusive and
  // structurally identical (expression + index variable + bounds), so one
  // set of fields covers both — same pattern as the shared equation input.
  const [sumProductVariable, setSumProductVariable] = useState("n");
  const [sumProductLower, setSumProductLower] = useState("");
  const [sumProductUpper, setSumProductUpper] = useState("");
  // Matrix tab: cells are always kept as a full 3x3 grid (so switching
  // 2x2 <-> 3x3 doesn't lose what was already typed in the shared
  // top-left corner) — only the top-left `matrixSize` x `matrixSize`
  // slice is rendered and sent.
  const [matrixSize, setMatrixSize] = useState<MatrixSize>(2);
  const [matrixOperation, setMatrixOperation] =
    useState<MatrixOperation>("determinant");
  const [matrixCells, setMatrixCells] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [matrixCellError, setMatrixCellError] = useState<string | null>(null);
  // Plot tab: same flex lower/upper layout as the integral tab, but a
  // separate pair of state variables -- these are always sent
  // (pre-filled "-10"/"10"), unlike the integral's optional bounds, so
  // sharing lowerBound/upperBound directly would change the integral
  // tab's own default (empty/optional) behavior.
  const [plotLower, setPlotLower] = useState("-10");
  const [plotUpper, setPlotUpper] = useState("10");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [plotResult, setPlotResult] = useState<PlotApiResponse | null>(null);
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

  // Tab bar overflow (9 tools, doesn't fit on a narrow screen): the bar
  // scrolls horizontally instead, with a left/right edge fade shown only
  // while there's more to scroll in that direction — recomputed on mount,
  // on window resize, and whenever the tab labels themselves change
  // (language switch), since any of those can change scrollWidth.
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

  const updateTabScrollShadows = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollTabsLeft(el.scrollLeft > 4);
    setCanScrollTabsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateTabScrollShadows();
    window.addEventListener("resize", updateTabScrollShadows);
    return () => window.removeEventListener("resize", updateTabScrollShadows);
  }, [updateTabScrollShadows, t]);

  function currentMatrixCells(): string[][] {
    return matrixCells.slice(0, matrixSize).map((row) => row.slice(0, matrixSize));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    if (operation === "matrix") {
      const hasEmptyCell = currentMatrixCells().some((row) =>
        row.some((cell) => cell.trim() === "")
      );
      if (hasEmptyCell) {
        setMatrixCellError(t.solve.matrixEmptyCellError);
        return;
      }
    }
    setMatrixCellError(null);

    setStatus("loading");
    setResult(null);
    setPlotResult(null);
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
      } else if (operation === "integral") {
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
      } else if (operation === "limit") {
        response = await fetch(`${API_URL}/api/limit`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            expression: equation,
            point: limitPoint,
            direction: limitDirection,
          }),
        });
      } else if (operation === "series") {
        const parsedOrder = seriesOrder.trim() === "" ? undefined : Number(seriesOrder);
        response = await fetch(`${API_URL}/api/series`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            expression: equation,
            ...(seriesPoint.trim() !== "" ? { point: seriesPoint } : {}),
            ...(parsedOrder !== undefined ? { order: parsedOrder } : {}),
          }),
        });
      } else if (operation === "inequality") {
        response = await fetch(`${API_URL}/api/inequality`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ inequality: equation }),
        });
      } else if (operation === "sum" || operation === "product") {
        response = await fetch(
          `${API_URL}/api/${operation === "sum" ? "sum" : "product"}`,
          {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({
              expression: equation,
              variable: sumProductVariable,
              lower: sumProductLower,
              upper: sumProductUpper,
            }),
          }
        );
      } else if (operation === "matrix") {
        response = await fetch(`${API_URL}/api/matrix/${matrixOperation}`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ matrix: currentMatrixCells() }),
        });
      } else if (operation === "plot") {
        response = await fetch(`${API_URL}/api/plot`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            expression: equation,
            lower: Number(plotLower),
            upper: Number(plotUpper),
          }),
        });
      } else {
        // system: one equation per non-empty line.
        const equations = systemEquations
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        response = await fetch(`${API_URL}/api/system-solve`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ equations }),
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
          glossary: body.glossary ?? [],
          isInvertible: null,
        });
      } else if (operation === "system") {
        const body = (await response.json()) as SystemApiResponse;
        setResult({
          values: Object.entries(body.solution).map(([name, value]) => `${name} = ${value}`),
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
          glossary: body.glossary ?? [],
          isInvertible: null,
        });
      } else if (operation === "matrix") {
        const body = (await response.json()) as MatrixApiResponse;
        setResult({
          values: [],
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
          glossary: body.glossary ?? [],
          isInvertible: body.is_invertible,
        });
      } else if (operation === "plot") {
        const body = (await response.json()) as PlotApiResponse;
        setPlotResult(body);
      } else {
        // derivative, integral, limit, series, inequality, sum, product:
        // same {result, method, ...} shape.
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
          glossary: body.glossary ?? [],
          isInvertible: null,
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
    { key: "limit", label: t.solve.tabLimit },
    { key: "series", label: t.solve.tabSeries },
    { key: "inequality", label: t.solve.tabInequality },
    { key: "system", label: t.solve.tabSystem },
    { key: "sum", label: t.solve.tabSum },
    { key: "product", label: t.solve.tabProduct },
    { key: "matrix", label: t.solve.tabMatrix },
    { key: "plot", label: t.solve.tabPlot },
  ];

  const equationPlaceholder =
    operation === "inequality"
      ? t.solve.inequalityPlaceholder
      : operation === "limit" || operation === "series" || operation === "plot"
        ? t.solve.expressionPlaceholder
        : operation === "sum" || operation === "product"
          ? t.solve.sumProductExpressionPlaceholder
          : t.solve.equationPlaceholder;

  return (
    <>
      <Head>
        <title>{t.solve.heading} — Calcile</title>
      </Head>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-3">
        <Link
          href="/profile"
          className="text-xs font-medium text-ink-faint hover:text-ink-soft"
        >
          {t.solve.profileLink}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-medium text-ink-faint hover:text-ink-soft"
        >
          {t.solve.logout}
        </button>
        <LanguageSwitcher />
      </div>

      <main className="min-h-screen bg-paper px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center text-4xl font-display font-semibold tracking-tight text-ink">
            {t.solve.heading}
          </h1>
          <p className="mt-2 text-center text-sm text-ink-soft">
            {t.solve.subtitle}
          </p>

          <div className="relative mt-8">
            <div
              ref={tabScrollRef}
              onScroll={updateTabScrollShadows}
              className="flex gap-2 overflow-x-auto rounded-full border border-rule-strong bg-paper-raised p-1 text-sm font-semibold shadow-sm [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(event) => {
                    setOperation(tab.key);
                    event.currentTarget.scrollIntoView({
                      behavior: "smooth",
                      inline: "nearest",
                      block: "nearest",
                    });
                  }}
                  aria-pressed={operation === tab.key}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition ${
                    operation === tab.key
                      ? "bg-mark text-paper-raised"
                      : "text-ink-soft hover:bg-paper"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Edge fades: the only hint (besides scrolling itself) that
                the 9-tab bar has more tools off-screen — only shown on the
                side that actually has more to scroll to. */}
            {canScrollTabsLeft && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-full bg-gradient-to-r from-paper-raised to-transparent"
              />
            )}
            {canScrollTabsRight && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-full bg-gradient-to-l from-paper-raised to-transparent"
              />
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {operation !== "system" && operation !== "matrix" && (
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
                  placeholder={equationPlaceholder}
                  className={inputClass}
                />
              </div>
            )}

            {operation === "system" && (
              <div>
                <label
                  htmlFor="solve-system-equations"
                  className="mb-1 block text-sm font-medium text-ink-soft"
                >
                  {t.solve.systemEquationsLabel}
                </label>
                <textarea
                  id="solve-system-equations"
                  required
                  rows={3}
                  value={systemEquations}
                  onChange={(event) => setSystemEquations(event.target.value)}
                  placeholder={t.solve.systemEquationsPlaceholder}
                  className={inputClass}
                />
              </div>
            )}

            {operation === "derivative" && (
              <div>
                <label
                  htmlFor="solve-order"
                  className="mb-1 block text-sm font-medium text-ink-soft"
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
                    className="mb-1 block text-sm font-medium text-ink-soft"
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
                    className="mb-1 block text-sm font-medium text-ink-soft"
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

            {operation === "limit" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="solve-limit-point"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.limitPointLabel}
                  </label>
                  <input
                    id="solve-limit-point"
                    type="text"
                    required
                    value={limitPoint}
                    onChange={(event) => setLimitPoint(event.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="solve-limit-direction"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.limitDirectionLabel}
                  </label>
                  <select
                    id="solve-limit-direction"
                    value={limitDirection}
                    onChange={(event) =>
                      setLimitDirection(event.target.value as LimitDirection)
                    }
                    className={inputClass}
                  >
                    <option value="both">{t.solve.limitDirectionBoth}</option>
                    <option value="left">{t.solve.limitDirectionLeft}</option>
                    <option value="right">{t.solve.limitDirectionRight}</option>
                  </select>
                </div>
              </div>
            )}

            {operation === "series" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="solve-series-point"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.seriesPointLabel}
                  </label>
                  <input
                    id="solve-series-point"
                    type="text"
                    value={seriesPoint}
                    onChange={(event) => setSeriesPoint(event.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="solve-series-order"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.seriesOrderLabel}
                  </label>
                  <input
                    id="solve-series-order"
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={seriesOrder}
                    onChange={(event) => setSeriesOrder(event.target.value)}
                    placeholder="5"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {(operation === "sum" || operation === "product") && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="solve-sum-product-variable"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.sumProductVariableLabel}
                  </label>
                  <input
                    id="solve-sum-product-variable"
                    type="text"
                    required
                    value={sumProductVariable}
                    onChange={(event) => setSumProductVariable(event.target.value)}
                    placeholder="n"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="solve-sum-product-lower"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.sumProductLowerLabel}
                  </label>
                  <input
                    id="solve-sum-product-lower"
                    type="text"
                    required
                    value={sumProductLower}
                    onChange={(event) => setSumProductLower(event.target.value)}
                    placeholder="1"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="solve-sum-product-upper"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.sumProductUpperLabel}
                  </label>
                  <input
                    id="solve-sum-product-upper"
                    type="text"
                    required
                    value={sumProductUpper}
                    onChange={(event) => setSumProductUpper(event.target.value)}
                    placeholder="oo"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {operation === "matrix" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="mb-1 text-sm font-medium text-ink-soft">
                      {t.solve.matrixSizeLabel}
                    </p>
                    <div className="inline-flex rounded-lg border border-rule-strong bg-paper-raised p-1 text-sm font-semibold shadow-sm">
                      {([2, 3] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setMatrixSize(size)}
                          aria-pressed={matrixSize === size}
                          className={`rounded-md px-4 py-1.5 transition ${
                            matrixSize === size
                              ? "bg-mark text-paper-raised"
                              : "text-ink-soft hover:bg-paper"
                          }`}
                        >
                          {size}×{size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium text-ink-soft">
                      {t.solve.matrixOperationLabel}
                    </p>
                    <div className="inline-flex rounded-lg border border-rule-strong bg-paper-raised p-1 text-sm font-semibold shadow-sm">
                      {(
                        [
                          ["determinant", t.solve.matrixOperationDeterminant],
                          ["inverse", t.solve.matrixOperationInverse],
                          ["eigenvalues", t.solve.matrixOperationEigenvalues],
                        ] as const
                      ).map(([op, label]) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setMatrixOperation(op)}
                          aria-pressed={matrixOperation === op}
                          className={`rounded-md px-3 py-1.5 transition ${
                            matrixOperation === op
                              ? "bg-mark text-paper-raised"
                              : "text-ink-soft hover:bg-paper"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium text-ink-soft">
                    {t.solve.matrixCellsLabel}
                  </p>
                  <div
                    className={`grid w-fit gap-2 ${
                      matrixSize === 2 ? "grid-cols-2" : "grid-cols-3"
                    }`}
                  >
                    {matrixCells.slice(0, matrixSize).map((row, rowIndex) =>
                      row.slice(0, matrixSize).map((cell, colIndex) => (
                        <input
                          key={`${rowIndex}-${colIndex}`}
                          type="text"
                          required
                          value={cell}
                          onChange={(event) => {
                            const value = event.target.value;
                            setMatrixCells((current) =>
                              current.map((r, ri) =>
                                ri === rowIndex
                                  ? r.map((c, ci) => (ci === colIndex ? value : c))
                                  : r
                              )
                            );
                            setMatrixCellError(null);
                          }}
                          placeholder={t.solve.matrixCellPlaceholder}
                          aria-label={`${t.solve.matrixCellsLabel} (${rowIndex + 1}, ${colIndex + 1})`}
                          className="h-14 w-14 rounded-lg border border-rule-strong text-center text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-mark"
                        />
                      ))
                    )}
                  </div>
                  {matrixCellError && (
                    <p className="mt-2 text-sm font-medium text-mark-strong">
                      {matrixCellError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {operation === "plot" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="solve-plot-lower"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.plotLowerBoundLabel}
                  </label>
                  <input
                    id="solve-plot-lower"
                    type="number"
                    required
                    value={plotLower}
                    onChange={(event) => setPlotLower(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="solve-plot-upper"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    {t.solve.plotUpperBoundLabel}
                  </label>
                  <input
                    id="solve-plot-upper"
                    type="number"
                    required
                    value={plotUpper}
                    onChange={(event) => setPlotUpper(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-mark px-6 py-3 text-sm font-semibold text-paper-raised shadow-sm transition duration-150 hover:bg-mark-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              {status === "loading" ? t.solve.submitLoading : t.solve.submit}
            </button>
          </form>

          {status === "error" && (
            <p className="mt-4 text-sm font-medium text-mark-strong">
              {t.solve.error}
            </p>
          )}

          {(result || plotResult) && (
            <div className="mt-10 rounded-2xl border border-rule bg-paper-raised p-6 shadow-md sm:p-8">
              {plotResult ? (
                <>
                  {plotResult.input_latex && (
                    <div className="overflow-x-auto rounded-lg bg-paper px-4 py-3 text-center text-base text-ink-soft">
                      <MathRender latex={plotResult.input_latex} />
                    </div>
                  )}
                  <div className="mt-6">
                    <PlotChart
                      points={plotResult.points}
                      yMin={plotResult.y_min}
                      yMax={plotResult.y_max}
                      lower={plotResult.lower}
                      upper={plotResult.upper}
                      ariaLabel={t.solve.plotChartAriaLabel}
                    />
                  </div>
                </>
              ) : (
                result && (
                  <>
              {result.method && (
                <span className="inline-block rounded-full bg-mark-soft px-3 py-1.5 text-xs font-bold tracking-wide text-mark-strong">
                  {t.solve.methodLabel} : {result.method}
                </span>
              )}

              {result.isInvertible === false && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  {t.solve.matrixNotInvertibleNotice}
                </p>
              )}

              {result.inputLatex && (
                <div className="mt-5 overflow-x-auto rounded-lg bg-paper px-4 py-3 text-center text-base text-ink-soft">
                  <MathRender latex={result.inputLatex} />
                </div>
              )}

              {/* Answer before steps, always -- the one universal pattern
                  across every competitor researched (WolframAlpha, Symbolab,
                  Mathway, Photomath): lead with the result, steps
                  below/after. COMPETITIVE_ANALYSIS.md's own "what NOT to
                  change" list claimed this was already the case here, citing
                  "resultLatex renders after steps" as proof -- but "renders
                  after" in the JSX/DOM order means steps appeared ABOVE the
                  answer on the page, the opposite of the stated principle.
                  Verified directly and corrected: Result now renders first,
                  Steps second. */}
              <h2 className="mt-10 font-mono text-sm font-bold uppercase tracking-widest text-mark-strong">
                {t.solve.resultHeading}
              </h2>
              {result.resultLatex ? (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-rule bg-check-soft px-6 py-8 text-center text-2xl font-semibold text-ink shadow-inner sm:text-3xl">
                  <MathRender latex={result.resultLatex} />
                </div>
              ) : (
                <p className="mt-3 text-2xl font-bold text-ink">
                  {result.values.join(", ")}
                </p>
              )}

              {result.steps.length > 0 ? (
                <>
                  <h3 className="mt-10 font-mono text-xs font-bold uppercase tracking-widest text-ink-faint">
                    {t.solve.stepsHeading}
                  </h3>
                  <ol className="mt-4 space-y-5">
                    {result.steps.map((step, index) => (
                      <li
                        key={index}
                        className={
                          step.is_key
                            ? "rounded-r-lg border-l-[3px] border-mark bg-mark-soft/80 py-2 pl-4 pr-3"
                            : "rounded-r-lg border-l-[3px] border-rule-strong bg-paper/60 py-2 pl-4 pr-3"
                        }
                      >
                        <p className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
                          {step.description}
                          {step.is_key && (
                            <span className="rounded-full bg-mark px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper-raised">
                              {t.solve.keyStepLabel}
                            </span>
                          )}
                        </p>
                        <div className="mt-1.5 overflow-x-auto text-[15px] text-ink">
                          <MathRender latex={step.highlighted_latex ?? step.latex} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                result.stepsText.length > 0 && (
                  <>
                    <h3 className="mt-10 font-mono text-xs font-bold uppercase tracking-widest text-ink-faint">
                      {t.solve.stepsHeading}
                    </h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
                      {result.stepsText.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </>
                )
              )}

              {result.glossary.length > 0 && (
                <div className="mt-8 border-t border-rule pt-5">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {t.solve.glossaryHeading}
                  </h3>
                  <dl className="mt-2 space-y-1.5">
                    {result.glossary.map((entry, index) => (
                      <div key={index} className="text-xs text-ink-faint">
                        <dt className="inline font-medium text-ink-faint">
                          {entry.symbol}
                        </dt>
                        <dd className="inline"> — {entry.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {result.alternativeMethods.length > 0 && (
                <>
                  <h3 className="mt-10 font-mono text-xs font-bold uppercase tracking-widest text-ink-faint">
                    {t.solve.alternativeMethodsHeading}
                  </h3>
                  <div className="mt-4 space-y-2.5">
                    {result.alternativeMethods.map((alt, index) => {
                      const isOpen = openAlternatives.has(index);
                      return (
                        <div
                          key={index}
                          className="overflow-hidden rounded-xl border border-rule"
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
                            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-ink transition-colors duration-150 hover:bg-paper active:scale-95"
                          >
                            <span>{alt.method}</span>
                            <span
                              aria-hidden="true"
                              className={`text-ink-faint transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            >
                              ▾
                            </span>
                          </button>

                          {isOpen && (
                            <div className="border-t border-rule px-4 py-4">
                              <ol className="space-y-5">
                                {alt.steps.map((step, stepIndex) => (
                                  <li
                                    key={stepIndex}
                                    className={
                                      step.is_key
                                        ? "rounded-r-lg border-l-[3px] border-mark bg-mark-soft/80 py-2 pl-4 pr-3"
                                        : "rounded-r-lg border-l-[3px] border-rule-strong bg-paper/60 py-2 pl-4 pr-3"
                                    }
                                  >
                                    <p className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
                                      {step.description}
                                      {step.is_key && (
                                        <span className="rounded-full bg-mark px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper-raised">
                                          {t.solve.keyStepLabel}
                                        </span>
                                      )}
                                    </p>
                                    <div className="mt-1.5 overflow-x-auto text-[15px] text-ink">
                                      <MathRender latex={step.highlighted_latex ?? step.latex} />
                                    </div>
                                  </li>
                                ))}
                              </ol>

                              <div className="mt-4 overflow-x-auto rounded-xl border border-rule bg-paper px-5 py-4 text-center text-lg font-medium text-ink">
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
                  </>
                )
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
