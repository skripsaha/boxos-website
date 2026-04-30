import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@libsql/client", "@libsql/isomorphic-fetch", "libsql"],
};

export default config;
