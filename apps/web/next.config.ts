import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/contracts", "@repo/domain"],
};

export default nextConfig;
