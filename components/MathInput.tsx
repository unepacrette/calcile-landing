import { useEffect, useRef } from "react";
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

// Live, WYSIWYG math input (WolframAlpha/Symbolab-style: real fractions,
// exponents, and roots forming as you type) instead of a plain-text field
// showing raw "x^2 + 3x + 2 = 0". Backed by MathLive's <math-field>
// (MIT-licensed, the standard tool for this -- there's no reasonable way
// to build this from scratch, unlike most of this codebase's "no new
// dependency without necessity" additions).
//
// Emits LaTeX on every input, which calcile-api's parser already
// auto-detects and routes through sympy.parsing.latex.parse_latex
// (_looks_like_latex, verified in that repo) -- no backend change needed,
// and a value like a bare "x" or "2" that contains no LaTeX-special
// character still round-trips through the plain-text grammar exactly as
// before.
// A small set of insertable templates for the quick-symbol row above the
// field -- "#0" is MathLive's own placeholder token (highlighted,
// tab-through-able) so e.g. the √ button doesn't just type a bare "\sqrt"
// with nothing to fill in. Deliberately not MathLive's own full virtual
// keyboard panel (removed: "enlève le clavier, c'est moche") -- a thin,
// app-styled row instead, in the same spirit as WolframAlpha's own
// symbol strip but small.
const QUICK_SYMBOLS: { glyph: string; latex: string; label: string }[] = [
  { glyph: "√", latex: "\\sqrt{#0}", label: "Racine carrée" },
  { glyph: "∫", latex: "\\int #0\\,dx", label: "Intégrale" },
  { glyph: "Σ", latex: "\\sum_{n=1}^{10}#0", label: "Somme" },
  { glyph: "Π", latex: "\\prod_{n=1}^{10}#0", label: "Produit" },
  { glyph: "lim", latex: "\\lim_{x\\to0}#0", label: "Limite" },
  { glyph: "d/dx", latex: "\\frac{d}{dx}#0", label: "Dérivée" },
  { glyph: "π", latex: "\\pi", label: "Pi" },
  { glyph: "≤", latex: "\\le", label: "Inférieur ou égal" },
  { glyph: "≥", latex: "\\ge", label: "Supérieur ou égal" },
  { glyph: "∞", latex: "\\infty", label: "Infini" },
];

export default function MathInput({ id, value, onChange, placeholder }: MathInputProps) {
  const ref = useRef<MathfieldElement>(null);

  // One-time setup. mathVirtualKeyboardPolicy "manual" means MathLive's
  // own full virtual keyboard panel never shows itself automatically --
  // removed per explicit feedback ("enlève le clavier, c'est moche") in
  // favor of the small QUICK_SYMBOLS row below instead. Auto-sized
  // fences (parentheses grow with their content) and the app's own
  // accent color for the caret/selection round out the setup -- set
  // imperatively rather than as JSX attributes, since MathfieldElement's
  // own properties aren't part of React's built-in HTMLAttributes typing.
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
      <div
        role="toolbar"
        aria-label="Symboles LaTeX"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25rem",
          marginBottom: "0.375rem",
        }}
      >
        {QUICK_SYMBOLS.map((symbol) => (
          <button
            key={symbol.glyph}
            type="button"
            title={symbol.label}
            aria-label={symbol.label}
            onClick={() => {
              ref.current?.focus();
              ref.current?.insert(symbol.latex, { insertionMode: "insertAfter" });
            }}
            style={{
              height: "1.75rem",
              minWidth: "1.75rem",
              padding: "0 0.4rem",
              borderRadius: "0.375rem",
              border: "none",
              background: "var(--color-paper)",
              color: "var(--color-ink-soft)",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {symbol.glyph}
          </button>
        ))}
      </div>
      <math-field
        ref={ref}
        id={id}
        onInput={(event) => {
          const target = event.target as MathfieldElement;
          onChange(target.getValue("latex"));
        }}
        style={{
          display: "block",
          width: "100%",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-rule-strong)",
          background: "var(--color-paper-raised)",
          padding: "0.75rem 1rem",
          fontSize: "1.05rem",
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          // MathLive's own documented theming hooks -- matches the app's
          // ink/mark tokens instead of MathLive's default blue caret.
          ["--caret-color" as string]: "var(--color-mark)",
          ["--primary" as string]: "var(--color-mark)",
          ["--placeholder-color" as string]: "var(--color-ink-faint)",
        }}
      />
    </div>
  );
}
