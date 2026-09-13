import { useEffect, useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import FormulaSheet from "@/components/FormulaSheet";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MathRender from "@/components/MathRender";
import { useLanguage } from "@/lib/i18n";

// mathlive registers a <document>-touching custom element at import time
// (confirmed not SSR-safe -- see MathInput.tsx's own comment) -- loaded
// client-only, never during the server render.
const MathInput = dynamic(() => import("@/components/MathInput"), { ssr: false });
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

// --- one-bar auto-detection ----------------------------------------------
//
// No operation picker (removed per explicit request: "il n'y a aucune
// catégorie, oublie cela" / "une barre... qui fait tout ce que je veux
// comme calcul, peu importe ce que je mets dedans"). What gets computed
// is inferred from the LaTeX MathLive produces, using each operation's
// own unambiguous LaTeX marker -- \frac{d}{dx} for a derivative, \int for
// an integral, \lim for a limit, \sum/\prod, <,>,\le,\ge for an
// inequality, a matrix environment, or several equations separated by
// ";" for a system. Falls back to "solve" (handles a bare equation or
// expression) when nothing more specific matches. Verified directly
// against one real example per operation before wiring this in, not
// assumed to work from the regexes alone.
//
// Known, deliberate gap: series and plot both need information (a
// Taylor order, or plot bounds) that no LaTeX marker distinguishes from
// a bare expression -- they're not reachable from this single bar today.
// Matrix detection always computes the determinant (there's no marker
// in a bare matrix for "I want the inverse instead"); inverse and
// eigenvalues are the same known gap.
function detectOperation(latex: string): Operation {
  const s = latex.replace(/\s+/g, "");
  if (!s) return "solve";
  if (/\\begin\{[pbv]?matrix\}/.test(s)) return "matrix";
  if (/;/.test(s) && (s.match(/=/g) ?? []).length >= 2) return "system";
  if (/\\lim/.test(s)) return "limit";
  if (/\\sum/.test(s)) return "sum";
  if (/\\prod/.test(s)) return "product";
  if (/\\int/.test(s)) return "integral";
  if (/\\frac\{d(\^\d+)?\}\{d[a-zA-Z](\^\d+)?\}/.test(s)) return "derivative";
  // \partial notation: this app is single-variable throughout, so a
  // partial derivative is computed the same way as an ordinary one --
  // without this, \frac{\partial}{\partial x} fell through to "solve"
  // and got sent raw, which parse_latex happens to turn into a real
  // sympy.Derivative object (confirmed) but then answers a different
  // question ("where is the derivative zero") than the button implies.
  if (/\\frac\{\\partial\}\{\\partial[a-zA-Z]\}/.test(s)) return "derivative";
  if (/<|>|\\le\b|\\ge\b|\\leq\b|\\geq\b/.test(s)) return "inequality";
  return "solve";
}

// Strips a matching outer (...) or \left(...\right) pair -- but only
// when it truly wraps the whole string (never a partial match, which
// would silently drop a real closing paren from the middle of the
// expression).
function stripOuterParens(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^\\left\(/, "(").replace(/\\right\)$/, ")");
  if (s.startsWith("(") && s.endsWith(")")) {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") {
        depth--;
        if (depth === 0 && i !== s.length - 1) return s;
      }
    }
    return s.slice(1, -1);
  }
  return s;
}

function extractDerivative(s: string): { expression: string; order: number } {
  const ordinary = s.match(/^\\frac\{d(\^(\d+))?\}\{d[a-zA-Z](\^(\d+))?\}(.*)$/);
  if (ordinary) {
    return {
      expression: stripOuterParens(ordinary[5]),
      order: ordinary[2] ? parseInt(ordinary[2], 10) : 1,
    };
  }
  // \frac{\partial}{\partial x} -- same single order as the ordinary
  // case above (see detectOperation's comment on why); the variable
  // letter itself (\partial x vs \partial y) doesn't matter here since
  // compute_derivative always differentiates w.r.t. the expression's own
  // free variable, not a caller-specified one.
  const partial = s.match(/^\\frac\{\\partial\}\{\\partial\s*[a-zA-Z]\}(.*)$/);
  if (partial) {
    return { expression: stripOuterParens(partial[1]), order: 1 };
  }
  return { expression: s, order: 1 };
}

function extractIntegral(
  s: string
): { expression: string; lower: string | null; upper: string | null } {
  const withDx = s.match(
    /^\\int(_\{?([^{}]*)\}?)?(\^\{?([^{}]*)\}?)?(.*?)\\?,?\s*d[a-zA-Z]$/
  );
  const m =
    withDx ??
    s.match(/^\\int(_\{?([^{}]*)\}?)?(\^\{?([^{}]*)\}?)?(.*)$/);
  if (!m) return { expression: s, lower: null, upper: null };
  const body = withDx ? m[5] : m[5].replace(/\\?,?\s*d[a-zA-Z]$/, "");
  return { expression: stripOuterParens(body), lower: m[2] || null, upper: m[4] || null };
}

