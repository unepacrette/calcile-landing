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
export default function MathInput({ id, value, onChange, placeholder }: MathInputProps) {
  const ref = useRef<MathfieldElement>(null);

  // One-time setup: the virtual keyboard (every symbol layer MathLive
  // ships -- numeric, symbols, Greek, functions -- is there by default,
  // nothing restricted) shown permanently rather than only on focus/touch,
  // per explicit request: "que le clavier soit visible par défaut" /
  // "tous les symboles de LaTeX, absolument tous". "manual" policy means
  // *we* control visibility instead of MathLive auto-hiding it on blur.
  // Auto-sized fences (parentheses grow with their content) and the app's
  // own accent color for the caret/selection round out the setup -- set
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

  // Shown once on mount, hidden on unmount -- the keyboard is a single
  // global panel (window.mathVirtualKeyboard, appended to document.body),
  // not scoped to this one field, so this must run once, not on every
  // placeholder change, or leave it open when navigating away from /solve.
  useEffect(() => {
    window.mathVirtualKeyboard?.show({ animate: false });
    return () => window.mathVirtualKeyboard?.hide({ animate: false });
  }, []);

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
  );
}
