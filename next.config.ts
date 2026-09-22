import type { NextConfig } from "next";

// GitHub Pages serves this repo at /todo/, not the domain root, so the
// production build needs a basePath — but only for the Pages build, not
// local dev/preview. The workflow sets GITHUB_PAGES=true before building.
const basePath = process.env.GITHUB_PAGES ? "/todo" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
};

export default nextConfig;
