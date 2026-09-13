// A static reference sheet ("fiches de formule résumé ... à côté de ces
// calculs") -- unlike everything else on /solve, this is never sent
// anywhere; it's just standard textbook formulas for the categories a
// student is most likely to want next to the calculator. LaTeX is
// language-neutral (math notation doesn't change between fr/en), so only
// the id -> label lookup lives in lib/i18n.tsx (t.formulaSheet.categories
// / t.formulaSheet.formulas) -- every id here must have a matching key in
// both translations.fr.formulaSheet and translations.en.formulaSheet.

export type FormulaCategoryId =
  | "trigonometry"
  | "taylorSeries"
  | "derivatives"
  | "antiderivatives"
  | "algebraic";

export type FormulaId =
  | "trigPythagorean"
  | "trigTangent"
  | "trigDoubleSin"
  | "trigDoubleCos"
  | "trigSumSin"
  | "trigSumCos"
  | "trigOnePlusTan2"
  | "taylorExp"
  | "taylorSin"
  | "taylorCos"
  | "taylorLn"
  | "taylorGeometric"
  | "taylorBinomial"
  | "derivPower"
  | "derivSin"
  | "derivCos"
  | "derivTan"
  | "derivExp"
  | "derivLn"
  | "derivSqrt"
  | "derivProduct"
  | "derivQuotient"
  | "intPower"
  | "intInverse"
  | "intExp"
  | "intCos"
  | "intSin"
  | "intArctan"
  | "intArcsin"
  | "algSquareSum"
  | "algSquareDiff"
  | "algDiffSquares"
  | "algCubeSum"
  | "algDiffCubes"
  | "algSumCubes";

export const FORMULA_CATEGORIES: {
  id: FormulaCategoryId;
  formulas: { id: FormulaId; latex: string }[];
}[] = [
  {
    id: "trigonometry",
    formulas: [
      { id: "trigPythagorean", latex: "\\sin^2(x) + \\cos^2(x) = 1" },
      { id: "trigTangent", latex: "\\tan(x) = \\dfrac{\\sin(x)}{\\cos(x)}" },
      { id: "trigOnePlusTan2", latex: "1 + \\tan^2(x) = \\dfrac{1}{\\cos^2(x)}" },
      { id: "trigDoubleSin", latex: "\\sin(2x) = 2\\sin(x)\\cos(x)" },
      { id: "trigDoubleCos", latex: "\\cos(2x) = \\cos^2(x) - \\sin^2(x)" },
      { id: "trigSumSin", latex: "\\sin(a+b) = \\sin(a)\\cos(b) + \\cos(a)\\sin(b)" },
      { id: "trigSumCos", latex: "\\cos(a+b) = \\cos(a)\\cos(b) - \\sin(a)\\sin(b)" },
    ],
  },
  {
    id: "taylorSeries",
    formulas: [
      {
        id: "taylorExp",
        latex: "e^x = 1 + x + \\dfrac{x^2}{2!} + \\dfrac{x^3}{3!} + \\cdots + o(x^n)",
      },
      {
        id: "taylorSin",
        latex: "\\sin(x) = x - \\dfrac{x^3}{3!} + \\dfrac{x^5}{5!} - \\cdots + o(x^{2n+1})",
      },
      {
        id: "taylorCos",
        latex: "\\cos(x) = 1 - \\dfrac{x^2}{2!} + \\dfrac{x^4}{4!} - \\cdots + o(x^{2n})",
      },
      {
        id: "taylorLn",
        latex: "\\ln(1+x) = x - \\dfrac{x^2}{2} + \\dfrac{x^3}{3} - \\cdots + o(x^n)",
      },
      {
        id: "taylorGeometric",
        latex: "\\dfrac{1}{1-x} = 1 + x + x^2 + x^3 + \\cdots + o(x^n)",
      },
      {
        id: "taylorBinomial",
        latex:
          "(1+x)^{\\alpha} = 1 + \\alpha x + \\dfrac{\\alpha(\\alpha-1)}{2!}x^2 + o(x^2)",
      },
    ],
  },
  {
    id: "derivatives",
    formulas: [
      { id: "derivPower", latex: "(x^n)' = nx^{n-1}" },
      { id: "derivSin", latex: "(\\sin x)' = \\cos x" },
      { id: "derivCos", latex: "(\\cos x)' = -\\sin x" },
      { id: "derivTan", latex: "(\\tan x)' = 1 + \\tan^2 x = \\dfrac{1}{\\cos^2 x}" },
      { id: "derivExp", latex: "(e^x)' = e^x" },
      { id: "derivLn", latex: "(\\ln x)' = \\dfrac{1}{x}" },
      { id: "derivSqrt", latex: "(\\sqrt{x})' = \\dfrac{1}{2\\sqrt{x}}" },
      { id: "derivProduct", latex: "(uv)' = u'v + uv'" },
      { id: "derivQuotient", latex: "\\left(\\dfrac{u}{v}\\right)' = \\dfrac{u'v - uv'}{v^2}" },
    ],
  },
  {
    id: "antiderivatives",
    formulas: [
      {
        id: "intPower",
        latex: "\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)",
      },
      { id: "intInverse", latex: "\\int \\dfrac{1}{x}\\,dx = \\ln|x| + C" },
      { id: "intExp", latex: "\\int e^x\\,dx = e^x + C" },
      { id: "intCos", latex: "\\int \\cos(x)\\,dx = \\sin(x) + C" },
      { id: "intSin", latex: "\\int \\sin(x)\\,dx = -\\cos(x) + C" },
      { id: "intArctan", latex: "\\int \\dfrac{1}{1+x^2}\\,dx = \\arctan(x) + C" },
      {
        id: "intArcsin",
        latex: "\\int \\dfrac{1}{\\sqrt{1-x^2}}\\,dx = \\arcsin(x) + C",
      },
    ],
  },
  {
    id: "algebraic",
    formulas: [
      { id: "algSquareSum", latex: "(a+b)^2 = a^2 + 2ab + b^2" },
      { id: "algSquareDiff", latex: "(a-b)^2 = a^2 - 2ab + b^2" },
      { id: "algDiffSquares", latex: "a^2 - b^2 = (a-b)(a+b)" },
      { id: "algCubeSum", latex: "(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3" },
      { id: "algDiffCubes", latex: "a^3 - b^3 = (a-b)(a^2+ab+b^2)" },
      { id: "algSumCubes", latex: "a^3 + b^3 = (a+b)(a^2-ab+b^2)" },
    ],
  },
];
