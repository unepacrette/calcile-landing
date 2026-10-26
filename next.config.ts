import type { NextConfig } from "next";

// Security headers (audit findings, applied by the coordinating session):
// X-Frame-Options / X-Content-Type-Options / Referrer-Policy protect
// /login (a credential form) and /profile (billing actions) against
// clickjacking, content sniffing and referrer leakage — none of which
// Vercel adds by default.
//
// Content-Security-Policy (audit finding M-1: no CSP was set at all,
// confirmed live on calcile.fr). Every resource the app loads was
// enumerated from the production build: scripts, stylesheets, fonts and
// images are all same-origin (next/font self-hosts, KaTeX fonts are
// bundled into /_next/static/media, no analytics or third-party script
// exists), the only cross-origin fetch target is the API (lib/api.ts —
// web-production-853a5.up.railway.app, verified in the deployed bundle),
// and there are no iframes, objects or workers. Two directives encode the
// app's real shape:
// - style-src 'unsafe-inline': KaTeX's HTML output (components/
//   MathRender.tsx) and MathInput's React style props inject inline style
//   attributes; the audit's XSS findings tested clean, so inline *styles*
//   are the accepted trade here.
// - script-src 'self': only valid because the site builds with webpack
//   (see package.json scripts). Turbopack emits one executable inline
//   script per page (the globalThis["TURBOPACK"].push(...) chunk
//   bootstrap), which 'self' blocks; hashing it would break on every
//   chunk reshuffle, and a nonce can't work on statically prerendered
//   pages. Keep build/dev on --webpack while this CSP is in place.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' https://web-production-853a5.up.railway.app",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
