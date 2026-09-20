import { useEffect, useRef, useState, type FormEvent } from "react";
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
  | "sets"
  | "sets-symbolic"
  | "vectors"
  | "plot"
  | "exercise-check";
type Status = "idle" | "loading" | "error";
type LimitDirection = "both" | "left" | "right";
type MatrixOperation = "determinant" | "inverse" | "eigenvalues" | "transpose";

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

// /api/sets's shape: no single "result" field -- either result_elements
// (union/intersection/difference) or result_boolean (in/subset), the
// other always null (same "not applicable" convention as MatrixApiResponse).
// No alternative_methods either: unlike solving an equation there's no
// second elementary technique to offer for a mechanical set operation.
type SetsApiResponse = {
  operator: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
  steps_text: string[];
  glossary: GlossaryEntryApi[];
  result_elements: string[] | null;
  result_boolean: boolean | null;
};

// /api/vectors's shape: `result` (a scalar, dot/norm) xor `result_vector`
// (cross), the other null.
type VectorsApiResponse = {
  operator: string;
  input_latex: string;
  result_latex: string;
  steps: StepApi[];
  steps_text: string[];
  glossary: GlossaryEntryApi[];
  result: string | null;
  result_vector: string[] | null;
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

// /api/exercise/check's shape (Prof/Lab tier only): a results table, not a
// single result -- no method/steps/alternative_methods/glossary, its own
// dedicated view instead of the shared Result type below, same reasoning
// as PlotApiResponse just above.
type AnswerCheckApi = {
  raw_answer: string;
  parsed_values: string[];
  correct: boolean;
  error: string | null;
};

type ExerciseCheckApiResponse = {
  equation: string;
  variable: string;
  real_solution: string[];
  input_latex: string;
  result_latex: string;
  results: AnswerCheckApi[];
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
// Series is reachable via "taylor(f(x),a,n)" (a disclosed exception --
// see extractSeriesOperation -- since no real notation for it exists in
// any tool, unlike every other marker here); plot bounds default to
// [-10,10] with no way to override from the bar (no operation-picker UI
// to set them, matching the same "no picker" principle as everything
// else). A bare matrix computes the determinant; "^{-1}" after it means
// inverse; det(A - λI) = 0 (the real, standard characteristic-equation
// notation) means eigenvalues -- see extractMatrixOperation. Sets/
// vectors are checked before the generic matrix check below: both use a
// \begin{...matrix}...\end{...matrix}
// block as their own building block (a vector is just a column matrix),
// which would otherwise match the plain "matrix" branch first.
function detectOperation(latex: string): Operation {
  const s = latex.replace(/\s+/g, "");
  if (!s) return "solve";
  if (extractVectorOperation(s) !== null) return "vectors";
  if (extractSetOperation(s) !== null) return "sets";
  // extractSetOperation only matches a single operation -- a parenthesized
  // chain like (A∪B)∩C needs the real recursive parser (see
  // parseSetExpressionTree) to be recognized at all.
  if (countSetExpressionOps(parseSetExpressionTree(s)) >= 2) return "sets";
  // Bare, unbraced uppercase letters + at least one of \cup/\cap/\setminus/
  // \triangle -- the new symbolic/abstract set-algebra grammar (see
  // looksLikeSymbolicSetExpression below). Braces always route to the
  // concrete checks above instead, so there's no overlap with them; no
  // other check in this function has a marker this shape would collide
  // with either (confirmed directly: none of matrix/system/series/plot/
  // lim/sum/prod/integral/derivative/inequality's markers can appear in a
  // string made only of bare capital letters, the four set operators, and
  // parens), so placement here (rather than earlier/later) is for
  // readability only, not correctness.
  if (looksLikeSymbolicSetExpression(s)) return "sets-symbolic";
  // Reached only when neither concrete check above matched -- a braced
  // expression using set operators inside an operand, not a valid
  // element list (see toSymbolicSetExpression's own comment for why
  // this is worth a second try instead of failing outright).
  if (toSymbolicSetExpression(s) !== null) return "sets-symbolic";
  if (/\\begin\{[pbv]?matrix\}/.test(s)) return "matrix";
  if (/;/.test(s) && (s.match(/=/g) ?? []).length >= 2) return "system";
  if (extractSeriesOperation(s) !== null) return "series";
  if (extractPlotOperation(s) !== null) return "plot";
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
  // \b never actually matches after \le/\ge in practice -- their
  // argument (a digit or variable) is a word character too, so there's
  // no word/non-word transition for \b to find (confirmed directly:
  // "x\le5", "x\le n" and even "x\leq5" all failed to match this
  // exact pattern before the fix, silently routing the only two
  // Relations quick-symbol buttons -- ≤ and ≥ -- to "solve" instead of
  // "inequality"). A negative lookahead against \left is what \le
  // actually needs to guard against (the one real conflicting command
  // in this app's vocabulary -- checked directly against every \command
  // MathInput.tsx uses); \ge has no such conflict here. \ne (as a
  // literal prefix) covers \neq too -- \neq === "\ne" + "q", so a single
  // \\ne pattern matches both spellings in one branch (verified directly,
  // not assumed).
  if (/<|>|\\le(?!ft)|\\ge|\\leq|\\geq|\\ne/.test(s)) return "inequality";
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
// Eigenvalues have their own real, standard notation too: the
// characteristic equation det(A - λI) = 0 -- \det and \lambda both
// present is specific enough to be an unambiguous marker (extractMatrix
// itself doesn't care where the matrix block sits in the larger string,
// so the surrounding \det(...-\lambda I)=0 text around it is ignored
// there exactly the same way "^{-1}" is here). Transpose has its own real
// notation too -- "^{T}"/"^T" immediately after the matrix, the standard
// A^T convention -- checked after inverse (order between the two doesn't
// matter, a matrix can't end in both at once, but both must come after
// the eigenvalues check above since that's checked first).
function extractMatrixOperation(s: string): MatrixOperation {
  if (/\\det/.test(s) && /\\lambda/.test(s)) return "eigenvalues";
  if (/\\end\{[pbv]?matrix\}\s*\^\{?-1\}?/.test(s)) return "inverse";
  if (/\\end\{[pbv]?matrix\}\s*\^\{?T\}?/.test(s)) return "transpose";
  return "determinant";
}

// --- series (Taylor/Maclaurin) ---------------------------------------------
//
// Unlike every other marker here, no real handwritten/typed-notation
// convention for "give me the Taylor series of this" exists anywhere --
// checked directly against Wolfram|Alpha (free-text query, not
// notation), Mathematica (Series[f,{x,a,n}]), Maple (taylor(f,x=a,n)),
// SageMath (f.taylor(x,x0,n)), GeoGebra (TaylorPolynomial(f,a,n)): every
// one of them is a command, never a piece of math notation a person
// would write on paper. This is a deliberate, disclosed exception --
// adopting a known CAS function-call convention (Maple/SageMath-style)
// typed literally into the bar, not inventing new notation the way
// every other marker in this file avoids doing.
function extractSeriesOperation(
  s: string
): { expression: string; point: string; order: string } | null {
  const m = s.match(/^taylor\((.+),([^,()]+),([^,()]+)\)$/);
  if (!m) return null;
  return { expression: m[1], point: m[2].trim(), order: m[3].trim() };
}

// --- plot -------------------------------------------------------------------
//
// y = f(x) (or g(t) = ...) is a genuine, near-universal convention for
// "graph this" -- verified directly: it's Desmos's and GeoGebra's own
// primary interaction model (typing exactly this auto-plots), matches
// graphing-calculator convention (Y1=...) and standard textbook phrasing
// ("tracer la fonction y=f(x)"). A bare expression alone stays ambiguous
// (reads as "evaluate/simplify"), so the isolated dependent variable is
// what makes this an unambiguous marker.
function extractPlotOperation(
  s: string
): { variable: string; expression: string } | null {
  const named = s.match(/^([a-zA-Z])\(([a-zA-Z])\)=(.+)$/);
  if (named) return { variable: named[2], expression: named[3] };
  const bare = s.match(/^y=(.+)$/);
  if (bare) return { variable: "x", expression: bare[1] };
  return null;
}

// --- sets -----------------------------------------------------------------
//
// Finite sets, e.g. {1,2,3}, AND real intervals, e.g. [1,5] or ]1,5[ --
// scope grounded in real French lycée/L1 "calcul ensembliste" course
// material (interval union/intersection is the single most commonly
// drilled exercise type found there), matching calcile-api's own
// _parse_set_or_interval exactly: a single operand written in interval
// notation is sent as a one-element list, recognized and parsed as a
// real interval server-side, everything else is a plain finite set.
// Both bracket conventions work at once -- international "(1,5)"/
// "[1,5]" and French "]1,5["/"[1,5]" -- since they use different
// characters for "open" and position (first vs. last) disambiguates.
// Not routed through calcile-api's parse_latex at all (that grammar has
// zero support for \{...\} or intervals, confirmed directly): the same
// extraction-then-send pattern as extractMatrix, never the whole LaTeX
// string.
type SetsOperator =
  | "union"
  | "intersection"
  | "difference"
  | "symmetric_difference"
  | "in"
  | "subset"
  | "power_set"
  | "cartesian_product";

function extractSetElements(raw: string): string[] {
  const braceMatch = raw.match(/^\\\{(.*)\\\}$/);
  if (braceMatch) {
    const inner = braceMatch[1];
    if (inner.trim() === "") return [];
    return inner.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
  }
  // A single interval token (e.g. "[1,5]") is sent as-is, as the sole
  // element of a one-element list -- see the section comment above.
  return [raw.trim()];
}

// Finds the first occurrence of tokenRe that sits outside any \{...\} or
// (...) nesting -- depth-tracked, not a flat regex, so a token that's
// actually part of a nested operand's content (e.g. buried inside a
// compound left-hand side) is never mistaken for the top-level split
// point.
function findTopLevelToken(
  s: string,
  tokenRe: RegExp
): { index: number; match: string } | null {
  let depth = 0;
  let i = 0;
  while (i < s.length) {
    if (s.slice(i, i + 2) === "\\{" || s[i] === "(") {
      depth++;
      i += s[i] === "(" ? 1 : 2;
      continue;
    }
    if (s.slice(i, i + 2) === "\\}" || s[i] === ")") {
      depth--;
      i += s[i] === ")" ? 1 : 2;
      continue;
    }
    if (depth === 0) {
      const m = tokenRe.exec(s.slice(i));
      if (m && m.index === 0) return { index: i, match: m[0] };
    }
    i++;
  }
  return null;
}

// \in and \subseteq/\subset produce a boolean, so unlike the six chainable
// operators below they can never be a sub-expression operand -- they're
// always the single, outermost operation on the whole input. Detected via
// a depth-aware top-level scan (not a flat regex) so a nested \in/\subset
// occurring inside a compound operand's content is never mistaken for the
// real split point.
function extractMembershipOperation(
  s: string
): { operator: SetsOperator; left: string[]; right: string[] } | null {
  const inTok = findTopLevelToken(s, /^\\in/);
  if (inTok) {
    const rightTree = parseSetExpressionTree(s.slice(inTok.index + inTok.match.length));
    if (rightTree && rightTree.kind === "leaf") {
      return { operator: "in", left: [s.slice(0, inTok.index)], right: rightTree.elements };
    }
  }
  const subTok = findTopLevelToken(s, /^(\\subseteq|\\subset)/);
  if (subTok) {
    const leftTree = parseSetExpressionTree(s.slice(0, subTok.index));
    const rightTree = parseSetExpressionTree(s.slice(subTok.index + subTok.match.length));
    if (leftTree?.kind === "leaf" && rightTree?.kind === "leaf") {
      return { operator: "subset", left: leftTree.elements, right: rightTree.elements };
    }
  }
  return null;
}

// A single chainable operation (union/intersection/difference/
// symmetric_difference/power_set/cartesian_product) is exactly a
// one-op-node chain -- reuses parseSetExpressionTree instead of a second,
// separately-fragile flat-regex implementation (the old version here used
// a flat SET_OPERAND regex with no brace-nesting awareness, which could
// mis-split a compound operand into garbage instead of failing cleanly;
// confirmed directly: a real user's "{{A}∪{B}}∩{C}" produced
// left="\{A", right="B\}\}\cap\{C" instead of being rejected).
function extractSetOperation(
  s: string
): { operator: SetsOperator; left: string[]; right: string[] } | null {
  const membership = extractMembershipOperation(s);
  if (membership) return membership;
  const tree = parseSetExpressionTree(s);
  if (tree?.kind === "op" && countSetExpressionOps(tree) === 1) {
    if (tree.left.kind === "leaf" && (tree.right === null || tree.right.kind === "leaf")) {
      return {
        operator: tree.operator,
        left: tree.left.elements,
        right: tree.right ? tree.right.elements : [],
      };
    }
  }
  return null;
}

// --- chained set expressions, e.g. (A∪B)∩C ---------------------------------
//
// A real recursive-descent parser building an expression tree --
// parentheses group a sub-expression (the correct,
// standard way to write this; curly braces always mean "this is a
// literal set", never "grouping", same as on paper), flattened into the
// three-address-code form calcile-api's /api/sets/expression expects
// (each step's operand either a literal set/interval or an int index
// referencing an earlier step's own result). Scoped to the operators that
// always produce a real set to chain further (∪,∩,∖,∆,×, plus the
// power-set wrapper, matching calcile-api's own _CHAINABLE_SET_OPERATORS)
// -- \in/\subseteq stay single-operation only (extractMembershipOperation
// above), since a plain boolean isn't a meaningful operand of a further
// set op.
type SetExprNode =
  | { kind: "leaf"; elements: string[] }
  | { kind: "op"; operator: SetsOperator; left: SetExprNode; right: SetExprNode | null };

const CHAINABLE_SET_OP_MAP: Record<string, SetsOperator> = {
  "\\cup": "union",
  "\\cap": "intersection",
  "\\setminus": "difference",
  "\\triangle": "symmetric_difference",
  "\\times": "cartesian_product",
};

// A well-formed set element is a scalar value/expression -- never a
// nested set or another set operation. One of these tokens surviving
// inside an extracted element means the user tried to use curly braces
// for GROUPING (e.g. "{{A}∪{B}}∩{C}", parentheses are the correct way --
// see chained set expressions below) instead of writing a literal set.
// Rejecting this here, rather than silently forwarding a compound string
// as if it were one atomic element, is what stops calcile-api's LaTeX
// parser from absorbing "\cup"/"\cap" into fabricated symbol names like
// "cup"/"cap" instead of raising (confirmed directly:
// parse_expression_only('\{A\}\cup\{B\}') silently returns A*(B*cup)
// rather than erroring -- "doesn't crash" isn't "computes the right
// thing", the same class of bug this whole feature was built to avoid).
const INVALID_SET_ELEMENT_CONTENT = /\\(cup|cap|setminus|triangle)\b|\\[{}]/;

function parseSetExpressionTree(s: string): SetExprNode | null {
  let pos = 0;

  function parseSetLiteral(): SetExprNode | null {
    if (s.slice(pos, pos + 2) === "\\{") {
      let depth = 0;
      const start = pos;
      while (pos < s.length) {
        if (s.slice(pos, pos + 2) === "\\{") {
          depth++;
          pos += 2;
          continue;
        }
        if (s.slice(pos, pos + 2) === "\\}") {
          depth--;
          pos += 2;
          if (depth === 0) break;
          continue;
        }
        pos++;
      }
      if (depth !== 0) return null;
      const elements = extractSetElements(s.slice(start, pos));
      if (elements.some((e) => INVALID_SET_ELEMENT_CONTENT.test(e))) return null;
      return { kind: "leaf", elements };
    }
    // \emptyset and \mathbb{R/N/Z/Q/C} are real set-literal leaves too --
    // matching calcile-api's own _parse_finite_set special-casing
    // (confirmed backend-side): an operand whose element list is EXACTLY
    // ["\emptyset"] maps to the real empty set, and ["\mathbb{R}"] etc.
    // map to sympy.Reals/Naturals/Integers/Rationals/Complexes. Neither
    // token ever starts with "\{" so there's no ambiguity with the
    // finite-set branch above -- checked as fixed-length literal prefixes.
    if (s.slice(pos, pos + "\\emptyset".length) === "\\emptyset") {
      pos += "\\emptyset".length;
      return { kind: "leaf", elements: ["\\emptyset"] };
    }
    const mathbbMatch = /^\\mathbb\{([RNZQC])\}/.exec(s.slice(pos));
    if (mathbbMatch) {
      pos += mathbbMatch[0].length;
      return { kind: "leaf", elements: [`\\mathbb{${mathbbMatch[1]}}`] };
    }
    // Interval bound content excludes brackets too, not just braces/parens
    // -- without that, a greedy match can swallow past its own closing
    // bracket into whatever follows (confirmed directly: matched
    // "[1,5]\cap[" as if that whole span were one interval's upper bound).
    const m = /^[[(\]][^,{}()[\]]+,[^,{}()[\]]+[\])[]/.exec(s.slice(pos));
    if (m) {
      pos += m[0].length;
      return { kind: "leaf", elements: [m[0]] };
    }
    return null;
  }

  function parseTerm(): SetExprNode | null {
    if (s[pos] === "(") {
      pos++;
      const inner = parseExpr();
      if (inner === null || s[pos] !== ")") return null;
      pos++;
      return inner;
    }
    if (s.slice(pos, pos + "\\mathcal{P}(".length) === "\\mathcal{P}(") {
      pos += "\\mathcal{P}(".length;
      // The argument is a full sub-expression, not just a bare literal --
      // \mathcal{P}(A\cup B) is a legitimate power set of a compound set,
      // and without this it silently fell through to the old flat-regex
      // extractSetOperation path, which mis-split the compound argument
      // into a corrupted fragment that computed a wrong answer instead of
      // erroring (confirmed directly: \mathcal{P}(\{1,2,3,4\}\cup\{5,6,7\})
      // dropped an element rather than raising).
      const arg = parseExpr();
      if (arg === null || s[pos] !== ")") return null;
      pos++;
      return { kind: "op", operator: "power_set", left: arg, right: null };
    }
    return parseSetLiteral();
  }

  function parseExpr(): SetExprNode | null {
    let left = parseTerm();
    if (left === null) return null;
    for (;;) {
      const opMatch = /^(\\cup|\\cap|\\setminus|\\triangle|\\times)/.exec(s.slice(pos));
      if (!opMatch) break;
      pos += opMatch[0].length;
      const right = parseTerm();
      if (right === null) return null;
      left = { kind: "op", operator: CHAINABLE_SET_OP_MAP[opMatch[0]], left, right };
    }
    return left;
  }

  const result = parseExpr();
  return result !== null && pos === s.length ? result : null;
}

function countSetExpressionOps(node: SetExprNode | null): number {
  if (!node || node.kind !== "op") return 0;
  return 1 + countSetExpressionOps(node.left) + (node.right ? countSetExpressionOps(node.right) : 0);
}

function flattenSetExpressionTree(
  node: SetExprNode,
  steps: { operator: SetsOperator; left: string[] | number; right: string[] | number | null }[]
): string[] | number {
  if (node.kind === "leaf") return node.elements;
  const left = flattenSetExpressionTree(node.left, steps);
  const right = node.right ? flattenSetExpressionTree(node.right, steps) : null;
  steps.push({ operator: node.operator, left, right });
  return steps.length - 1;
}

// --- symbolic/abstract set expressions, e.g. A\cup(B\cap C) ---------------
//
// A genuinely different feature from the concrete-sets grammar above:
// calcile-api's POST /api/sets/simplify treats bare, unbraced uppercase
// letters (never wrapped in \{...\}) as abstract/named set variables and
// simplifies the whole expression via Boolean-algebra isomorphism
// (union<->Or, intersection<->And, ...). Disambiguated from the concrete
// grammar purely by operand shape -- \{1,2,3\}\cup\{4,5\} (braces) is the
// existing concrete feature; A\cup B (no braces at all) is this one.
// Mirrors calcile-api's own grammar exactly (see solver.sympy_engine's
// compute_symbolic_set_simplify docstring): valid tokens are a bare A-Z
// (optionally subscripted -- A_1 or A_{1}), \cup, \cap, \setminus,
// \triangle, ( and ). No tree needs to be built here (unlike the chained
// concrete-set expression above, which has to flatten into three-address
// code for /api/sets/expression) -- the whole raw string is forwarded
// as-is to /api/sets/simplify, so a careful structural regex check
// (at least one real operator present, nothing survives after stripping
// every valid token) is enough: no recursive-descent parser needed.
const SYMBOLIC_SET_OPERATOR_RE = /\\cup|\\cap|\\setminus|\\triangle/;
const SYMBOLIC_SET_TOKEN_RE =
  /[A-Z](_\{?\d+\}?)?|\\cup|\\cap|\\setminus|\\triangle|[()]/g;

function looksLikeSymbolicSetExpression(s: string): boolean {
  // Braces anywhere mean "this is the concrete-sets grammar's territory"
  // -- mutual exclusivity by design, checked first so a compound string
  // containing both a brace and a bare letter is never ambiguously routed.
  if (/\\[{}]/.test(s)) return false;
  // A bare "A" alone, or "(A)" alone, isn't a set expression worth
  // routing here -- it falls through to ordinary "solve" unchanged.
  if (!SYMBOLIC_SET_OPERATOR_RE.test(s)) return false;
  const stripped = s.replace(SYMBOLIC_SET_TOKEN_RE, "");
  return stripped === "";
}

// A real user overwhelmingly reaches for the EXISTING concrete-set
// buttons (which insert "\{#0\}\cup\{#0\}"-style skeletons) even when
// they mean abstract sets, not concrete elements -- confirmed directly,
// repeatedly: "\{\{A\}\cap\{B\}\}\cup\{C\}", braces used purely for
// GROUPING (meant as (A\cap B)\cup C) around further set operators, not
// enclosing an actual element list. That's indistinguishable in intent
// from the same expression with every "\{"/"\}" swapped for "("/")" --
// so when the concrete grammar rejects a braced expression (nested
// operators inside an operand, never valid element-list content), try
// that substitution before giving up. Returns the substituted string to
// actually send (not just a yes/no) since the caller needs it verbatim
// for the /api/sets/simplify request -- the raw typed string still has
// the "\{"/"\}" that would themselves get rejected by the backend's own
// whitelist. Returns null for anything that isn't this shape at all
// (no braces present) or that still doesn't reduce to a valid symbolic
// expression after substitution (e.g. a genuine concrete set like
// "\{1,2,3\}", digits and commas were never going to pass
// looksLikeSymbolicSetExpression either way).
function toSymbolicSetExpression(s: string): string | null {
  if (!/\\[{}]/.test(s)) return null;
  const substituted = s.replace(/\\\{/g, "(").replace(/\\\}/g, ")");
  return looksLikeSymbolicSetExpression(substituted) ? substituted : null;
}

// --- vectors ----------------------------------------------------------------
//
// A vector is a column matrix, e.g. \begin{pmatrix}1\\2\\3\end{pmatrix} --
// reuses the exact same \begin{...matrix}...\end{...matrix} block
// extractMatrix already parses, just flattened to one list of components
// instead of a grid, since a vector's only ever 1 row or 1 column.
function extractVectorComponents(matrixLatex: string): string[] {
  const m = matrixLatex.match(/^\\begin\{[pbv]?matrix\}(.*)\\end\{[pbv]?matrix\}$/);
  if (!m) return [];
  return m[1]
    .split("\\\\")
    .flatMap((row) => row.split("&").map((cell) => cell.trim()))
    .filter((cell) => cell.length > 0);
}

function extractVectorOperation(
  s: string
): { operator: "dot" | "cross" | "norm"; left: string[]; right: string[] | null } | null {
  const matrixBlock = "\\\\begin\\{[pbv]?matrix\\}.*?\\\\end\\{[pbv]?matrix\\}";
  const norm =
    s.match(new RegExp(`^\\\\left\\\\\\|(${matrixBlock})\\\\right\\\\\\|$`)) ??
    s.match(new RegExp(`^\\\\\\|(${matrixBlock})\\\\\\|$`));
  if (norm) {
    return { operator: "norm", left: extractVectorComponents(norm[1]), right: null };
  }
  const dot = s.match(new RegExp(`^(${matrixBlock})\\\\cdot(${matrixBlock})$`));
  if (dot) {
    return { operator: "dot", left: extractVectorComponents(dot[1]), right: extractVectorComponents(dot[2]) };
  }
  const cross = s.match(new RegExp(`^(${matrixBlock})\\\\times(${matrixBlock})$`));
  if (cross) {
    return { operator: "cross", left: extractVectorComponents(cross[1]), right: extractVectorComponents(cross[2]) };
  }
  return null;
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

// A handful of real, verified-working inputs spanning the tool's actual
// breadth -- fills the space below the (now collapsed-by-default)
// formula sheet with something genuinely useful instead of empty page
// background, and doubles as discoverability for features a new user
// wouldn't otherwise think to type (a chained inequality, an abstract
// set expression, a matrix transpose). Each one verified directly
// against this file's own detectOperation/extract* functions before
// being hardcoded here -- language-neutral (real math notation), only
// the chip label goes through t.solve.examples.
const QUICK_EXAMPLES: { id: string; latex: string }[] = [
  { id: "equation", latex: "x^2-4=0" },
  { id: "derivative", latex: "\\frac{d}{dx}(x^3+2x)" },
  { id: "integral", latex: "\\int x^2 dx" },
  { id: "limit", latex: "\\lim_{x\\to0}\\frac{\\sin(x)}{x}" },
  { id: "inequality", latex: "1\\le x\\le5" },
  { id: "sets", latex: "A\\cup(B\\cap C)" },
  { id: "matrix", latex: "\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}^{T}" },
  { id: "series", latex: "taylor(\\sin(x),0,5)" },
];

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

  // Prof/Lab-tier gate for the exercise-check entry point below -- same
  // GET /api/billing/status fetch pages/profile.tsx already uses, kept as
  // its own small local copy rather than a shared hook for a single reuse
  // (see this repo's "no abstraction beyond what's needed" convention;
  // extract one if a third use case shows up later). solve.tsx never
  // needed to know the user's tier before this feature.
  const [profTier, setProfTier] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadTier() {
      try {
        const response = await fetch(`${API_URL}/api/billing/status`, {
          headers: authHeaders(token as string),
        });
        if (!response.ok) return;
        const body = (await response.json()) as { tier: string };
        if (cancelled) return;
        setProfTier(body.tier);
      } catch (err) {
        console.error("[solve] échec du chargement du tier :", err);
      }
    }

    loadTier();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
  const [seriesPoint, setSeriesPoint] = useState("0");
  const [seriesOrder, setSeriesOrder] = useState("5");
  const [plotVariable, setPlotVariable] = useState("x");
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
  const [setsOperator, setSetsOperator] = useState<SetsOperator | null>(null);
  const [setsLeft, setSetsLeft] = useState<string[] | null>(null);
  const [setsRight, setSetsRight] = useState<string[] | null>(null);
  // Non-null only for a genuinely chained expression like (A∪B)∩C (2+
  // operations) -- handleSubmit posts to /api/sets/expression instead of
  // /api/sets when this is set, otherwise the plain single-operation
  // fields above are used exactly as before.
  const [setsExpressionSteps, setSetsExpressionSteps] = useState<
    { operator: SetsOperator; left: string[] | number; right: string[] | number | null }[] | null
  >(null);
  const [vectorOperator, setVectorOperator] = useState<"dot" | "cross" | "norm" | null>(null);
  const [vectorLeft, setVectorLeft] = useState<string[] | null>(null);
  const [vectorRight, setVectorRight] = useState<string[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  // The specific reason a computation failed, when the backend gave one
  // (e.g. "unsupported command '\wedge'", "chained inequalities aren't
  // supported yet") -- shown instead of the generic error message so a
  // rejected input (out of scope, not a real bug) is distinguishable from
  // an actual failure. null falls back to the generic message: a network
  // failure or a client-side-only rejection (couldn't extract matrix/sets/
  // vector params before ever calling the API) has no backend detail to
  // show.
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [plotResult, setPlotResult] = useState<PlotApiResponse | null>(null);
  // --- Exercise check (Prof/Lab tier: batch answer-checking) ---
  // Its own equation/answers state, deliberately separate from the shared
  // `equation`/MathInput bar above: the main bar's auto-detect useEffect
  // (detectOperation, keyed on `equation` changing) would otherwise
  // immediately flip `operation` away from "exercise-check" the moment
  // its value changed. Keeping this mode's input fully separate means the
  // main bar is simply not rendered while in this mode, so its state
  // never changes and never fights the auto-detect logic.
  const [exerciseCheckEquation, setExerciseCheckEquation] = useState("");
  const [exerciseCheckAnswers, setExerciseCheckAnswers] = useState("");
  const [exerciseCheckResult, setExerciseCheckResult] =
    useState<ExerciseCheckApiResponse | null>(null);
  const [showExerciseCheckLocked, setShowExerciseCheckLocked] = useState(false);
  const isProf = profTier === "prof" || profTier === "lab";
  // Scrolls the result card into view once a computation actually
  // finishes -- "une fois la reflexion fini il amene directement la vue
  // du site sur les etapes plutot que de rester fixe". A useEffect keyed
  // on result/plotResult (not called inline from handleSubmit) so it
  // only fires after React has actually committed the new result to the
  // DOM -- scrolling to a ref immediately after setResult() would still
  // target the *previous* render's layout, since state updates aren't
  // synchronous.
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (result || plotResult || exerciseCheckResult) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, plotResult, exerciseCheckResult]);
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

  // Set by the reload effect below when kind === "matrix_eigenvalues";
  // applied by the second effect further down, which fires *after* the
  // [equation]-keyed auto-detect effect has already run and set
  // matrixOperation itself -- calling setMatrixOperation directly from
  // the reload effect would just be overwritten by that later auto-
  // detect pass in the same flush, since no bar notation ever produces
  // "eigenvalues" on its own (a pre-existing gap, not introduced here).
  const [pendingEigenvaluesOverride, setPendingEigenvaluesOverride] = useState(false);

  // Reload-from-history: /history links here with ?reload=<client_input>
  // (+ &kind=system or &kind=matrix_eigenvalues for the two shapes that
  // can't go through the shared bar's own auto-detection). For every
  // other kind, setEquation alone is enough -- the existing [equation]-
  // keyed auto-detect effect below does the rest, exactly the same
  // mechanism the QUICK_EXAMPLES chips already use. Query params are
  // stripped right after so a page refresh doesn't repeat the reload.
  useEffect(() => {
    if (!router.isReady) return;
    const reload = router.query.reload;
    if (typeof reload !== "string" || reload.length === 0) return;

    const kind = typeof router.query.kind === "string" ? router.query.kind : null;
    if (kind === "system") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSystemEquations(reload);
      setOperation("system");
    } else {
      setEquation(reload);
      if (kind === "matrix_eigenvalues") {
        setPendingEigenvaluesOverride(true);
      }
    }
    router.replace("/solve", undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.reload, router.query.kind]);

  useEffect(() => {
    if (pendingEigenvaluesOverride && operation === "matrix") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatrixOperation("eigenvalues");
      setPendingEigenvaluesOverride(false);
    }
  }, [pendingEigenvaluesOverride, operation, matrixCells]);

  function handleLogout() {
    clearStoredToken();
    router.replace("/login");
  }

  // Entry point for the always-visible "Correction par lot" button below
  // the examples row: an authorized tier switches straight into the
  // dedicated exercise-check form; anyone else toggles the locked notice
  // (upgrade message + link to /profile) instead of the feature itself --
  // never hidden, per explicit product direction.
  function handleExerciseCheckEntryClick() {
    if (isProf) {
      setResult(null);
      setPlotResult(null);
      setExerciseCheckResult(null);
      setStatus("idle");
      setErrorDetail(null);
      setOperation("exercise-check");
    } else {
      setShowExerciseCheckLocked((current) => !current);
    }
  }

  function exitExerciseCheckMode() {
    setOperation(detectOperation(equation));
    setExerciseCheckResult(null);
    setStatus("idle");
    setErrorDetail(null);
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
      case "sets": {
        const tree = parseSetExpressionTree(equation);
        if (countSetExpressionOps(tree) >= 2) {
          // A genuinely chained expression -- flatten to steps and use
          // /api/sets/expression instead of the single-operation fields.
          const steps: { operator: SetsOperator; left: string[] | number; right: string[] | number | null }[] = [];
          flattenSetExpressionTree(tree as SetExprNode, steps);
          setSetsExpressionSteps(steps);
          setSetsOperator(null);
          setSetsLeft(null);
          setSetsRight(null);
        } else {
          setSetsExpressionSteps(null);
          const parsed = extractSetOperation(equation);
          setSetsOperator(parsed?.operator ?? null);
          setSetsLeft(parsed?.left ?? null);
          setSetsRight(parsed?.right ?? null);
        }
        break;
      }
      case "vectors": {
        const parsed = extractVectorOperation(equation);
        setVectorOperator(parsed?.operator ?? null);
        setVectorLeft(parsed?.left ?? null);
        setVectorRight(parsed?.right ?? null);
        break;
      }
      case "series": {
        const parsed = extractSeriesOperation(equation);
        setDerivedExpression(parsed?.expression ?? equation);
        setSeriesPoint(parsed?.point ?? "0");
        setSeriesOrder(parsed?.order ?? "5");
        break;
      }
      case "plot": {
        const parsed = extractPlotOperation(equation);
        setDerivedExpression(parsed?.expression ?? equation);
        setPlotVariable(parsed?.variable ?? "x");
        break;
      }
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
    // exercise-check uses its own separate equation field (see its state
    // declaration above), never the shared `equation` -- validated below
    // instead.
    if (operation !== "exercise-check" && equation.trim() === "") {
      return;
    }
    if (
      operation === "exercise-check" &&
      (exerciseCheckEquation.trim() === "" || exerciseCheckAnswers.trim() === "")
    ) {
      setStatus("error");
      setErrorDetail(null);
      return;
    }
    if (operation === "matrix" && matrixCells === null) {
      // Detected a matrix environment but couldn't parse cells out of it
      // (malformed LaTeX) -- never send a guessed/empty matrix.
      setStatus("error");
      setErrorDetail(null);
      return;
    }
    if (
      operation === "sets" &&
      setsExpressionSteps === null &&
      (setsOperator === null || setsLeft === null || setsRight === null)
    ) {
      setStatus("error");
      setErrorDetail(null);
      return;
    }
    if (operation === "vectors" && (vectorOperator === null || vectorLeft === null)) {
      setStatus("error");
      setErrorDetail(null);
      return;
    }

    setStatus("loading");
    setResult(null);
    setPlotResult(null);
    setExerciseCheckResult(null);
    setErrorDetail(null);
    setOpenAlternatives(new Set());

    try {
      let response: Response;

      if (operation === "solve") {
        response = await fetch(`${API_URL}/api/solve`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ equation, client_input: equation }),
        });
      } else if (operation === "derivative") {
        const parsedOrder = order.trim() === "" ? undefined : Number(order);
        response = await fetch(`${API_URL}/api/derivative`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            equation: derivedExpression,
            ...(parsedOrder !== undefined ? { order: parsedOrder } : {}),
            client_input: equation,
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
            client_input: equation,
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
            client_input: equation,
          }),
        });
      } else if (operation === "inequality") {
        response = await fetch(`${API_URL}/api/inequality`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ inequality: equation, client_input: equation }),
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
              client_input: equation,
            }),
          }
        );
      } else if (operation === "matrix") {
        response = await fetch(`${API_URL}/api/matrix/${matrixOperation}`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ matrix: currentMatrixCells(), client_input: equation }),
        });
      } else if (operation === "sets") {
        response =
          setsExpressionSteps !== null
            ? await fetch(`${API_URL}/api/sets/expression`, {
                method: "POST",
                headers: authHeaders(token),
                body: JSON.stringify({ steps: setsExpressionSteps, client_input: equation }),
              })
            : await fetch(`${API_URL}/api/sets`, {
                method: "POST",
                headers: authHeaders(token),
                body: JSON.stringify({
                  operator: setsOperator,
                  left: setsLeft,
                  right: setsRight,
                  client_input: equation,
                }),
              });
      } else if (operation === "sets-symbolic") {
        // The whole expression forwarded as one string -- unlike the
        // concrete-sets branch above, /api/sets/simplify takes one
        // expression, not pre-extracted operator/left/right fields.
        // toSymbolicSetExpression(equation) is non-null exactly when
        // detectOperation reached this operation via its brace-fallback
        // path (see its own comment) -- the braces the user actually
        // typed would themselves be rejected by the backend's whitelist,
        // so the "(" / ")"-substituted form is what actually gets sent;
        // falls back to the raw equation unchanged for the no-braces
        // case, which toSymbolicSetExpression always returns null for.
        response = await fetch(`${API_URL}/api/sets/simplify`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            expression: toSymbolicSetExpression(equation) ?? equation,
            client_input: equation,
          }),
        });
      } else if (operation === "vectors") {
        response = await fetch(`${API_URL}/api/vectors`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            operator: vectorOperator,
            left: vectorLeft,
            ...(vectorRight !== null ? { right: vectorRight } : {}),
            client_input: equation,
          }),
        });
      } else if (operation === "series") {
        response = await fetch(`${API_URL}/api/series`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            expression: derivedExpression,
            point: seriesPoint,
            order: Number(seriesOrder),
            client_input: equation,
          }),
        });
      } else if (operation === "plot") {
        response = await fetch(`${API_URL}/api/plot`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            expression: derivedExpression,
            variable: plotVariable,
            client_input: equation,
          }),
        });
      } else if (operation === "exercise-check") {
        // One proposed answer per non-empty line -- same \n-join/split
        // convention as "system" just below, a single line may itself
        // hold several comma-separated values (e.g. "2, -2").
        const answers = exerciseCheckAnswers
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        response = await fetch(`${API_URL}/api/exercise/check`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ equation: exerciseCheckEquation, answers }),
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
          body: JSON.stringify({ equations, client_input: equation }),
        });
      }

      if (response.status === 401) {
        clearStoredToken();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        // The backend's error handlers always return {"detail": "..."}
        // (see calcile-api's api/errors.py) -- surfacing it instead of
        // only the generic banner is what lets a cleanly-rejected,
        // out-of-scope input (e.g. "unsupported command") read as
        // different from an actual failure.
        try {
          const body = (await response.json()) as { detail?: string };
          setErrorDetail(typeof body.detail === "string" ? body.detail : null);
        } catch {
          setErrorDetail(null);
        }
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
      } else if (operation === "sets") {
        const body = (await response.json()) as SetsApiResponse;
        const operatorLabels: Record<string, string> = {
          union: t.solve.setsOperatorUnion,
          intersection: t.solve.setsOperatorIntersection,
          difference: t.solve.setsOperatorDifference,
          symmetric_difference: t.solve.setsOperatorSymmetricDifference,
          in: t.solve.setsOperatorIn,
          subset: t.solve.setsOperatorSubset,
          power_set: t.solve.setsOperatorPowerSet,
          cartesian_product: t.solve.setsOperatorCartesianProduct,
          expression: t.solve.setsOperatorExpression,
        };
        setResult({
          values: [],
          method: operatorLabels[body.operator] ?? body.operator,
          inputLatex: body.input_latex,
          resultLatex: body.result_latex,
          steps: body.steps ?? [],
          stepsText: body.steps_text ?? [],
          alternativeMethods: [],
          glossary: body.glossary ?? [],
          isInvertible: null,
        });
      } else if (operation === "vectors") {
        const body = (await response.json()) as VectorsApiResponse;
        const operatorLabels: Record<string, string> = {
          dot: t.solve.vectorOperatorDot,
          cross: t.solve.vectorOperatorCross,
          norm: t.solve.vectorOperatorNorm,
        };
        setResult({
          values: [],
          method: operatorLabels[body.operator] ?? body.operator,
          inputLatex: body.input_latex,
          resultLatex: body.result_latex,
          steps: body.steps ?? [],
          stepsText: body.steps_text ?? [],
          alternativeMethods: [],
          glossary: body.glossary ?? [],
          isInvertible: null,
        });
      } else if (operation === "plot") {
        const body = (await response.json()) as PlotApiResponse;
        setPlotResult(body);
      } else if (operation === "exercise-check") {
        const body = (await response.json()) as ExerciseCheckApiResponse;
        setExerciseCheckResult(body);
      } else {
        // derivative, integral, limit, series, inequality, sum, product,
        // sets-symbolic: same {result, method, input_latex, result_latex,
        // steps, steps_text, alternative_methods, glossary} shape --
        // /api/sets/simplify's SymbolicSetsResponse is this exact
        // CalcApiResponse backbone plus two extra fields (input, variables)
        // this UI has no use for, so it's read with the same type and
        // rendered through the same generic branch rather than duplicating
        // it; alt.method is already rendered as-is below (in French, from
        // the backend), so no new i18n key is needed for the CNF/DNF
        // "alternative_methods" rewrites this endpoint returns either.
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
    { key: "sets", label: t.solve.tabSets, glyph: "{A}" },
    // Same label as the concrete-sets tab above -- this is the same
    // "Ensembles"/"Sets" feature area, just the abstract-variable grammar
    // (bare A, B, C... instead of \{...\}) rather than a separate concept
    // needing its own translated name.
    { key: "sets-symbolic", label: t.solve.tabSets, glyph: "A∪B" },
    { key: "vectors", label: t.solve.tabVectors, glyph: "v⃗" },
    { key: "derivative", label: t.solve.tabDerivative, glyph: "d/dx" },
    { key: "integral", label: t.solve.tabIntegral, glyph: "∫" },
    { key: "limit", label: t.solve.tabLimit, glyph: "lim" },
    { key: "series", label: t.solve.tabSeries, glyph: "Tₙ" },
    { key: "sum", label: t.solve.tabSum, glyph: "Σ" },
    { key: "product", label: t.solve.tabProduct, glyph: "Π" },
    { key: "plot", label: t.solve.tabPlot, glyph: "f(x)" },
    { key: "exercise-check", label: t.solve.tabExerciseCheck, glyph: "✓/✗" },
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
          href="/history"
          className="text-xs font-medium text-ink-faint hover:text-ink-soft"
        >
          {t.solve.historyLink}
        </Link>
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

          <form onSubmit={handleSubmit} className="mt-2">
            {operation === "exercise-check" ? (
              // First real <textarea> in this app (confirmed none existed
              // before this feature) -- a batch of proposed answers is a
              // genuinely different input shape from every other operation
              // here, all of which are inferred from the one MathLive bar.
              // This mode uses its own separate equation field/state (see
              // exerciseCheckEquation's declaration above) rather than the
              // shared bar, so it never fights detectOperation.
              <div className="space-y-3">
                <div>
                  <label htmlFor="exercise-check-equation" className="sr-only">
                    {t.solve.exerciseCheckEquationLabel}
                  </label>
                  <MathInput
                    id="exercise-check-equation"
                    value={exerciseCheckEquation}
                    onChange={setExerciseCheckEquation}
                    placeholder={t.solve.exerciseCheckEquationPlaceholder}
                  />
                </div>
                <div>
                  <label
                    htmlFor="exercise-check-answers"
                    className="mb-1 block text-xs font-medium text-ink-soft"
                  >
                    {t.solve.exerciseCheckAnswersLabel}
                  </label>
                  <textarea
                    id="exercise-check-answers"
                    value={exerciseCheckAnswers}
                    onChange={(event) => setExerciseCheckAnswers(event.target.value)}
                    placeholder={t.solve.exerciseCheckAnswersPlaceholder}
                    rows={6}
                    className={`${inputClass} font-mono text-sm`}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={exitExerciseCheckMode}
                    className="text-xs font-medium text-ink-faint hover:text-ink-soft"
                  >
                    {t.solve.exerciseCheckBack}
                  </button>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex-none whitespace-nowrap rounded-xl bg-mark px-6 py-3 text-sm font-semibold text-paper-raised shadow-sm transition duration-150 hover:bg-mark-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                  >
                    {status === "loading" ? t.solve.submitLoading : t.solve.exerciseCheckSubmit}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <label htmlFor="solve-equation" className="sr-only">
                  {t.solve.equationLabel}
                </label>
                <MathInput
                  id="solve-equation"
                  value={equation}
                  onChange={setEquation}
                  placeholder={equationPlaceholder}
                  trailingAction={
                    // Beside the field, not below the whole symbol palette --
                    // "le bouton calculer devrait etre a cote de la barre de
                    // calcul si possible". Stretches to the field's own
                    // height via the parent's items-stretch; stacks full-width
                    // below the field on narrow screens instead of squeezing
                    // both into one cramped row.
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full flex-none whitespace-nowrap rounded-xl bg-mark px-6 text-sm font-semibold text-paper-raised shadow-sm transition duration-150 hover:bg-mark-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 sm:w-auto"
                    >
                      {status === "loading" ? t.solve.submitLoading : t.solve.submit}
                    </button>
                  }
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
                    multiple equations separated by ";" solve as a system.
                    Enter (not Shift+Enter) inside the field also submits --
                    see MathInput's own onKeyDown -- so this button is the
                    explicit affordance, not the only way to submit. */}
              </>
            )}
          </form>

          {operation !== "exercise-check" && (
            <>
              {/* Right under the bar/form itself -- "la section essayer un
                  exemple... on pourrait la mettre juste en dessous de
                  formulaire" (the calculation form, not the formula
                  reference sheet it was sitting under before, in the
                  easy-to-miss sidebar column). A horizontal row of chips
                  fits the bar's own full width better than the vertical
                  list that made sense in the narrower sidebar. */}
              <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1.5 text-sm">
                <span className="mr-1 text-ink-faint">{t.solve.examplesHeading} :</span>
                {QUICK_EXAMPLES.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => setEquation(example.latex)}
                    className="rounded-full border border-rule px-3 py-1 text-ink-soft transition duration-150 hover:border-rule-strong hover:bg-paper active:scale-95"
                  >
                    {t.solve.examples[example.id as keyof typeof t.solve.examples]}
                  </button>
                ))}
              </div>

              {/* Always visible, whatever the tier -- an authorized tier
                  switches straight into the exercise-check form; anyone
                  else sees a locked notice (never hidden) with a link to
                  /profile. This is the app's first tier-gated feature; the
                  actual access control is server-side (403 on
                  POST /api/exercise/check for a non prof/lab tier) -- this
                  is upsell, not the real protection. */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleExerciseCheckEntryClick}
                  className="inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-sm text-ink-soft transition duration-150 hover:border-rule-strong hover:bg-paper active:scale-95"
                >
                  <span aria-hidden>✓/✗</span>
                  <span>{t.solve.tabExerciseCheck}</span>
                  {!isProf && <span aria-hidden>🔒</span>}
                </button>
                {showExerciseCheckLocked && !isProf && (
                  <div className="mt-2 max-w-md rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <p className="font-semibold">{t.solve.exerciseCheckLockedTitle}</p>
                    <p className="mt-1">{t.solve.exerciseCheckLockedMessage}</p>
                    <Link
                      href="/profile"
                      className="mt-1 inline-block font-medium underline underline-offset-2"
                    >
                      {t.solve.exerciseCheckLockedCta}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          {status === "error" && (
            <p className="mt-4 text-sm font-medium text-mark-strong">
              {errorDetail ?? t.solve.error}
            </p>
          )}

          {(result || plotResult || exerciseCheckResult) && (
            <div
              ref={resultRef}
              className="mt-10 scroll-mt-6 rounded-2xl border border-rule bg-paper-raised p-6 shadow-md sm:p-8"
            >
              {exerciseCheckResult ? (
                <>
                  <div className="overflow-x-auto rounded-lg bg-paper px-4 py-3 text-center text-base text-ink-soft">
                    <MathRender latex={exerciseCheckResult.input_latex} />
                  </div>
                  <div className="mt-6 space-y-2">
                    {exerciseCheckResult.results.map((answer, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-rule px-4 py-3"
                      >
                        <span
                          className={`inline-flex flex-none items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                            answer.correct
                              ? "bg-check-soft text-check"
                              : "bg-mark-soft text-mark-strong"
                          }`}
                        >
                          {answer.correct
                            ? t.solve.exerciseCheckCorrect
                            : t.solve.exerciseCheckIncorrect}
                        </span>
                        <span className="font-mono text-sm text-ink">
                          {answer.raw_answer}
                        </span>
                        {answer.error && (
                          <span className="text-xs text-ink-faint">{answer.error}</span>
                        )}
                        {!answer.correct && !answer.error && (
                          <span className="flex items-center gap-2 text-sm text-ink-soft">
                            {t.solve.exerciseCheckRealSolutionLabel} :
                            <span className="overflow-x-auto">
                              <MathRender
                                latex={exerciseCheckResult.result_latex}
                                displayMode={false}
                              />
                            </span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : plotResult ? (
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
                        {/* A leading inline-block badge (not a flex row) --
                            a flex row with no wrap could push the badge
                            past the container's edge or squeeze a long
                            description against it instead of wrapping
                            normally (confirmed as a real rendering
                            complaint, not just theoretical). Plain inline
                            flow wraps like any other text, badge included. */}
                        <p className="text-[13px] font-medium text-ink-soft">
                          {step.is_key && (
                            <span className="mr-2 inline-block rounded-full bg-mark px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-paper-raised">
                              {t.solve.keyStepLabel}
                            </span>
                          )}
                          {step.description}
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
                                    <p className="text-[13px] font-medium text-ink-soft">
                                      {step.is_key && (
                                        <span className="mr-2 inline-block rounded-full bg-mark px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-paper-raised">
                                          {t.solve.keyStepLabel}
                                        </span>
                                      )}
                                      {step.description}
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
