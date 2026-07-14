import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],

  async redirects() {
    return [
      // Canonical: non-www → www (permanent 301)
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "nexguild.in" }],
        destination: "https://www.nexguild.in/:path*",
        permanent:   true,
      },
    ];
  },
};

export default nextConfig;
