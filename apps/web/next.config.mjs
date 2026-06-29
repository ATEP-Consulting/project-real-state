/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@herrera/config"],
  // Linting is owned by the root `pnpm lint` (flat ESLint); the Next ESLint plugin lands in D1.
  // `next build` still type-checks the app (our app type gate).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
