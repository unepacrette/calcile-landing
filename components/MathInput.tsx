import { useEffect, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";

// Registers the <math-field> custom element -- this module must only ever
// be loaded client-side (see its call sites: always via next/dynamic with
// ssr: false), since mathlive touches `document`/`customElements` at
// import time and isn't SSR-safe (confirmed: the package ships a separate
// mathlive-ssr build specifically because the main one isn't).
import "mathlive";

// React 19 moved the ambient JSX namespace into the "react" module itself
// (no more bare global `JSX` namespace to augment) -- this is the current
// way to declare a custom element's intrinsic JSX type, confirmed
// directly: the older `declare global { namespace JSX { ... } }` pattern
// (still shown in MathLive's own React guide) fails to type-check here.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}

type MathInputProps = {
  id?: string;
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  // Rendered directly beside the field itself (e.g. the submit button) --
  // "le bouton calculer devrait etre a cote de la barre de calcul" -- kept
  // as a slot rather than hardcoding a button here, since submitting is
  // the parent form's concern (handleSubmit lives in solve.tsx), not
  // something this input component should know about.
  trailingAction?: React.ReactNode;
};

type QuickSymbol = { glyph: string; latex: string; label: string };

// The only sizes calcile-api's matrix endpoints actually accept
// (solver.sympy_engine._parse_matrix: "Only 2x2 or 3x3 matrices are
// supported") -- every other size raises a clean ParseError, so this
// picker only ever offers what a submit can really do with, square only
// (rows and cols always equal, never picked independently).
const MATRIX_SIZES = [2, 3] as const;

// Dot product and norm work for any dimension, but cross product is only
// defined in 3D (calcile-api's compute_vector_operation rejects anything
// else) -- 2 and 3 covers both cases the picker below actually offers.
const VECTOR_SIZES = [2, 3] as const;

// Builds a \begin{pmatrix}...\end{pmatrix} of size x size, each cell its
// own placeholder.
function buildMatrixLatex(rows: number, cols: number): string {
  const row = Array(cols).fill("#0").join("&");
  const body = Array(rows).fill(row).join("\\\\");
  return `\\begin{pmatrix}${body}\\end{pmatrix}`;
}

// Grouped, not tabbed: every group renders at once (nothing to pick
// between, no calculation category to choose -- this is purely a set of
// typing shortcuts for the one bar above). Deliberately broad: the bar
// itself already computes whatever LaTeX it's given, so as more
// calculation types get added server-side the input for them is already
// here -- no picker to extend later. "#0" is MathLive's own placeholder
// token (highlighted, tab-through-able).
// Every symbol here was checked directly against the backend it actually
// reaches (sympy.parsing.latex.parse_latex and/or calcile-api's own
// detectOperation-style routing) before being kept -- a first pass at
// this palette shipped several that silently mis-parsed as bare symbols
// (\nabla, \in, \cup, \mathbb{R}, \to, \approx, ...) instead of erroring,
// which is worse than an error: a wrong "answer" that looks like a real
// one. Some of what was cut in that pass was then genuinely fixed instead
// of left out (complex numbers -- "i" is now the real imaginary unit, not
// a bare symbol, and \Re/\Im/\arg now compute instead of staying
// symbolic; permutation now has a real P(n,k); the matrix picker's size
// options match what calcile-api actually accepts, 2x2/3x3 only, not an
// arbitrary 1-6; sets/vectors below are real, computed endpoints now too,
// including \emptyset/\mathbb{R,N,Z,Q,C} as real set operands -- see the
// "Ensembles" group). What's still missing has no backend concept to
// hook into at all -- propositional logic (\forall/\exists/\neg/\wedge/
// \vee) and multi-variable calculus (∇, double/triple integrals) --
// restoring those as buttons would ship the same silently-wrong behavior
// this audit was for.
const SYMBOL_GROUPS: { title: string; items: QuickSymbol[] }[] = [
  {
    title: "Puissances & racines",
    items: [
      { glyph: "xⁿ", latex: "^{#0}", label: "Puissance" },
      { glyph: "xₙ", latex: "_{#0}", label: "Indice" },
      { glyph: "√", latex: "\\sqrt{#0}", label: "Racine carrée" },
      { glyph: "ⁿ√", latex: "\\sqrt[#0]{#0}", label: "Racine n-ième" },
      { glyph: "a/b", latex: "\\frac{#0}{#0}", label: "Fraction" },
    ],
  },
  {
    title: "Fonctions",
    items: [
      { glyph: "sin", latex: "\\sin(#0)", label: "Sinus" },
      { glyph: "cos", latex: "\\cos(#0)", label: "Cosinus" },
      { glyph: "tan", latex: "\\tan(#0)", label: "Tangente" },
      { glyph: "cot", latex: "\\cot(#0)", label: "Cotangente" },
      { glyph: "sec", latex: "\\sec(#0)", label: "Sécante" },
      { glyph: "csc", latex: "\\csc(#0)", label: "Cosécante" },
      { glyph: "asin", latex: "\\arcsin(#0)", label: "Arc sinus" },
      { glyph: "acos", latex: "\\arccos(#0)", label: "Arc cosinus" },
      { glyph: "atan", latex: "\\arctan(#0)", label: "Arc tangente" },
      { glyph: "sinh", latex: "\\sinh(#0)", label: "Sinus hyperbolique" },
      { glyph: "cosh", latex: "\\cosh(#0)", label: "Cosinus hyperbolique" },
      { glyph: "tanh", latex: "\\tanh(#0)", label: "Tangente hyperbolique" },
      { glyph: "ln", latex: "\\ln(#0)", label: "Logarithme népérien" },
      { glyph: "log", latex: "\\log(#0)", label: "Logarithme décimal" },
      { glyph: "logᵦ", latex: "\\log_{#0}(#0)", label: "Logarithme en base b" },
      { glyph: "eˣ", latex: "e^{#0}", label: "Exponentielle" },
    ],
  },
  {
    title: "Analyse",
    items: [
      { glyph: "d/dx", latex: "\\frac{d}{dx}#0", label: "Dérivée" },
      { glyph: "d²/dx²", latex: "\\frac{d^2}{dx^2}#0", label: "Dérivée seconde" },
      { glyph: "∂/∂x", latex: "\\frac{\\partial}{\\partial x}#0", label: "Dérivée partielle" },
      { glyph: "∫", latex: "\\int #0\\,dx", label: "Intégrale" },
      { glyph: "∫ᵃᵇ", latex: "\\int_{#0}^{#0}#0\\,dx", label: "Intégrale définie" },
      { glyph: "Σ", latex: "\\sum_{n=#0}^{#0}#0", label: "Somme" },
      { glyph: "Π", latex: "\\prod_{n=#0}^{#0}#0", label: "Produit" },
      { glyph: "lim", latex: "\\lim_{x\\to#0}#0", label: "Limite" },
      // No real handwritten notation exists for "Taylor series" in any
      // tool (checked directly: Wolfram|Alpha, Mathematica, Maple,
      // SageMath, GeoGebra all use a command, never notation) -- this
      // adopts a known CAS function-call convention instead of inventing
      // one, a deliberate, disclosed exception to how every other button
      // here works.
      { glyph: "Tₙ", latex: "taylor(#0,#0,#0)", label: "Série de Taylor (expression, point, ordre)" },
      // y=f(x) is a real, standard convention for "graph this" (Desmos
      // and GeoGebra's own primary interaction model).
      { glyph: "y=f(x)", latex: "y=#0", label: "Tracer un graphique" },
    ],
  },
  {
    title: "Relations",
    items: [
      { glyph: "≤", latex: "\\le", label: "Inférieur ou égal" },
      { glyph: "≥", latex: "\\ge", label: "Supérieur ou égal" },
      { glyph: "≠", latex: "\\ne", label: "Différent" },
      { glyph: "±", latex: "\\pm", label: "Plus ou moins" },
    ],
  },
  {
    title: "Grec",
    items: [
      { glyph: "π", latex: "\\pi", label: "Pi" },
      { glyph: "θ", latex: "\\theta", label: "Thêta" },
      { glyph: "α", latex: "\\alpha", label: "Alpha" },
      { glyph: "β", latex: "\\beta", label: "Bêta" },
      { glyph: "γ", latex: "\\gamma", label: "Gamma" },
      { glyph: "δ", latex: "\\delta", label: "Delta" },
      { glyph: "ε", latex: "\\varepsilon", label: "Epsilon" },
      { glyph: "λ", latex: "\\lambda", label: "Lambda" },
      { glyph: "μ", latex: "\\mu", label: "Mu" },
      { glyph: "ρ", latex: "\\rho", label: "Rho" },
      { glyph: "σ", latex: "\\sigma", label: "Sigma" },
      { glyph: "τ", latex: "\\tau", label: "Tau" },
      { glyph: "φ", latex: "\\varphi", label: "Phi" },
      { glyph: "ψ", latex: "\\psi", label: "Psi" },
      { glyph: "ω", latex: "\\omega", label: "Oméga" },
    ],
  },
  {
    // The 2x2/3x3 matrix picker (determinant or inverse) is rendered
    // before these -- see the "Matrices" special case below; that's the
    // only size calcile-api's matrix endpoints actually accept.
    title: "Matrices",
    items: [],
  },
  {
    // The vector picker (dot/cross product, norm) is rendered before
    // these -- see the "Vecteurs" special case below. calcile-api now
    // has a real /api/vectors endpoint (a vector is a column matrix,
    // same object the matrix endpoints already use); \vec{} itself is
    // still not used as notation here since it names an abstract vector
    // rather than giving its components, which is what actually gets
    // computed on.
    title: "Vecteurs",
    items: [],
  },
  {
    // \forall/\exists/\neg/\wedge/\vee still aren't here: propositional
    // logic has no well-defined "compute" action for an arbitrary
    // symbolic predicate (this would be a proof assistant, not a
    // calculator). The blackboard-bold number sets (ℝ, ℕ, ℤ, ℚ, ℂ) USED
    // to be excluded on the same "domain label, not something to operate
    // on by itself" reasoning -- that's no longer accurate: calcile-api's
    // /api/sets and /api/sets/expression now genuinely accept \emptyset
    // and \mathbb{R/N/Z/Q/C} as real operands (the actual empty set / the
    // actual ℝ, ℕ, ℤ, ℚ, ℂ, not a symbolic placeholder), so both are real,
    // computed set literals here too -- e.g. \mathbb{Z}\cap[0,10].
    title: "Ensembles",
    items: [
      // The concrete, braced "\cup"/"\cap" skeleton buttons (union,
      // intersection) were removed -- a real user reported them as
      // "doesn't work" repeatedly: filling their placeholders with
      // letters (A, B, ...) rather than numbers computes a literal,
      // unhelpful one-element-per-letter set instead of the abstract
      // simplification the A∪B/A∩B buttons below actually give, and
      // that's overwhelmingly what people reach for when they see ∪/∩.
      // ∖/∆ (difference/symmetric difference) are kept here since they
      // have no symbolic-mode equivalent in the palette yet to collide
      // with in the same way.
      { glyph: "∖", latex: "\\{#0\\}\\setminus\\{#0\\}", label: "Différence" },
      { glyph: "∆", latex: "\\{#0\\}\\triangle\\{#0\\}", label: "Différence symétrique" },
      // The braces above always mean "literal set with explicit elements"
      // -- {1,2,3}, not A/B/C. calcile-api's /api/sets/simplify (bare,
      // unbraced capital letters instead) is the real notation for
      // simplifying an expression over abstract/named sets in general --
      // these four skeletons insert that grammar's own operators directly
      // around bare placeholders instead.
      { glyph: "A∪B", latex: "#0\\cup#0", label: "Union symbolique (ensembles abstraits A, B, C…)" },
      { glyph: "A∩B", latex: "#0\\cap#0", label: "Intersection symbolique (ensembles abstraits)" },
      { glyph: "A∖B", latex: "#0\\setminus#0", label: "Différence symbolique (ensembles abstraits)" },
      { glyph: "A∆B", latex: "#0\\triangle#0", label: "Différence symétrique symbolique (ensembles abstraits)" },
      { glyph: "∈", latex: "#0\\in\\{#0\\}", label: "Appartenance" },
      { glyph: "⊆", latex: "\\{#0\\}\\subseteq\\{#0\\}", label: "Inclusion" },
      { glyph: "𝒫", latex: "\\mathcal{P}(\\{#0\\})", label: "Ensemble des parties" },
      { glyph: "×", latex: "\\{#0\\}\\times\\{#0\\}", label: "Produit cartésien" },
      { glyph: "[a,b]", latex: "[#0,#0]", label: "Intervalle fermé" },
      { glyph: "]a,b[", latex: "]#0,#0[", label: "Intervalle ouvert" },
      { glyph: "∅", latex: "\\emptyset", label: "Ensemble vide" },
      { glyph: "ℝ", latex: "\\mathbb{R}", label: "Ensemble des réels" },
      { glyph: "ℕ", latex: "\\mathbb{N}", label: "Ensemble des entiers naturels" },
      { glyph: "ℤ", latex: "\\mathbb{Z}", label: "Ensemble des entiers relatifs" },
      { glyph: "ℚ", latex: "\\mathbb{Q}", label: "Ensemble des rationnels" },
      { glyph: "ℂ", latex: "\\mathbb{C}", label: "Ensemble des complexes" },
    ],
  },
  {
    title: "Combinatoire & complexes",
    items: [
      { glyph: "n!", latex: "#0!", label: "Factorielle" },
      { glyph: "Cₙₖ", latex: "\\binom{#0}{#0}", label: "Coefficient binomial" },
      { glyph: "Pₙₖ", latex: "P(#0,#0)", label: "Permutation" },
      { glyph: "pgcd", latex: "gcd(#0,#0)", label: "PGCD (plus grand commun diviseur)" },
      { glyph: "ppcm", latex: "lcm(#0,#0)", label: "PPCM (plus petit commun multiple)" },
      { glyph: "mod", latex: "\\bmod", label: "Modulo (reste de la division euclidienne)" },
      { glyph: "i", latex: "i", label: "Unité imaginaire" },
      { glyph: "z̄", latex: "\\overline{#0}", label: "Conjugué" },
      { glyph: "Re", latex: "\\Re(#0)", label: "Partie réelle" },
      { glyph: "Im", latex: "\\Im(#0)", label: "Partie imaginaire" },
      { glyph: "arg", latex: "\\arg(#0)", label: "Argument (complexe)" },
    ],
  },
  {
    title: "Divers",
    items: [
      { glyph: "∞", latex: "\\infty", label: "Infini" },
      { glyph: "%", latex: "\\cdot\\dfrac{1}{100}", label: "Pourcent" },
      { glyph: "°", latex: "\\cdot\\dfrac{\\pi}{180}", label: "Degré (converti en radians)" },
      { glyph: "⌊x⌋", latex: "\\lfloor#0\\rfloor", label: "Partie entière (plancher)" },
      { glyph: "⌈x⌉", latex: "\\lceil#0\\rceil", label: "Partie entière (plafond)" },
    ],
  },
];

export default function MathInput({ id, value, onChange, placeholder, trailingAction }: MathInputProps) {
  const ref = useRef<MathfieldElement>(null);
  const [focused, setFocused] = useState(false);
  const [matrixPickerOpen, setMatrixPickerOpen] = useState(false);
  const [matrixSize, setMatrixSize] = useState<(typeof MATRIX_SIZES)[number]>(2);
  const [vectorPickerOpen, setVectorPickerOpen] = useState(false);
  const [vectorSize, setVectorSize] = useState<(typeof VECTOR_SIZES)[number]>(2);
  // Collapsed by default -- 12 groups shown open at once (the previous
  // behavior) is exactly the "gagner de la place" complaint; opening one
  // to find a symbol costs one click, closed-by-default is the right
  // trade for a reference panel this dense. Each group toggles
  // independently, same interaction as FormulaSheet's own categories.
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  function toggleGroup(title: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  // One-time setup. mathVirtualKeyboardPolicy "manual" means MathLive's
  // own full virtual keyboard panel never shows itself automatically --
  // removed per explicit feedback ("enlève le clavier, c'est moche") in
  // favor of the SYMBOL_GROUPS row below instead. Auto-sized fences
  // (parentheses grow with their content) and the app's own accent color
  // for the caret/selection round out the setup -- set imperatively
  // rather than as JSX attributes, since MathfieldElement's own
  // properties aren't part of React's built-in HTMLAttributes typing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.mathVirtualKeyboardPolicy = "manual";
    el.smartFence = true;
    el.smartSuperscript = true;
    // No built-in context menu button -- this is a plain equation field,
    // not a full editor; the "≡ Menu" chrome it shows by default wasn't
    // asked for and isn't useful here.
    el.menuItems = [];
    if (placeholder) el.placeholder = placeholder;
  }, [placeholder]);

  // Keep the field in sync with the controlled `value` prop -- only
  // pushed when it actually differs from the field's own current content
  // (e.g. clearing `equation` on tab switch), never on every keystroke,
  // so typing never fights the field's own cursor/selection state.
  useEffect(() => {
    const el = ref.current;
    if (el && el.getValue("latex") !== value) {
      el.setValue(value);
    }
  }, [value]);

  return (
    <div>
      <div className="flex flex-col items-stretch gap-2.5 sm:flex-row">
        <math-field
          ref={ref}
          id={id}
          onInput={(event) => {
            const target = event.target as MathfieldElement;
            onChange(target.getValue("latex"));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            // Enter runs the calculation instead of only inserting a
            // newline/doing nothing -- "lorsque j'appuie sur la touche
            // entree, ca lance la reflexion... plutot que de descendre
            // en bas de page sur le bouton calculer". Shift+Enter is
            // left alone (MathLive's own multi-line affordance, not
            // relevant for a single equation but not worth stealing
            // from it); requestSubmit() reuses the real form submit
            // handler (handleSubmit in solve.tsx) instead of duplicating
            // its logic here.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              (event.target as MathfieldElement).closest("form")?.requestSubmit();
            }
          }}
          style={{
            display: "block",
            width: "100%",
            borderRadius: "0.75rem",
            border: focused ? "2px solid var(--color-mark)" : "2px solid var(--color-rule-strong)",
            background: "var(--color-paper-raised)",
            // A single central bar (WolframAlpha-style) reads as *the*
            // control on the page only if it's unmistakably legible --
            // explicit high-contrast ink color (not left to inheritance),
            // instead of the small, easy-to-miss field this replaced ("on
            // ne voit pas bien ce qui est écrit"). Size dialed back from
            // an earlier, much larger pass ("le bouton calcule... et donc
            // la barre de calcul est trop grosse") -- MathLive auto-sizes
            // nested content (fractions, exponents) off this same
            // font-size, so a smaller base keeps a genuinely complex
            // formula from ballooning the bar's height, not just the
            // simple-input case.
            color: "var(--color-ink)",
            padding: "0.7rem 1.05rem",
            fontSize: "1.15rem",
            minHeight: "2.75rem",
            boxShadow: focused
              ? "0 2px 12px 0 rgb(0 0 0 / 0.10)"
              : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            transition: "border-color 120ms ease, box-shadow 120ms ease",
            // MathLive's own documented theming hooks -- matches the app's
            // ink/mark tokens instead of MathLive's default blue caret.
            ["--caret-color" as string]: "var(--color-mark)",
            ["--primary" as string]: "var(--color-mark)",
            ["--placeholder-color" as string]: "var(--color-ink-faint)",
          }}
        />
        {trailingAction}
      </div>
      {/* Label ABOVE its row, not beside it -- the previous side-by-side
          layout (a fixed-width label column next to a wrapping button row)
          could never look aligned: a long label ("PUISSANCES & RACINES")
          and a short one ("GREC") reserved the same column width, so short
          labels either left a dead gap (left-aligned) or shifted the
          leftover space around (right-aligned, tried first) -- and a
          group with enough buttons to wrap (FONCTIONS, ENSEMBLES) wrapped
          its second row UNDER the label column too, breaking the very
          alignment the fixed width was meant to guarantee. Stacking
          removes the column entirely: every group's toolbar starts at the
          container's own left edge and wraps freely, so there's nothing
          left to misalign, confirmed directly (a real rendered gap/
          alignment complaint, twice) rather than assumed fixed by a
          narrower patch. A bordered card + hairline dividers between
          groups (divide-y) read as one coherent reference panel instead
          of a loose stack of rows floating on the page background. */}
      <div className="mt-5 rounded-xl border border-rule bg-paper-raised/70 p-4">
        <div className="flex flex-col divide-y divide-rule">
          {SYMBOL_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.title);
            return (
            <div key={group.title} className="py-1.5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left transition-colors duration-150 hover:bg-paper active:scale-[0.99]"
              >
                <span className="font-mono text-[0.7rem] font-bold uppercase tracking-widest text-ink-faint">
                  {group.title}
                </span>
                <span
                  aria-hidden="true"
                  className={`text-ink-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </button>
              {isOpen && (
              <div role="toolbar" aria-label={group.title} className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {group.title === "Matrices" && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    title="Matrice (taille au choix)"
                    aria-label="Matrice (taille au choix)"
                    aria-expanded={matrixPickerOpen}
                    onClick={() => setMatrixPickerOpen((open) => !open)}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                  >
                    <span aria-hidden="true">⊞</span> Matrice
                  </button>
                  {matrixPickerOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.375rem)",
                        left: 0,
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--color-rule-strong)",
                        background: "var(--color-paper-raised)",
                        padding: "0.625rem 0.75rem",
                        boxShadow: "0 4px 16px 0 rgb(0 0 0 / 0.12)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {/* Only square 2x2/3x3 with numeric cells are
                          actually computable (calcile-api's _parse_matrix
                          rejects anything else -- confirmed directly: a
                          size outside {2,3}, a non-square shape, or a
                          symbolic cell all raise a clean ParseError, none
                          are silently accepted). A free 1-6 rows x cols
                          picker offered sizes the backend would reject on
                          submit -- this reflects what's really supported,
                          not what would be nice. */}
                      {MATRIX_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setMatrixSize(size)}
                          aria-pressed={matrixSize === size}
                          className={`rounded-md px-2.5 py-1.5 text-sm font-semibold transition duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark ${
                            matrixSize === size
                              ? "bg-mark text-paper-raised"
                              : "border border-rule-strong text-ink-soft hover:bg-rule"
                          }`}
                        >
                          {size}×{size}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          ref.current?.focus();
                          ref.current?.insert(buildMatrixLatex(matrixSize, matrixSize), {
                            insertionMode: "insertAfter",
                          });
                          setMatrixPickerOpen(false);
                        }}
                        className="rounded-md bg-mark px-3 py-1.5 text-sm font-semibold text-paper-raised transition duration-150 hover:bg-mark-strong active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                      >
                        Insérer
                      </button>
                      <button
                        type="button"
                        title="Insère la matrice suivie de ^{-1} -- calcule son inverse au lieu de son déterminant"
                        onClick={() => {
                          ref.current?.focus();
                          ref.current?.insert(`${buildMatrixLatex(matrixSize, matrixSize)}^{-1}`, {
                            insertionMode: "insertAfter",
                          });
                          setMatrixPickerOpen(false);
                        }}
                        className="rounded-md border border-rule-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                      >
                        Insérer l&rsquo;inverse
                      </button>
                      <button
                        type="button"
                        title="Insère la matrice suivie de ^{T} -- calcule sa transposée"
                        onClick={() => {
                          ref.current?.focus();
                          ref.current?.insert(`${buildMatrixLatex(matrixSize, matrixSize)}^{T}`, {
                            insertionMode: "insertAfter",
                          });
                          setMatrixPickerOpen(false);
                        }}
                        className="rounded-md border border-rule-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                      >
                        Insérer la transposée
                      </button>
                      <button
                        type="button"
                        title="Insère l'équation caractéristique det(A - λI) = 0 -- calcule les valeurs propres"
                        onClick={() => {
                          ref.current?.focus();
                          ref.current?.insert(
                            `\\det(${buildMatrixLatex(matrixSize, matrixSize)}-\\lambda I)=0`,
                            { insertionMode: "insertAfter" }
                          );
                          setMatrixPickerOpen(false);
                        }}
                        className="rounded-md border border-rule-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                      >
                        Valeurs propres
                      </button>
                    </div>
                  )}
                </div>
              )}
              {group.title === "Vecteurs" && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    title="Vecteur (taille au choix)"
                    aria-label="Vecteur (taille au choix)"
                    aria-expanded={vectorPickerOpen}
                    onClick={() => setVectorPickerOpen((open) => !open)}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                  >
                    <span aria-hidden="true">v⃗</span> Vecteur
                  </button>
                  {vectorPickerOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.375rem)",
                        left: 0,
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--color-rule-strong)",
                        background: "var(--color-paper-raised)",
                        padding: "0.625rem 0.75rem",
                        boxShadow: "0 4px 16px 0 rgb(0 0 0 / 0.12)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {VECTOR_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setVectorSize(size)}
                          aria-pressed={vectorSize === size}
                          className={`rounded-md px-2.5 py-1.5 text-sm font-semibold transition duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark ${
                            vectorSize === size
                              ? "bg-mark text-paper-raised"
                              : "border border-rule-strong text-ink-soft hover:bg-rule"
                          }`}
                        >
                          {size}D
                        </button>
                      ))}
                      <button
                        type="button"
                        title="Insère deux vecteurs reliés par un produit scalaire"
                        onClick={() => {
                          ref.current?.focus();
                          const v = buildMatrixLatex(vectorSize, 1);
                          ref.current?.insert(`${v}\\cdot${v}`, { insertionMode: "insertAfter" });
                          setVectorPickerOpen(false);
                        }}
                        className="rounded-md bg-mark px-3 py-1.5 text-sm font-semibold text-paper-raised transition duration-150 hover:bg-mark-strong active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                      >
                        u·v
                      </button>
                      {/* Cross product is only defined in 3D (the
                          standard mathematical definition, no 2D or n-D
                          generalization to fall back to) -- hidden
                          rather than shown-then-rejected at 2D. */}
                      {vectorSize === 3 && (
                        <button
                          type="button"
                          title="Insère deux vecteurs reliés par un produit vectoriel"
                          onClick={() => {
                            ref.current?.focus();
                            const v = buildMatrixLatex(vectorSize, 1);
                            ref.current?.insert(`${v}\\times${v}`, { insertionMode: "insertAfter" });
                            setVectorPickerOpen(false);
                          }}
                          className="rounded-md border border-rule-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                        >
                          u×v
                        </button>
                      )}
                      <button
                        type="button"
                        title="Insère un vecteur entouré des barres de norme"
                        onClick={() => {
                          ref.current?.focus();
                          const v = buildMatrixLatex(vectorSize, 1);
                          ref.current?.insert(`\\left\\|${v}\\right\\|`, { insertionMode: "insertAfter" });
                          setVectorPickerOpen(false);
                        }}
                        className="rounded-md border border-rule-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                      >
                        ‖u‖
                      </button>
                    </div>
                  )}
                </div>
              )}
              {group.items.map((symbol) => (
                <button
                  key={symbol.glyph}
                  type="button"
                  title={symbol.label}
                  aria-label={symbol.label}
                  onClick={() => {
                    ref.current?.focus();
                    ref.current?.insert(symbol.latex, { insertionMode: "insertAfter" });
                  }}
                  // Same press/hover feedback convention as every other
                  // button in the app (apple-design: feedback belongs on
                  // press, not only on release) -- this row had none.
                  className="flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg text-lg text-ink-soft transition duration-150 hover:bg-rule active:scale-95 focus:outline-none focus:ring-2 focus:ring-mark"
                >
                  {symbol.glyph}
                </button>
              ))}
              </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
