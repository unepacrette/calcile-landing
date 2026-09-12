import type { AppProps } from "next/app";
import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "@/styles/globals.css";
import "katex/dist/katex.min.css";

// The three roles the "Encre & Preuve" identity needs (see
// styles/globals.css's --font-* tokens): Fraunces for display headings
// (a serif with real character, not another Inter/Space Grotesk),
// Source Sans 3 for body/UI text, IBM Plex Mono for prices, step
// numbers, and anything tabular. Loaded once here (next/font/google
// self-hosts and subsets automatically) and exposed as CSS variables so
// globals.css's @theme tokens can reference them.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <div className={`${fraunces.variable} ${sourceSans.variable} ${plexMono.variable}`}>
        <Component {...pageProps} />
      </div>
    </LanguageProvider>
  );
}
