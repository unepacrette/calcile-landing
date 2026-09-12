import { useLanguage } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex overflow-hidden rounded-full border border-rule-strong/70 bg-paper-raised/70 font-mono text-xs backdrop-blur-md">
      <button
        type="button"
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        className={`px-3 py-1.5 transition duration-150 active:scale-95 ${
          lang === "fr" ? "bg-mark text-paper-raised" : "text-ink-soft hover:bg-paper"
        }`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-3 py-1.5 transition duration-150 active:scale-95 ${
          lang === "en" ? "bg-mark text-paper-raised" : "text-ink-soft hover:bg-paper"
        }`}
      >
        EN
      </button>
    </div>
  );
}
