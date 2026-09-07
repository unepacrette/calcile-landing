import { useMemo } from "react";
import katex from "katex";

/** Renders a LaTeX string via KaTeX. Falls back to showing the raw LaTeX
 * source (instead of crashing) if it fails to parse — e.g. an unexpected
 * string from the API. */
export default function MathRender({
  latex,
  displayMode = true,
  className,
}: {
  latex: string;
  displayMode?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: "html",
      });
    } catch {
      return null;
    }
  }, [latex, displayMode]);

  if (html === null) {
    return <code className={className}>{latex}</code>;
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
