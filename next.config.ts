import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],

  async redirects() {
    return [
      // Canonical: www → non-www (permanent 301)
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "www.nexguild.in" }],
        destination: "https://nexguild.in/:path*",
        permanent:   true,
      },
    ];
  },
};

export default nextConfig;
