/** @type {import('next').NextConfig} */
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@herrera/config", "@herrera/db"],
  // Linting is owned by the root `pnpm lint` (flat ESLint); the Next ESLint plugin lands in D1.
  // `next build` still type-checks the app (our app type gate).
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [{ source: "/robots.txt", destination: "/api/robots" }];
  },
  async headers() {
    if (!isDemo) return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
