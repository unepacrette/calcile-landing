import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

type PrivacyNoticeProps = {
  text: string;
  // The waitlist form sits on a dark bg-ink section, every other form on
  // a light paper surface.
  tone?: "light" | "dark";
  className?: string;
};

// Short GDPR information notice shown under each form (art. 13 RGPD):
// what the data is for, plus a link to the full privacy policy.
export default function PrivacyNotice({ text, tone = "light", className = "" }: PrivacyNoticeProps) {
  const { t } = useLanguage();
  const textClass = tone === "dark" ? "text-paper-raised/70" : "text-ink-soft";
  const linkClass =
    tone === "dark"
      ? "font-semibold text-paper-raised underline underline-offset-2"
      : "font-semibold text-mark-strong hover:underline";

  return (
    <p className={`text-xs leading-relaxed ${textClass} ${className}`}>
      {text}{" "}
      <Link href="/privacy" className={linkClass}>
        {t.privacyNotice.linkLabel}
      </Link>
    </p>
  );
}
