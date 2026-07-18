import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy (defense-in-depth; the app has no known XSS sink).
//   - script-src keeps 'unsafe-inline': Next.js emits inline bootstrap scripts
//     (RSC payload, hydration) with no nonce on statically-rendered pages, so a
//     nonce-less strict policy would block them and break hydration. A nonce
//     would force every page to dynamic rendering (kills static/PPR/CDN cache) —
//     not worth it for a static, auth-less, no-sensitive-data app. External
//     scripts are still confined to 'self'.
//   - 'unsafe-eval' is dev-only (React uses eval for enhanced error stacks).
//   - style-src 'unsafe-inline': Next/Tailwind inject inline <style>.
//   - img-src allows data: (signature-field canvas → data URL) and blob:.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