function extractLimit(s: string): { variable: string; point: string; expression: string } {
  const m = s.match(/^\\lim_\{([a-zA-Z]+)\\to([^}]*)\}(.*)$/);
  if (!m) return { variable: "x", point: "0", expression: s };
  return { variable: m[1], point: m[2], expression: stripOuterParens(m[3]) };
}

function extractSumProduct(
  s: string,
  command: "sum" | "prod"
): { variable: string; lower: string; upper: string; expression: string } {
  const re = new RegExp(`^\\\\${command}_\\{([a-zA-Z]+)=([^}]*)\\}\\^\\{([^}]*)\\}(.*)$`);
  const m = s.match(re);
  if (!m) return { variable: "n", lower: "1", upper: "10", expression: s };
  return { variable: m[1], lower: m[2], upper: m[3], expression: stripOuterParens(m[4]) };
}

function extractSystem(s: string): string[] {
  return s
    .split(";")
    .map((eq) => eq.trim())
    .filter(Boolean);
}

function extractMatrix(s: string): string[][] | null {
  const m = s.match(/\\begin\{[pbv]?matrix\}(.*)\\end\{[pbv]?matrix\}/);
  if (!m) return null;
  return m[1].split("\\\\").map((row) => row.split("&").map((cell) => cell.trim()));
}

