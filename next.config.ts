import type { NextConfig } from "next";

const publicAssetBaseUrl = process.env.NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL;
const remoteUrl = publicAssetBaseUrl ? new URL(publicAssetBaseUrl) : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  images: remoteUrl
    ? {
        remotePatterns: [
          {
            protocol: remoteUrl.protocol.replace(":", "") as "http" | "https",
            hostname: remoteUrl.hostname,
            port: remoteUrl.port || "",
            pathname: `${remoteUrl.pathname.replace(/\/$/, "") || ""}/**`,
          },
        ],
      }
    : undefined,
  async redirects() {
    return [
      {
        source: "/seller",
        destination: "/mybarn",
        permanent: false,
      },
      {
        source: "/seller/:path*",
        destination: "/mybarn/:path*",
        permanent: false,
      },
      {
        source: "/sellers/:slug",
        destination: "/barn/:slug",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
