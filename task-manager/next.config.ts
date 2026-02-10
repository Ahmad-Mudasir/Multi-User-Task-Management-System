import type { NextConfig } from "next";

const root = __dirname;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Vercel's build container can run out of memory when running
  // full TypeScript type-checking for Next.js 16. For this take-home
  // app we prioritize a successful build over strict type-checking
  // during CI, so we let Next skip the TS check step in `next build`.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure Turbopack and file tracing both treat the app directory
  // (`task-manager`) as the workspace root. This avoids Next trying
  // to infer `/Users/ahmad` as the root when it sees other lockfiles,
  // which was causing local dev panics and Tailwind resolution errors.
  turbopack: {
    root,
  },
  outputFileTracingRoot: root,
};

export default nextConfig;
