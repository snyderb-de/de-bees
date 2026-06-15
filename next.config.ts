import type { NextConfig } from "next";

// The GitHub Pages project site serves from /<repo>, so that build needs a
// basePath/assetPrefix. Vercel and local `next dev` serve from the root and
// must NOT have it. The Pages workflow sets GITHUB_PAGES=true; everywhere else
// (Vercel, dev) leaves it unset.
const repo = "de-bees";
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isPages ? `/${repo}` : "",
  assetPrefix: isPages ? `/${repo}/` : "",
};

export default nextConfig;
