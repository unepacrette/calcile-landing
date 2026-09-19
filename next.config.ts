import type { NextConfig } from "next";

// Security audit finding (frontend, report-only per security-auditor
// convention -- this is the coordinating session applying the one real
// fix it surfaced): no security headers were set at all, confirmed
// directly via a real response (curl -D- against a local dev server
// showed none of these present). Concrete risk for THIS app: /login (a
// credential form) and /profile (billing actions -- subscribe, manage-
// subscription buttons) had no clickjacking protection, a realistic,
// low-effort UI-redress attack Vercel doesn't add by default. A full
// Content-Security-Policy is deliberately deferred -- KaTeX
// (components/MathRender.tsx) injects inline `style` attributes for
// math layout on every rendered formula, so a strict CSP needs either
// `style-src 'unsafe-inline'` (weakening the policy on the one vector
// that already tested clean -- see the audit's XSS findings) or a
// nonce/hash strategy per render, which is real design work, not a
// one-line addition; tracked as a real follow-up, not silently dropped.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
