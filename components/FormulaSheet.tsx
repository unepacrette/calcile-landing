import { useState } from "react";
import MathRender from "@/components/MathRender";
import { useLanguage } from "@/lib/i18n";
import { FORMULA_CATEGORIES } from "@/lib/formulaSheet";

// A static reference sheet next to the calculation bar ("des fiches de
// formule résumé ... à côté de ces calculs") -- trig identities, Taylor
// series, common derivatives/antiderivatives, algebraic identities.
// Nothing here is computed or sent anywhere; it's the same standard
// textbook formulas regardless of what's typed in the bar above.
export default function FormulaSheet() {
  const { t } = useLanguage();
  const [panelOpen, setPanelOpen] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  function toggleCategory(id: string) {
    setOpenCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <aside className="mt-10 lg:sticky lg:top-24 lg:mt-0">
      <div className="rounded-xl border border-rule bg-paper-raised">
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? t.formulaSheet.toggleHide : t.formulaSheet.toggleShow}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-150 hover:bg-paper active:scale-95"
        >
          <span className="font-display text-base font-semibold text-ink">
            {t.formulaSheet.heading}
          </span>
          <span
            aria-hidden="true"
            className={`text-ink-faint transition-transform duration-200 ${panelOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>

        {panelOpen && (
          <div className="space-y-1 border-t border-rule px-2 pb-2 pt-1">
            {FORMULA_CATEGORIES.map((category) => {
              const isOpen = openCategories.has(category.id);
              return (
                <div key={category.id}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper active:scale-95"
                  >
                    <span>{t.formulaSheet.categories[category.id]}</span>
                    <span
                      aria-hidden="true"
                      className={`text-ink-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="space-y-2.5 px-2 pb-3 pt-1">
                      {category.formulas.map((formula) => (
                        <li key={formula.id}>
                          <p className="text-xs font-medium text-ink-faint">
                            {t.formulaSheet.formulas[formula.id]}
                          </p>
                          <div className="mt-0.5 overflow-x-auto text-sm text-ink">
                            <MathRender latex={formula.latex} displayMode={false} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
