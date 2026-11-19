import type { NextConfig } from "next";

// Static export for GitHub Pages (w-3f.com). Every route is pre-rendered to out/<route>/index.html.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
