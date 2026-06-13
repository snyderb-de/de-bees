import type { NextConfig } from "next";

// Project-page deploy on GitHub Pages serves the site from /<repo>.
// We only apply the basePath/assetPrefix for production builds so local
// `next dev` keeps working at the root.
const repo = "de-bees";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
};

export default nextConfig;
