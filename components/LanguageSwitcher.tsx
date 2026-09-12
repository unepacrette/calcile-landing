import { useLanguage } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex overflow-hidden rounded-full border border-gray-300/70 bg-white/70 text-xs font-semibold shadow-sm backdrop-blur-md">
      <button
        type="button"
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        className={`px-3 py-1.5 transition duration-150 active:scale-95 ${
          lang === "fr" ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-3 py-1.5 transition duration-150 active:scale-95 ${
          lang === "en" ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        EN
      </button>
    </div>
  );
}
