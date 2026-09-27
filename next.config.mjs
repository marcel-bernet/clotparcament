// Static export for GitHub Pages: `npm run build` writes plain files to ./out
// In production the site lives under /clotparcament (https://marcel-bernet.github.io/clotparcament/).
const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: isProd ? "/clotparcament" : "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
