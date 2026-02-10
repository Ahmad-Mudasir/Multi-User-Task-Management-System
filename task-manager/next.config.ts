import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Prevent Next from inferring an incorrect monorepo/workspace root
    // when other lockfiles exist outside this project directory.
    root: __dirname,
  },
};

export default nextConfig;
