import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  transpilePackages: [
    "@certibuy/domain",
    "@certibuy/contracts",
    "@certibuy/application",
  ],
};

export default nextConfig;
