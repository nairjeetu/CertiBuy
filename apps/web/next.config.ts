import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@certibuy/domain",
    "@certibuy/contracts",
    "@certibuy/application",
  ],
};

export default nextConfig;