// A matrix raised to the -1 power is, mathematically, exactly a request
// for its inverse -- real notation, not a category picker (matches how
// \int vs \frac{d}{dx} already select different endpoints from
// notation alone). Only "^{-1}" or "^-1" immediately after the matrix's
// \end{...matrix} counts, so a -1 appearing inside a cell never matches.
function extractMatrixOperation(s: string): MatrixOperation {
  return /\\end\{[pbv]?matrix\}\s*\^\{?-1\}?/.test(s) ? "inverse" : "determinant";
}

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
  // The inner expression once an operator wrapper (\frac{d}{dx}, \int,
  // \lim, \sum, \prod) has been stripped off -- what actually gets sent
  // to the API for those operations, never the full typed notation (the
  // backend applies its own derivative/integral/etc. to a bare
  // expression; sending it the operator notation too would double the
  // operation up). Equal to `equation` itself for solve/inequality.
  const [derivedExpression, setDerivedExpression] = useState("");
  const [order, setOrder] = useState("1");
  const [lowerBound, setLowerBound] = useState("");
  const [upperBound, setUpperBound] = useState("");
  const [limitPoint, setLimitPoint] = useState("0");
  // No UI for this anymore (no operation picker at all) -- "both" is the
  // only value ever used, kept as a variable only because handleSubmit's
  // existing /api/limit request body already names it.
  const limitDirection: LimitDirection = "both";
  const [systemEquations, setSystemEquations] = useState("");
  // Shared between the "sum" and "product" tabs: mutually exclusive and
  // structurally identical (expression + index variable + bounds), so one
  // set of fields covers both — same pattern as the shared equation input.
  const [sumProductVariable, setSumProductVariable] = useState("n");
  const [sumProductLower, setSumProductLower] = useState("");
  const [sumProductUpper, setSumProductUpper] = useState("");
  // Determinant by default; "^{-1}" right after the matrix switches this
  // to inverse (see extractMatrixOperation) -- notation-driven, still no
  // operation-picker UI. Eigenvalues has no equivalent notation and stays
  // unreachable from this bar (a known, deliberate gap).
  const [matrixOperation, setMatrixOperation] = useState<MatrixOperation>("determinant");
  const [matrixCells, setMatrixCells] = useState<string[][] | null>(null);
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

  // Runs the one-bar auto-detection (see detectOperation & friends above)
  // every time the field's content changes, and populates the exact same
  // state handleSubmit already reads for each operation -- handleSubmit
  // itself is untouched, this only automates what used to be set by hand
  // via the removed per-operation fields.
  useEffect(() => {
    const detected = detectOperation(equation);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOperation(detected);
    switch (detected) {
      case "derivative": {
        const { expression, order: detectedOrder } = extractDerivative(equation);
        setDerivedExpression(expression);
        setOrder(String(detectedOrder));
        break;
      }
      case "integral": {
        const { expression, lower, upper } = extractIntegral(equation);
        setDerivedExpression(expression);
        setLowerBound(lower ?? "");
        setUpperBound(upper ?? "");
        break;
      }
      case "limit": {
        const { point, expression } = extractLimit(equation);
        setDerivedExpression(expression);
        setLimitPoint(point);
        break;
      }
      case "sum":
      case "product": {
        const { variable, lower, upper, expression } = extractSumProduct(
          equation,
          detected === "sum" ? "sum" : "prod"
        );
        setDerivedExpression(expression);
        setSumProductVariable(variable);
        setSumProductLower(lower);
        setSumProductUpper(upper);
        break;
      }
      case "system":
        setSystemEquations(extractSystem(equation).join("\n"));
        break;
      case "matrix":
        setMatrixCells(extractMatrix(equation));
        setMatrixOperation(extractMatrixOperation(equation));
        break;
      default:
        setDerivedExpression(equation);
    }
  }, [equation]);

  function currentMatrixCells(): string[][] {
    return matrixCells ?? [];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    // MathInput (MathLive's <math-field>) is a form-associated custom
    // element, but its participation in native HTML5 `required` validation
    // isn't something to assume -- unlike a plain <input required>, which
    // this field replaced. Checked explicitly instead of relying on it.
    if (equation.trim() === "") {
      return;
    }
    if (operation === "matrix" && matrixCells === null) {
      // Detected a matrix environment but couldn't parse cells out of it
      // (malformed LaTeX) -- never send a guessed/empty matrix.
      setStatus("error");
      return;
    }

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
            equation: derivedExpression,
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
            equation: derivedExpression,
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
            expression: derivedExpression,
            point: limitPoint,
            direction: limitDirection,
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
              expression: derivedExpression,
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

  // `glyph` is the compact math notation shown on each button (a
  // WolframAlpha/Symbolab-style symbol grid instead of a row of French
  // words) -- `label` stays as the accessible name (aria-label/title),
  // never dropped, since a bare glyph like "∫" isn't self-explanatory on
  // its own. No category grouping -- all 11 always shown flat, per
  // explicit "oublie les catégories".
  const tabs: { key: Operation; label: string; glyph: string }[] = [
    { key: "solve", label: t.solve.tabSolve, glyph: "x=" },
    { key: "system", label: t.solve.tabSystem, glyph: "{=}" },
    { key: "inequality", label: t.solve.tabInequality, glyph: "<" },
    { key: "matrix", label: t.solve.tabMatrix, glyph: "[A]" },
    { key: "derivative", label: t.solve.tabDerivative, glyph: "d/dx" },
    { key: "integral", label: t.solve.tabIntegral, glyph: "∫" },
    { key: "limit", label: t.solve.tabLimit, glyph: "lim" },
    { key: "series", label: t.solve.tabSeries, glyph: "Tₙ" },
    { key: "sum", label: t.solve.tabSum, glyph: "Σ" },
    { key: "product", label: t.solve.tabProduct, glyph: "Π" },
    { key: "plot", label: t.solve.tabPlot, glyph: "f(x)" },
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
        {/* A plain centered column up to lg (unchanged from before), a
            two-column grid past it -- the reference sheet ("à côté de
            ces calculs") sits beside the bar on a wide screen and simply
            stacks below it on a narrow one, rather than fighting the
            existing centered layout for space. */}
        <div className="mx-auto max-w-3xl lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
        <div className="mx-auto max-w-3xl lg:mx-0">
          <h1 className="text-center text-4xl font-display font-semibold tracking-tight text-ink">
            {t.solve.heading}
          </h1>
          <p className="mt-2 text-center text-sm text-ink-soft">
            {t.solve.subtitle}
          </p>

          {/* No operation picker at all, per explicit request ("il n'y a
              aucune catégorie, oublie cela") -- one bar, and what gets
              computed is detected from what's typed (see
              detectOperation below). This line is the only feedback for
              which mode that resolved to, so it's never a total mystery
              -- but it's a caption, not a control; nothing to click. */}
          <p className="mt-6 text-center text-xs font-medium uppercase tracking-wide text-ink-faint">
            {tabs.find((tab) => tab.key === operation)?.label}
          </p>

          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            <div>
              <label htmlFor="solve-equation" className="sr-only">
                {t.solve.equationLabel}
              </label>
              <MathInput
                id="solve-equation"
                value={equation}
                onChange={setEquation}
                placeholder={equationPlaceholder}
              />
              {/* Real math symbols form as you type (fractions, exponents,
                  roots) via MathLive -- typing "x^2" live-renders a
                  superscript instead of showing raw "x^2" as flat text.
                  One bar, no operation picker: what gets computed is
                  detected from what's typed (see detectOperation) --
                  an equation solves, \frac{d}{dx}(...) differentiates,
                  \int...dx integrates, \lim_{x\to a} takes a limit,
                  \sum/\prod sums or multiplies, <,> solves an inequality,
                  a matrix environment computes a determinant, and
                  multiple equations separated by ";" solve as a system. */}
            </div>

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

        <FormulaSheet />
        </div>
      </main>
    </>
  );
}
