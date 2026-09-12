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
};

type QuickSymbol = { glyph: string; latex: string; label: string };

// Grouped, not tabbed: every group renders at once (nothing to pick
// between, no calculation category to choose -- this is purely a set of
// typing shortcuts for the one bar above). Deliberately broad: the bar
// itself already computes whatever LaTeX it's given, so as more
// calculation types get added server-side the input for them is already
// here -- no picker to extend later. "#0" is MathLive's own placeholder
// token (highlighted, tab-through-able).
const SYMBOL_GROUPS: { title: string; items: QuickSymbol[] }[] = [
  {
    title: "Puissances & racines",
    items: [
      { glyph: "xⁿ", latex: "^{#0}", label: "Puissance" },
      { glyph: "xₙ", latex: "_{#0}", label: "Indice" },
      { glyph: "√", latex: "\\sqrt{#0}", label: "Racine carrée" },
      { glyph: "ⁿ√", latex: "\\sqrt[#0]{#0}", label: "Racine n-ième" },
      { glyph: "a/b", latex: "\\frac{#0}{#0}", label: "Fraction" },
      { glyph: "|x|", latex: "\\left|#0\\right|", label: "Valeur absolue" },
    ],
  },
  {
    title: "Analyse",
    items: [
      { glyph: "d/dx", latex: "\\frac{d}{dx}#0", label: "Dérivée" },
      { glyph: "∂/∂x", latex: "\\frac{\\partial}{\\partial x}#0", label: "Dérivée partielle" },
      { glyph: "∫", latex: "\\int #0\\,dx", label: "Intégrale" },
      { glyph: "∫ᵃᵇ", latex: "\\int_{#0}^{#0}#0\\,dx", label: "Intégrale définie" },
      { glyph: "Σ", latex: "\\sum_{n=#0}^{#0}#0", label: "Somme" },
      { glyph: "Π", latex: "\\prod_{n=#0}^{#0}#0", label: "Produit" },
      { glyph: "lim", latex: "\\lim_{x\\to#0}#0", label: "Limite" },
      { glyph: "∇", latex: "\\nabla#0", label: "Gradient" },
    ],
  },
  {
    title: "Relations",
    items: [
      { glyph: "≠", latex: "\\neq", label: "Différent" },
      { glyph: "≤", latex: "\\le", label: "Inférieur ou égal" },
      { glyph: "≥", latex: "\\ge", label: "Supérieur ou égal" },
      { glyph: "≈", latex: "\\approx", label: "Environ égal" },
      { glyph: "±", latex: "\\pm", label: "Plus ou moins" },
      { glyph: "→", latex: "\\to", label: "Tend vers" },
      { glyph: "⇒", latex: "\\Rightarrow", label: "Implique" },
      { glyph: "⇔", latex: "\\Leftrightarrow", label: "Équivaut à" },
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
      { glyph: "λ", latex: "\\lambda", label: "Lambda" },
      { glyph: "μ", latex: "\\mu", label: "Mu" },
      { glyph: "σ", latex: "\\sigma", label: "Sigma" },
      { glyph: "φ", latex: "\\varphi", label: "Phi" },
      { glyph: "ω", latex: "\\omega", label: "Oméga" },
    ],
  },
  {
    title: "Ensembles & logique",
    items: [
      { glyph: "∈", latex: "\\in", label: "Appartient à" },
      { glyph: "∉", latex: "\\notin", label: "N'appartient pas à" },
      { glyph: "⊂", latex: "\\subset", label: "Inclus dans" },
      { glyph: "⊆", latex: "\\subseteq", label: "Inclus ou égal" },
      { glyph: "∪", latex: "\\cup", label: "Union" },
      { glyph: "∩", latex: "\\cap", label: "Intersection" },
      { glyph: "∅", latex: "\\emptyset", label: "Ensemble vide" },
      { glyph: "∀", latex: "\\forall", label: "Pour tout" },
      { glyph: "∃", latex: "\\exists", label: "Il existe" },
      { glyph: "¬", latex: "\\neg", label: "Non" },
      { glyph: "∧", latex: "\\wedge", label: "Et" },
      { glyph: "∨", latex: "\\vee", label: "Ou" },
    ],
  },
  {
    title: "Matrices, vecteurs & divers",
    items: [
      { glyph: "[::]", latex: "\\begin{pmatrix}#0&#0\\\\#0&#0\\end{pmatrix}", label: "Matrice 2×2" },
      { glyph: "v⃗", latex: "\\vec{#0}", label: "Vecteur" },
      { glyph: "det", latex: "\\det\\left(#0\\right)", label: "Déterminant" },
      { glyph: "∞", latex: "\\infty", label: "Infini" },
      { glyph: "°", latex: "^{\\circ}", label: "Degré" },
      { glyph: "%", latex: "\\%", label: "Pourcent" },
    ],
  },
];

export default function MathInput({ id, value, onChange, placeholder }: MathInputProps) {
  const ref = useRef<MathfieldElement>(null);
  const [focused, setFocused] = useState(false);

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
      <math-field
        ref={ref}
        id={id}
        onInput={(event) => {
          const target = event.target as MathfieldElement;
          onChange(target.getValue("latex"));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: "block",
          width: "100%",
          borderRadius: "0.75rem",
          border: focused ? "2px solid var(--color-mark)" : "2px solid var(--color-rule-strong)",
          background: "var(--color-paper-raised)",
          // A single central bar (WolframAlpha-style) reads as *the*
          // control on the page only if it's unmistakably legible --
          // explicit high-contrast ink color (not left to inheritance)
          // plus generous size, instead of the small, easy-to-miss field
          // this replaced ("on ne voit pas bien ce qui est écrit").
          color: "var(--color-ink)",
          padding: "1.1rem 1.35rem",
          fontSize: "1.5rem",
          minHeight: "3.5rem",
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
      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {SYMBOL_GROUPS.map((group) => (
          <div key={group.title} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.625rem" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-ink-faint)",
                minWidth: "12.5rem",
                whiteSpace: "nowrap",
              }}
            >
              {group.title}
            </span>
            <div role="toolbar" aria-label={group.title} style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
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
          </div>
        ))}
      </div>
    </div>
  );
}
